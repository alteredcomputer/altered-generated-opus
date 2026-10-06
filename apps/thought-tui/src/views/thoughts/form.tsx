import { useTerminalDimensions } from "@opentui/react"
import { type ReactNode, useState } from "react"
import { useUi } from "../../config/provider.tsx"
import { newId, type Schema, type Thought, validateValue } from "../../data/model.ts"
import { useStore } from "../../data/store.tsx"
import { createDataset, deleteThoughts, saveThought } from "../../data/writes.ts"
import type { Action } from "../../shell/action.ts"
import { confirm } from "../../shell/confirm.tsx"
import { Frame, type HelpEntry } from "../../shell/frame.tsx"
import { useNavigation } from "../../shell/navigation.tsx"
import { showToast, trackActivity } from "../../shell/toast.ts"
import { Field } from "../../ui/field.tsx"
import { matches } from "../../ui/keys.ts"
import { width as cellsOf } from "../../ui/text.ts"
import { inset } from "../../ui/theme.ts"
import { DatasetPicker } from "../datasets/picker.tsx"
import { accept, currentToken, splitNames, suggest, unknownNames } from "./datasets-field.ts"

type ThoughtFormProps = { thought?: Thought; datasetIds?: string[]; onSaved?: (id: string) => void }

type FieldKey = "alias" | "content" | "datasets" | `attr:${string}`

const help: HelpEntry[] = [
    { title: "Next Field", hint: "⇥ ↓", section: "Navigate" },
    { title: "Previous Field", hint: "⇧⇥ ↑", section: "Navigate" },
    { title: "Next Suggestion", hint: "^⇥ ^N", section: "Navigate" },
    { title: "Previous Suggestion", hint: "^⇧⇥ ^P", section: "Navigate" },
    { title: "Select All Text", hint: "^A", section: "Navigate" }
]
const VALIDATION_MS = 500
const MAX_SUGGESTIONS = 5

/**
 * Create or edit a thought, app style (D174): exactly one field has focus and the caret, Tab and
 * the arrows move it, a click moves it, Ctrl-S saves. Attributes come only from the thought's
 * datasets: each shows where it came from and, when empty, the attribute's description; its schema
 * appears only as a validation error, in the attention colour, after you leave the field. Datasets
 * are typed as names with suggestions, checked in the background when you leave the field (or
 * picked from a list, with `form.datasets: "picker"`).
 */
export function ThoughtForm({ thought, datasetIds: initialIds = [], onSaved }: ThoughtFormProps) {
    const store = useStore()
    const { datasets, schemas, datasetById } = store
    const { config, colors } = useUi()
    const { push, pop } = useNavigation()
    const screen = useTerminalDimensions()

    const valuesOf = (t?: Thought) =>
        Object.fromEntries(
            (t?.attributes ?? []).filter(a => a.schemaId).map(a => [a.schemaId as string, a.value])
        )
    const [initial] = useState(() => ({
        alias: thought?.alias ?? "",
        content: thought?.content ?? "",
        datasets: (thought?.datasetIds ?? initialIds)
            .map(id => datasetById.get(id)?.alias ?? "")
            .join(", "),
        values: valuesOf(thought)
    }))
    const [alias, setAlias] = useState(initial.alias)
    const [content, setContent] = useState(initial.content)
    const [datasetText, setDatasetText] = useState(initial.datasets)
    const [values, setValues] = useState<Record<string, string>>(initial.values)
    const [errors, setErrors] = useState<Record<string, string | undefined>>({})
    const [index, setIndex] = useState(0)
    const [suggestion, setSuggestion] = useState(0)

    const chosen = splitNames(datasetText)
        .map(name => datasets.find(d => d.alias.toLowerCase() === name.toLowerCase()))
        .filter(d => d !== undefined)
    const fieldSchemas = chosen.flatMap(dataset => schemas.filter(s => s.datasetId === dataset.id))
    const keys: FieldKey[] = [
        "alias",
        "content",
        "datasets",
        ...fieldSchemas.map(s => `attr:${s.id}` as const)
    ]
    const focusedKey = keys[Math.min(index, keys.length - 1)] ?? "alias"
    const dirty =
        JSON.stringify({ alias, content, datasets: splitNames(datasetText).join(), values }) !==
        JSON.stringify({ ...initial, datasets: splitNames(initial.datasets).join() })

    const typedMode = config.form.datasets === "text"
    const token = currentToken(datasetText)
    const options =
        typedMode && focusedKey === "datasets"
            ? [
                  ...suggest(datasetText, datasets)
                      .slice(0, MAX_SUGGESTIONS)
                      .map(d => ({ id: d.id, title: d.alias, create: false })),
                  ...(token && !datasets.some(d => d.alias.toLowerCase() === token.toLowerCase())
                      ? [{ id: "create", title: token, create: true }]
                      : [])
              ]
            : []
    const highlighted = options[Math.min(suggestion, options.length - 1)]

    const labelOf = (schema: Schema) =>
        `${datasetById.get(schema.datasetId)?.alias ?? ""} › ${schema.name}`
    const labelWidth = Math.max(10, ...fieldSchemas.map(s => cellsOf(labelOf(s)))) + 3
    const fieldWidth = Math.max(10, screen.width - 2 * inset - labelWidth)

    /** Checks the field being left: schemas synchronously, dataset names after a mock fetch. */
    const validate = (key: FieldKey) => {
        if (key === "datasets") {
            const text = datasetText
            void trackActivity(new Promise(resolve => setTimeout(resolve, VALIDATION_MS))).then(
                () => {
                    const unknown = unknownNames(text, store.datasets)
                    setErrors(current => ({
                        ...current,
                        datasets: unknown.length
                            ? `${unknown.map(n => `"${n}"`).join(", ")} ${unknown.length > 1 ? "do" : "does"} not exist. Create ${unknown.length > 1 ? "them" : "it"} or remove ${unknown.length > 1 ? "them" : "it"}.`
                            : undefined
                    }))
                }
            )
        } else if (key.startsWith("attr:")) {
            const schema = schemas.find(s => `attr:${s.id}` === key)
            const message = schema ? validateValue(schema.type, values[schema.id] ?? "") : null
            setErrors(current => ({ ...current, [key]: message ?? undefined }))
        }
    }

    const focus = (next: number) => {
        const clamped = Math.max(0, Math.min(keys.length - 1, next))
        if (clamped !== index) validate(focusedKey)
        setIndex(clamped)
        setSuggestion(0)
    }

    const acceptOption = (option: (typeof options)[number] | undefined) => {
        if (!option) return
        if (option.create) {
            try {
                store.write(
                    "create dataset",
                    snapshot => createDataset(snapshot, option.title).snapshot
                )
                showToast({ kind: "success", title: "Dataset created", subtitle: option.title })
            } catch (cause) {
                showToast({
                    kind: "failure",
                    title: cause instanceof Error ? cause.message : "Could not create it."
                })
                return
            }
        }
        setDatasetText(accept(datasetText, option.title))
        setSuggestion(0)
    }

    const choosePicker = () =>
        push(
            <DatasetPicker
                title="Datasets for this thought"
                initial={chosen.map(d => d.id)}
                onConfirm={ids =>
                    setDatasetText(ids.map(id => datasetById.get(id)?.alias ?? "").join(", "))
                }
            />
        )

    const save = () => {
        const unknown = unknownNames(datasetText, store.datasets)
        const invalid = fieldSchemas.find(s => validateValue(s.type, values[s.id] ?? ""))
        if (unknown.length || invalid) {
            showToast({ kind: "failure", title: "Fix the fields in orange first" })
            for (const key of keys) validate(key)
            return
        }
        try {
            let savedId = ""
            store.write(thought ? "update" : "create", snapshot => {
                const result = saveThought(
                    snapshot,
                    {
                        alias,
                        content,
                        datasetIds: chosen.map(d => d.id),
                        attributes: fieldSchemas.map(s => ({
                            id: thought?.attributes.find(a => a.schemaId === s.id)?.id ?? newId(),
                            name: s.name,
                            value: values[s.id] ?? "",
                            schemaId: s.id
                        }))
                    },
                    thought?.id ?? null
                )
                savedId = result.id
                return result.snapshot
            })
            pop()
            onSaved?.(savedId)
            showToast({ kind: "success", title: thought ? "Thought saved" : "Thought created" })
        } catch (cause) {
            showToast({
                kind: "failure",
                title: cause instanceof Error ? cause.message : "Could not save."
            })
        }
    }

    const leave = async () => {
        if (!dirty) return pop()
        const discard = await confirm({
            title: "Discard changes",
            message: "Leave without saving? Your edits will be lost.",
            confirmLabel: "Discard"
        })
        if (discard) pop()
    }

    const remove = async () => {
        if (!thought) return
        const confirmed = await confirm({
            title: "Delete thought",
            message: "Delete this thought? This cannot be undone.",
            confirmLabel: "Delete"
        })
        if (!confirmed) return
        store.write("delete", snapshot => deleteThoughts(snapshot, [thought.id]))
        pop()
        showToast({ kind: "success", title: "Thought deleted" })
    }

    const actions: Action[] = [
        {
            id: "save",
            title: thought ? "Save Thought" : "Create Thought",
            section: "Thought",
            shortcut: { key: "s", ctrl: true },
            run: save
        },
        {
            id: "picker",
            title: "Pick Datasets",
            section: "Thought",
            shortcut: { key: "t", ctrl: true },
            run: choosePicker
        },
        ...(thought
            ? [
                  {
                      id: "delete",
                      title: "Delete Thought",
                      section: "Thought",
                      danger: true,
                      run: remove
                  }
              ]
            : []),
        {
            id: "back",
            title: dirty ? "Discard Changes" : "Back",
            section: "Thought",
            run: () => void leave()
        }
    ]

    const cycle = (delta: number) =>
        setSuggestion(current =>
            options.length ? (current + delta + options.length) % options.length : 0
        )

    const row = (
        i: number,
        label: ReactNode,
        field: ReactNode,
        error?: string,
        below?: ReactNode
    ) => (
        <box key={keys[i] ?? i} flexDirection="column">
            <box flexDirection="row" height={1} onMouseDown={() => focus(i)}>
                <box width={labelWidth} flexShrink={0}>
                    {label}
                </box>
                {field}
            </box>
            {below}
            {error && (
                <box paddingLeft={labelWidth}>
                    <text fg={colors.attention}>{error}</text>
                </box>
            )}
        </box>
    )
    const plainLabel = (text: string, i: number) => (
        <text fg={index === i ? colors.fg : colors.fgMuted}>{text}</text>
    )
    const field = (
        i: number,
        value: string,
        onChange: (v: string) => void,
        placeholder: string
    ) => (
        <Field
            value={value}
            width={fieldWidth}
            focused={index === i}
            active={index === i}
            placeholder={placeholder}
            onChange={onChange}
        />
    )

    return (
        <Frame
            title={thought ? "Edit Thought" : "Create Thought"}
            heading={thought ? (thought.alias ?? "Untitled thought") : "New thought"}
            status={dirty ? "Unsaved changes" : ""}
            actions={actions}
            help={help}
            onBack={() => void leave()}
            onKey={event => {
                const { name, shift, ctrl } = event
                if (
                    options.length &&
                    (matches(event, { key: "tab", ctrl: true }) || (ctrl && name === "n"))
                )
                    cycle(1)
                else if (
                    options.length &&
                    (matches(event, { key: "tab", ctrl: true, shift: true }) ||
                        (ctrl && name === "p"))
                )
                    cycle(-1)
                else if (name === "return" && highlighted) acceptOption(highlighted)
                else if (name === "return" && focusedKey === "datasets" && !typedMode)
                    choosePicker()
                else if (ctrl) return false
                else if (name === "tab" || name === "down" || name === "return")
                    focus(index + (shift && name === "tab" ? -1 : 1))
                else if (name === "up") focus(index - 1)
                else return false
                return true
            }}
        >
            <scrollbox
                flexGrow={1}
                paddingX={inset}
                paddingY={1}
                verticalScrollbarOptions={{ visible: false }}
            >
                <box flexDirection="column" gap={1}>
                    <box flexDirection="column" gap={config.inspector.gap}>
                        {row(
                            0,
                            plainLabel(`Alias ${config.glyphs.lock}`, 0),
                            field(0, alias, setAlias, "Untitled")
                        )}
                        {row(
                            1,
                            plainLabel(`Content ${config.glyphs.lock}`, 1),
                            field(1, content, setContent, "What is the thought?")
                        )}
                    </box>
                    <box flexDirection="column" gap={config.inspector.gap}>
                        {row(
                            2,
                            plainLabel("Datasets", 2),
                            field(
                                2,
                                datasetText,
                                text => {
                                    setDatasetText(text)
                                    setSuggestion(0)
                                },
                                typedMode
                                    ? "Type dataset names, separated by commas"
                                    : "Press Enter to pick"
                            ),
                            errors.datasets,
                            options.length > 0 && (
                                <box flexDirection="column" paddingLeft={labelWidth}>
                                    {options.map(option => (
                                        <box
                                            key={option.id}
                                            height={1}
                                            width={fieldWidth}
                                            backgroundColor={
                                                option === highlighted ? colors.bgCursor : colors.bg
                                            }
                                            onMouseDown={() => acceptOption(option)}
                                        >
                                            <text
                                                wrapMode="none"
                                                fg={
                                                    option === highlighted
                                                        ? colors.fg
                                                        : colors.fgMuted
                                                }
                                            >
                                                {option.create
                                                    ? `Create "${option.title}"`
                                                    : option.title}
                                            </text>
                                        </box>
                                    ))}
                                </box>
                            )
                        )}
                        {fieldSchemas.map((schema, n) => {
                            const i = 3 + n
                            const key = `attr:${schema.id}` as const
                            return row(
                                i,
                                <text wrapMode="none">
                                    <span
                                        fg={colors.fgFaint}
                                    >{`${datasetById.get(schema.datasetId)?.alias ?? ""} › `}</span>
                                    <span fg={index === i ? colors.fg : colors.fgMuted}>
                                        {schema.name}
                                    </span>
                                </text>,
                                field(
                                    i,
                                    values[schema.id] ?? "",
                                    v => setValues(current => ({ ...current, [schema.id]: v })),
                                    schema.description
                                ),
                                errors[key]
                            )
                        })}
                    </box>
                </box>
            </scrollbox>
        </Frame>
    )
}

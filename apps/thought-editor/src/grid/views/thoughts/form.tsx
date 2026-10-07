import { type ReactNode, useState } from "react"
import {
    type Attribute,
    newId,
    type Schema,
    type Thought,
    validateValue
} from "../../../data/model.ts"
import { useStore } from "../../../data/store.tsx"
import { createDataset, deleteThoughts, saveThought } from "../../../data/writes.ts"
import { useUi } from "../../config/provider.tsx"
import type { Action } from "../../shell/action.ts"
import { confirm } from "../../shell/confirm.tsx"
import { Frame, type HelpEntry } from "../../shell/frame.tsx"
import { host, label, matches, type Shortcut } from "../../shell/keys.ts"
import { useNavigation } from "../../shell/navigation.tsx"
import { showToast, trackActivity } from "../../shell/toast.ts"
import { runWrite } from "../../shell/write.ts"
import {
    Box,
    width as cellsOf,
    Input,
    inset,
    ScrollBox,
    Span,
    Text,
    Textarea,
    useGridSize
} from "../../ui/index.ts"
import { DatasetPicker } from "../datasets/picker.tsx"
import { accept, currentToken, splitNames, suggest, unknownNames } from "./datasets-field.ts"

type ThoughtFormProps = { thought?: Thought; datasetIds?: string[]; onSaved?: (id: string) => void }

type FieldKey = "alias" | "content" | "datasets" | `attr:${string}`

const NEXT_SUGGESTION: Shortcut[] = [
    { key: "tab", ctrl: true },
    { key: "n", ctrl: true },
    { key: "down", alt: true }
]
const PREVIOUS_SUGGESTION: Shortcut[] = [
    { key: "tab", ctrl: true, shift: true },
    { key: "p", ctrl: true },
    { key: "up", alt: true }
]
const VALIDATION_MS = 500
const MAX_SUGGESTIONS = 5
const CONTENT_ROWS = 8

/**
 * Create or edit a thought, app style (D174): exactly one field has focus and the caret, Tab and
 * the arrows move it, a click moves it, the modifier and S save. Attributes come from the
 * thought's datasets: each shows where it came from; its schema appears only as a validation error,
 * in the attention colour, after you leave the field. Datasets are typed as names with suggestions,
 * checked in the background when you leave the field (or picked from a list, with
 * `form.datasets: "picker"`). Attributes the classic editor stored without a schema are kept as
 * they are; the inspector shows them.
 */
export function ThoughtForm({ thought, datasetIds: initialIds = [], onSaved }: ThoughtFormProps) {
    const store = useStore()
    const { datasets, schemas, datasetById } = store
    const { config } = useUi()
    const { push, pop } = useNavigation()
    const screen = useGridSize()
    const keys = (shortcuts: Shortcut[]) =>
        shortcuts.map(shortcut => label(shortcut, config.glyphs, host)).join(" ")
    const help: HelpEntry[] = [
        { title: "Next Field", hint: "⇥ ↓", section: "Navigate" },
        { title: "Previous Field", hint: "⇧⇥ ↑", section: "Navigate" },
        { title: "Next Suggestion", hint: keys(NEXT_SUGGESTION), section: "Navigate" },
        { title: "Previous Suggestion", hint: keys(PREVIOUS_SUGGESTION), section: "Navigate" },
        { title: "Select All Text", hint: keys([{ key: "a", mod: true }]), section: "Navigate" }
    ]

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
    const fieldKeys: FieldKey[] = [
        "alias",
        "content",
        "datasets",
        ...fieldSchemas.map(s => `attr:${s.id}` as const)
    ]
    const focusedKey = fieldKeys[Math.min(index, fieldKeys.length - 1)] ?? "alias"
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
    const fieldWidth = Math.max(10, screen.cols - 2 * inset - labelWidth)

    /** Checks the field being left: schemas at once, dataset names after a mock fetch. */
    const validate = (key: FieldKey) => {
        if (key === "datasets") {
            const text = datasetText
            void trackActivity(new Promise(resolve => setTimeout(resolve, VALIDATION_MS))).then(
                () => {
                    const unknown = unknownNames(text, store.datasets)
                    const many = unknown.length > 1
                    setErrors(current => ({
                        ...current,
                        datasets: unknown.length
                            ? `${unknown.map(n => `"${n}"`).join(", ")} ${many ? "do" : "does"} not exist. Create ${many ? "them" : "it"} or remove ${many ? "them" : "it"}.`
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
        const clamped = Math.max(0, Math.min(fieldKeys.length - 1, next))
        if (clamped !== index) validate(focusedKey)
        setIndex(clamped)
        setSuggestion(0)
    }

    const acceptOption = async (option: (typeof options)[number] | undefined) => {
        if (!option) return
        if (
            option.create &&
            !(await runWrite(createDataset(option.title), "Dataset created", option.title))
        )
            return
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

    /** The dataset fields, then every other attribute the thought already had, kept. */
    const attributesToSave = (): Attribute[] => {
        const fields = new Set(fieldSchemas.map(s => s.id))
        const existing = thought?.attributes ?? []
        const fromFields = fieldSchemas.flatMap(s => {
            const before = existing.find(a => a.schemaId === s.id)
            const value = values[s.id] ?? ""
            return before || value.trim()
                ? [{ id: before?.id ?? newId(), name: s.name, value, schemaId: s.id }]
                : []
        })
        // A schema whose dataset was removed lets go of its attribute, as the classic editor does.
        const others = existing
            .filter(a => !a.schemaId || !fields.has(a.schemaId))
            .map(a => (a.schemaId ? { ...a, schemaId: null } : a))
        return [...fromFields, ...others]
    }

    const save = async () => {
        const unknown = unknownNames(datasetText, store.datasets)
        const invalid = fieldSchemas.find(s => validateValue(s.type, values[s.id] ?? ""))
        if (unknown.length || invalid) {
            showToast({ kind: "failure", title: "Fix the fields in orange first" })
            for (const key of fieldKeys) validate(key)
            return
        }
        let savedId = ""
        const saved = await runWrite(
            saveThought({
                ...(thought && { id: thought.id }),
                alias,
                content,
                datasetIds: chosen.map(d => d.id),
                attributes: attributesToSave()
            }).then(id => {
                savedId = id
            }),
            thought ? "Thought saved" : "Thought created"
        )
        if (!saved) return
        pop()
        onSaved?.(savedId)
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
        if (confirmed && (await runWrite(deleteThoughts([thought.id]), "Thought deleted"))) pop()
    }

    const actions: Action[] = [
        {
            id: "save",
            title: thought ? "Save Thought" : "Create Thought",
            section: "Thought",
            shortcut: { key: "s", mod: true },
            run: () => void save()
        },
        {
            id: "picker",
            title: "Pick Datasets",
            section: "Thought",
            shortcut: { key: "t", mod: true },
            run: choosePicker
        },
        ...(thought
            ? [
                  {
                      id: "delete",
                      title: "Delete Thought",
                      section: "Thought",
                      danger: true,
                      run: () => void remove()
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
        labelNode: ReactNode,
        field: ReactNode,
        error?: string,
        below?: ReactNode
    ) => (
        <Box key={fieldKeys[i] ?? i}>
            <Box flexDirection="row" onMouseDown={() => focus(i)}>
                <Box width={labelWidth} flexShrink={0}>
                    {labelNode}
                </Box>
                {field}
            </Box>
            {below}
            {error && (
                <Box paddingLeft={labelWidth}>
                    <Text fg="attention">{error}</Text>
                </Box>
            )}
        </Box>
    )
    const plainLabel = (text: string, i: number) => (
        <Text fg={index === i ? "fg" : "fgMuted"} wrapMode="none">
            {text}
        </Text>
    )
    const field = (
        i: number,
        value: string,
        onChange: (v: string) => void,
        placeholder: string,
        name: string
    ) => (
        <Input
            label={name}
            value={value}
            width={fieldWidth}
            focused={index === i}
            bg={index === i ? "bgCursor" : "bg"}
            placeholder={placeholder}
            onInput={onChange}
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
            onKey={key => {
                const { name, shift } = key
                if (options.length && NEXT_SUGGESTION.some(s => matches(key, s, host))) cycle(1)
                else if (options.length && PREVIOUS_SUGGESTION.some(s => matches(key, s, host)))
                    cycle(-1)
                else if (name === "return" && highlighted) void acceptOption(highlighted)
                else if (name === "return" && focusedKey === "datasets" && !typedMode)
                    choosePicker()
                else if (key.ctrl || key.meta || key.alt) return false
                else if (name === "tab" || name === "down" || name === "return")
                    focus(index + (shift && name === "tab" ? -1 : 1))
                else if (name === "up") focus(index - 1)
                else return false
                return true
            }}
        >
            <ScrollBox flexGrow={1} paddingX={inset} paddingY={1}>
                <Box gap={1}>
                    <Box gap={config.inspector.gap}>
                        {row(
                            0,
                            plainLabel(`Alias ${config.glyphs.lock}`, 0),
                            field(0, alias, setAlias, "Untitled", "Alias")
                        )}
                        {row(
                            1,
                            plainLabel(`Content ${config.glyphs.lock}`, 1),
                            <Textarea
                                label="Content"
                                value={content}
                                width={fieldWidth}
                                maxRows={CONTENT_ROWS}
                                focused={index === 1}
                                bg={index === 1 ? "bgCursor" : "bg"}
                                placeholder="What is the thought?"
                                onInput={setContent}
                            />
                        )}
                    </Box>
                    <Box gap={config.inspector.gap}>
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
                                    : "Press Enter to pick",
                                "Datasets"
                            ),
                            errors.datasets,
                            options.length > 0 && (
                                <Box paddingLeft={labelWidth}>
                                    {options.map(option => (
                                        <Box
                                            key={option.id}
                                            height={1}
                                            width={fieldWidth}
                                            backgroundColor={
                                                option === highlighted ? "bgCursor" : "bg"
                                            }
                                            onMouseDown={() => void acceptOption(option)}
                                        >
                                            <Text
                                                wrapMode="none"
                                                fg={option === highlighted ? "fg" : "fgMuted"}
                                            >
                                                {option.create
                                                    ? `Create "${option.title}"`
                                                    : option.title}
                                            </Text>
                                        </Box>
                                    ))}
                                </Box>
                            )
                        )}
                        {fieldSchemas.map((schema, n) => {
                            const i = 3 + n
                            const key = `attr:${schema.id}` as const
                            return row(
                                i,
                                <Text wrapMode="none">
                                    <Span fg="fgFaint">{`${datasetById.get(schema.datasetId)?.alias ?? ""} › `}</Span>
                                    <Span fg={index === i ? "fg" : "fgMuted"}>{schema.name}</Span>
                                </Text>,
                                field(
                                    i,
                                    values[schema.id] ?? "",
                                    v => setValues(current => ({ ...current, [schema.id]: v })),
                                    "Empty",
                                    labelOf(schema)
                                ),
                                errors[key]
                            )
                        })}
                    </Box>
                </Box>
            </ScrollBox>
        </Frame>
    )
}

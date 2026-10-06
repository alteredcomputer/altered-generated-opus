import type { TextareaRenderable } from "@opentui/core"
import { type ReactNode, useRef, useState } from "react"
import { type Attribute, newId, type Thought } from "../../data/model.ts"
import { useStore } from "../../data/store.tsx"
import { deleteThoughts, detachSchemas, saveThought } from "../../data/writes.ts"
import type { Action } from "../../shell/action.ts"
import { confirm } from "../../shell/confirm.tsx"
import { Frame, type HelpEntry } from "../../shell/frame.tsx"
import { useNavigation } from "../../shell/navigation.tsx"
import { Palette } from "../../shell/palette.tsx"
import { showToast } from "../../shell/toast.ts"
import { color, inset } from "../../ui/theme.ts"
import { DatasetPicker } from "../datasets/picker.tsx"
import { Chips, Heading } from "../markdown.tsx"

type ThoughtFormProps = {
    thought?: Thought
    datasetIds?: string[]
    onSaved?: (id: string) => void
}

type Field =
    | { kind: "alias" | "content" | "datasets" }
    | { kind: "name" | "value"; attributeId: string }

const LABEL_WIDTH = 12
const CONTENT_HEIGHT = 5

const help: HelpEntry[] = [
    { title: "Next Field", hint: "j ⇥" },
    { title: "Previous Field", hint: "k ⇧⇥" },
    { title: "Edit Field", hint: "⏎ i" },
    { title: "Stop Editing", hint: "esc" },
    { title: "Back", hint: "esc q" }
]

/**
 * Create or edit a thought, vim style: the cursor walks the fields in normal mode, Enter or i types
 * into one, Escape stops typing, Ctrl-S saves from either mode. Leaving with unsaved changes asks
 * first. Datasets open the picker; attributes take a name, a value, and optionally a schema.
 */
export function ThoughtForm({
    thought,
    datasetIds: initialDatasetIds = [],
    onSaved
}: ThoughtFormProps) {
    const store = useStore()
    const { datasetById, schemaById, schemas } = store
    const { push, pop } = useNavigation()

    const [initial] = useState(() => ({
        alias: thought?.alias ?? "",
        content: thought?.content ?? "",
        datasetIds: thought?.datasetIds ?? initialDatasetIds,
        attributes: thought?.attributes ?? []
    }))
    const [alias, setAlias] = useState(initial.alias)
    const [content, setContent] = useState(initial.content)
    const [datasetIds, setDatasetIds] = useState(initial.datasetIds)
    const [attributes, setAttributes] = useState(initial.attributes)
    const [index, setIndex] = useState(0)
    const [editing, setEditing] = useState(!thought)
    const [schemaFor, setSchemaFor] = useState<Attribute | null>(null)
    const textarea = useRef<TextareaRenderable>(null)

    const draft = { alias, content, datasetIds, attributes }
    const dirty = JSON.stringify(draft) !== JSON.stringify(initial)

    const fields: Field[] = [
        { kind: "alias" },
        { kind: "content" },
        { kind: "datasets" },
        ...attributes.flatMap(a => [
            { kind: "name", attributeId: a.id } as const,
            { kind: "value", attributeId: a.id } as const
        ])
    ]
    const field = fields[Math.min(index, fields.length - 1)] ?? { kind: "alias" }
    const attribute =
        "attributeId" in field ? attributes.find(a => a.id === field.attributeId) : undefined
    const isActive = (kind: Field["kind"], attributeId?: string) =>
        field.kind === kind &&
        (!attributeId || ("attributeId" in field && field.attributeId === attributeId))

    const step = (delta: number, keepEditing: boolean) => {
        const next = Math.max(0, Math.min(fields.length - 1, index + delta))
        setIndex(next)
        setEditing(keepEditing && fields[next]?.kind !== "datasets")
    }

    const updateAttribute = (id: string, change: Partial<Attribute>) =>
        setAttributes(current => current.map(a => (a.id === id ? { ...a, ...change } : a)))

    const addAttribute = () => {
        setAttributes(current => [...current, { id: newId(), name: "", value: "", schemaId: null }])
        setIndex(fields.length)
        setEditing(true)
    }

    const removeAttribute = (id: string) => {
        setAttributes(current => current.filter(a => a.id !== id))
        setIndex(Math.max(0, fields.findIndex(f => "attributeId" in f && f.attributeId === id) - 1))
    }

    const chooseDatasets = () =>
        push(
            <DatasetPicker
                title="Datasets for this thought"
                initial={datasetIds}
                onConfirm={ids => {
                    setDatasetIds(ids)
                    setAttributes(current => detachSchemas(store, current, ids))
                }}
            />
        )

    const assignSchema = (target: Attribute, schemaId: string | null) => {
        const schema = schemaId ? schemaById.get(schemaId) : undefined
        updateAttribute(target.id, {
            schemaId,
            ...(schema && !target.name.trim() && { name: schema.name })
        })
        if (schema && !datasetIds.includes(schema.datasetId))
            setDatasetIds(current => [...current, schema.datasetId])
    }

    const save = () => {
        try {
            let savedId = ""
            store.write(thought ? "update" : "create", snapshot => {
                const result = saveThought(snapshot, draft, thought?.id ?? null)
                savedId = result.id
                return result.snapshot
            })
            pop()
            onSaved?.(savedId)
            showToast(thought ? "Thought saved" : "Thought created")
        } catch (cause) {
            showToast(cause instanceof Error ? cause.message : "Could not save.")
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
        showToast("Thought deleted")
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
            id: "datasets",
            title: "Select Datasets",
            section: "Thought",
            shortcut: { key: "t" },
            run: chooseDatasets
        },
        {
            id: "add",
            title: "Add Attribute",
            section: "Attributes",
            shortcut: { key: "a" },
            run: addAttribute
        },
        ...(attribute
            ? [
                  {
                      id: "schema",
                      title: "Assign Schema",
                      section: "Attributes",
                      shortcut: { key: "s" },
                      run: () => setSchemaFor(attribute)
                  },
                  {
                      id: "remove",
                      title: "Remove Attribute",
                      section: "Attributes",
                      shortcut: { key: "x" },
                      run: () => removeAttribute(attribute.id)
                  }
              ]
            : []),
        ...(thought
            ? [{ id: "delete", title: "Delete Thought", section: "Thought", run: remove }]
            : []),
        { id: "discard", title: dirty ? "Discard Changes" : "Back", section: "Thought", run: leave }
    ]

    const input = (
        kind: "alias" | "name" | "value",
        value: string,
        onChange: (v: string) => void,
        placeholder: string,
        attributeId?: string
    ) => {
        const active = isActive(kind, attributeId)
        return (
            <input
                flexGrow={1}
                focused={active && editing}
                value={value}
                placeholder={placeholder}
                placeholderColor={color.fgFaint}
                textColor={color.fg}
                focusedTextColor={color.fg}
                backgroundColor={active ? color.bgCursor : color.bg}
                focusedBackgroundColor={color.bgCursor}
                cursorColor={color.fg}
                onInput={onChange}
            />
        )
    }

    return (
        <Frame
            title={thought ? "Edit Thought" : "Create Thought"}
            heading={thought ? (thought.alias ?? "Untitled thought") : "New thought"}
            status={editing ? "-- INSERT --" : dirty ? "unsaved changes" : ""}
            actions={actions}
            help={help}
            typing={editing}
            onKey={event => {
                const { name, shift, ctrl } = event
                if (editing) {
                    if (name === "escape") setEditing(false)
                    else if (name === "tab") step(shift ? -1 : 1, true)
                    else if (name === "return" && field.kind !== "content") setEditing(false)
                    else return false
                    return true
                }
                if (ctrl) return false
                if (name === "j" || name === "down" || (name === "tab" && !shift)) step(1, false)
                else if (name === "k" || name === "up" || (name === "tab" && shift)) step(-1, false)
                else if (name === "return" || name === "i")
                    field.kind === "datasets" ? chooseDatasets() : setEditing(true)
                else if (name === "escape" || name === "q") void leave()
                else return false
                return true
            }}
            overlay={
                schemaFor && (
                    <Palette
                        placeholder="Search schemas..."
                        onClose={() => setSchemaFor(null)}
                        items={[
                            {
                                id: "none",
                                title: "No Schema",
                                checked: schemaFor.schemaId === null,
                                run: () => assignSchema(schemaFor, null)
                            },
                            ...schemas.map(schema => ({
                                id: schema.id,
                                title: `${schema.name}:${schema.type}`,
                                section: datasetById.get(schema.datasetId)?.alias ?? "",
                                checked: schema.id === schemaFor.schemaId,
                                run: () => assignSchema(schemaFor, schema.id)
                            }))
                        ]}
                    />
                )
            }
        >
            <scrollbox
                flexGrow={1}
                paddingX={inset}
                paddingY={1}
                verticalScrollbarOptions={{ visible: false }}
            >
                <box flexDirection="column" gap={1}>
                    <Row label="alias" active={isActive("alias")}>
                        {input("alias", alias, setAlias, "Untitled")}
                    </Row>
                    <Row label="content" active={isActive("content")} height={CONTENT_HEIGHT}>
                        <textarea
                            ref={textarea}
                            flexGrow={1}
                            height={CONTENT_HEIGHT}
                            focused={isActive("content") && editing}
                            initialValue={content}
                            placeholder="What is the thought?"
                            placeholderColor={color.fgFaint}
                            wrapMode="word"
                            textColor={color.fg}
                            focusedTextColor={color.fg}
                            backgroundColor={isActive("content") ? color.bgCursor : color.bg}
                            focusedBackgroundColor={color.bgCursor}
                            cursorColor={color.fg}
                            onContentChange={() => setContent(textarea.current?.plainText ?? "")}
                        />
                    </Row>
                    <Row label="datasets" active={isActive("datasets")}>
                        <box
                            flexGrow={1}
                            backgroundColor={isActive("datasets") ? color.bgCursor : color.bg}
                        >
                            <Chips
                                labels={datasetIds.map(id => datasetById.get(id)?.alias ?? "")}
                            />
                        </box>
                    </Row>

                    <Heading level={2}>Attributes</Heading>
                    {attributes.length === 0 && (
                        <text fg={color.fgFaint}>None. Press a to add one.</text>
                    )}
                    {attributes.map(a => {
                        const schema = a.schemaId ? schemaById.get(a.schemaId) : undefined
                        const dataset = schema && datasetById.get(schema.datasetId)
                        return (
                            <box key={a.id} flexDirection="row" gap={2}>
                                <box width={LABEL_WIDTH - 2} flexShrink={0}>
                                    {input(
                                        "name",
                                        a.name,
                                        name => updateAttribute(a.id, { name }),
                                        "name",
                                        a.id
                                    )}
                                </box>
                                <box flexGrow={1}>
                                    {input(
                                        "value",
                                        a.value,
                                        value => updateAttribute(a.id, { value }),
                                        "value",
                                        a.id
                                    )}
                                </box>
                                <text flexShrink={0} fg={color.fgFaint}>
                                    {schema && dataset
                                        ? `${dataset.alias}/${schema.name}:${schema.type}`
                                        : "no schema"}
                                </text>
                            </box>
                        )
                    })}
                </box>
            </scrollbox>
        </Frame>
    )
}

function Row({
    label,
    active,
    height = 1,
    children
}: {
    label: string
    active: boolean
    height?: number
    children: ReactNode
}) {
    return (
        <box flexDirection="row" height={height}>
            <text width={LABEL_WIDTH} flexShrink={0} fg={active ? color.fg : color.fgFaint}>
                {label}
            </text>
            {children}
        </box>
    )
}

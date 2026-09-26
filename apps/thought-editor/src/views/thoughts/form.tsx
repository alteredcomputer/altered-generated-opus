import { useState } from "react"
import { type Attribute, newId, type Thought } from "../../data/model.ts"
import { useStore } from "../../data/store.tsx"
import { deleteThoughts, saveThought } from "../../data/writes.ts"
import { shortcutKeys } from "../../keyboard/shortcut.ts"
import type { Action } from "../../shell/action.ts"
import { confirm } from "../../shell/confirm.tsx"
import { runWrite } from "../../shell/feedback.ts"
import { Frame } from "../../shell/frame.tsx"
import { useNavigation } from "../../shell/navigation.tsx"
import { Keys } from "../../ui/kbd.tsx"
import { DatasetPicker } from "../datasets/picker.tsx"
import { escapeForm, useFocusOnRender } from "../form-helpers.ts"
import "../form.css"

type ThoughtFormProps = {
    thought?: Thought
    datasetIds?: string[]
    onSaved?: (id: string) => void
}

const ADD_ATTRIBUTE = { key: "a", ctrl: true }
const SELECT_DATASETS = { key: "d", ctrl: true }

export function ThoughtForm({
    thought,
    datasetIds: initialDatasetIds = [],
    onSaved
}: ThoughtFormProps) {
    const { datasets, schemas, datasetById, schemaById } = useStore()
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
    const [saving, setSaving] = useState(false)
    const focusOnRender = useFocusOnRender()

    const draft = { alias, content, datasetIds, attributes }
    const dirty = JSON.stringify(draft) !== JSON.stringify(initial)

    const updateAttribute = (id: string, change: Partial<Attribute>) =>
        setAttributes(current => current.map(a => (a.id === id ? { ...a, ...change } : a)))

    const addAttribute = () => {
        const id = newId()
        focusOnRender(id)
        setAttributes(current => [...current, { id, name: "", value: "", schemaId: null }])
    }

    const assignSchema = (attribute: Attribute, schemaId: string | null) => {
        const schema = schemaId ? schemaById.get(schemaId) : undefined
        updateAttribute(attribute.id, {
            schemaId,
            ...(schema && !attribute.name.trim() && { name: schema.name })
        })
        if (schema && !datasetIds.includes(schema.datasetId))
            setDatasetIds(current => [...current, schema.datasetId])
    }

    const chooseDatasets = () =>
        push(
            <DatasetPicker
                title="Datasets for this thought"
                initial={datasetIds}
                onConfirm={ids => {
                    setDatasetIds(ids)
                    setAttributes(current =>
                        current.map(attribute => {
                            const schema = attribute.schemaId && schemaById.get(attribute.schemaId)
                            return schema && !ids.includes(schema.datasetId)
                                ? { ...attribute, schemaId: null }
                                : attribute
                        })
                    )
                }}
            />
        )

    const save = async () => {
        if (saving) return
        setSaving(true)
        const id = await runWrite(
            saveThought({ ...draft, ...(thought && { id: thought.id }) }),
            thought ? "Thought saved" : "Thought captured"
        )
        setSaving(false)
        if (id === undefined) return
        pop()
        onSaved?.(id)
    }

    const remove = async () => {
        if (!thought) return
        const confirmed = await confirm({
            title: "Delete thought",
            message: "Delete this thought? This cannot be undone.",
            confirmLabel: "Delete"
        })
        if (
            confirmed &&
            (await runWrite(deleteThoughts([thought.id]), "Thought deleted")) !== undefined
        )
            pop()
    }

    const actions: Action[] = [
        {
            id: "save",
            title: thought ? "Save Thought" : "Capture Thought",
            section: "Form",
            shortcut: { key: "enter", mod: true },
            run: save
        },
        {
            id: "add-attribute",
            title: "Add Attribute",
            section: "Form",
            shortcut: ADD_ATTRIBUTE,
            run: addAttribute
        },
        {
            id: "datasets",
            title: "Select Datasets",
            section: "Form",
            shortcut: SELECT_DATASETS,
            run: chooseDatasets
        },
        ...(thought
            ? [
                  {
                      id: "delete",
                      title: "Delete Thought",
                      section: "Thought",
                      shortcut: { key: "x", ctrl: true },
                      destructive: true,
                      run: remove
                  }
              ]
            : [])
    ]

    return (
        <Frame
            title={thought ? "Edit Thought" : "Capture Thought"}
            status={dirty ? "unsaved" : ""}
            actions={actions}
            onEscape={() => escapeForm(dirty, pop)}
        >
            <form className="form" onSubmit={event => event.preventDefault()}>
                <label className="form-label" htmlFor="alias">
                    Alias
                </label>
                <input
                    id="alias"
                    data-autofocus
                    className="field"
                    placeholder="A short name for the thought"
                    value={alias}
                    onChange={event => setAlias(event.target.value)}
                />

                <label className="form-label" htmlFor="content">
                    Content
                </label>
                <textarea
                    id="content"
                    className="field field-content"
                    placeholder="The thought itself"
                    value={content}
                    onChange={event => setContent(event.target.value)}
                />

                <span className="form-label">Datasets</span>
                <button type="button" className="field field-button" onClick={chooseDatasets}>
                    <span className="inspector-chips">
                        {datasetIds.length === 0 && <span className="faint">None</span>}
                        {datasetIds.map(id => (
                            <span key={id} className="chip">
                                {datasetById.get(id)?.alias}
                            </span>
                        ))}
                    </span>
                    <Keys keys={shortcutKeys(SELECT_DATASETS)} />
                </button>

                <span className="form-label">Attributes</span>
                <div className="attributes">
                    {attributes.map(attribute => (
                        <div key={attribute.id} className="attribute">
                            <input
                                data-focus-key={attribute.id}
                                className="field"
                                placeholder="name"
                                aria-label="Attribute name"
                                value={attribute.name}
                                onChange={event =>
                                    updateAttribute(attribute.id, { name: event.target.value })
                                }
                            />
                            <input
                                className="field"
                                placeholder="value"
                                aria-label="Attribute value"
                                value={attribute.value}
                                onChange={event =>
                                    updateAttribute(attribute.id, { value: event.target.value })
                                }
                            />
                            <select
                                className="field"
                                aria-label="Attribute schema"
                                value={attribute.schemaId ?? ""}
                                onChange={event =>
                                    assignSchema(attribute, event.target.value || null)
                                }
                            >
                                <option value="">No schema</option>
                                {datasets.map(dataset => {
                                    const own = schemas.filter(s => s.datasetId === dataset.id)
                                    if (own.length === 0) return null
                                    return (
                                        <optgroup key={dataset.id} label={dataset.alias}>
                                            {own.map(schema => (
                                                <option key={schema.id} value={schema.id}>
                                                    {dataset.alias}/{schema.name}: {schema.type}
                                                </option>
                                            ))}
                                        </optgroup>
                                    )
                                })}
                            </select>
                            <button
                                type="button"
                                className="remove"
                                aria-label="Remove attribute"
                                onClick={() =>
                                    setAttributes(current =>
                                        current.filter(a => a.id !== attribute.id)
                                    )
                                }
                            >
                                ×
                            </button>
                        </div>
                    ))}
                    <button type="button" className="add" onClick={addAttribute}>
                        + Add attribute <Keys keys={shortcutKeys(ADD_ATTRIBUTE)} />
                    </button>
                </div>
            </form>
        </Frame>
    )
}

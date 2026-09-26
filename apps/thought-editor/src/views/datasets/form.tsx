import { useState } from "react"
import { type Dataset, newId, type SchemaType, schemaTypes } from "../../data/model.ts"
import { useStore } from "../../data/store.tsx"
import { saveDataset } from "../../data/writes.ts"
import { shortcutKeys } from "../../keyboard/shortcut.ts"
import type { Action } from "../../shell/action.ts"
import { runWrite } from "../../shell/feedback.ts"
import { Frame } from "../../shell/frame.tsx"
import { useNavigation } from "../../shell/navigation.tsx"
import { Keys } from "../../ui/kbd.tsx"
import { escapeForm, useFocusOnRender } from "../form-helpers.ts"
import { removeDataset } from "./remove.ts"
import "../form.css"

type DraftSchema = { key: string; id?: string; name: string; type: SchemaType }

const ADD_SCHEMA = { key: "a", ctrl: true }

export function DatasetForm({
    dataset,
    onSaved
}: {
    dataset?: Dataset
    onSaved?: (id: string) => void
}) {
    const { schemas } = useStore()
    const { pop } = useNavigation()

    const [initial] = useState(() => ({
        alias: dataset?.alias ?? "",
        description: dataset?.description ?? "",
        schemas: schemas
            .filter(schema => schema.datasetId === dataset?.id)
            .map(
                (schema): DraftSchema => ({
                    key: schema.id,
                    id: schema.id,
                    name: schema.name,
                    type: schema.type
                })
            )
    }))
    const [alias, setAlias] = useState(initial.alias)
    const [description, setDescription] = useState(initial.description)
    const [drafts, setDrafts] = useState(initial.schemas)
    const [saving, setSaving] = useState(false)
    const focusOnRender = useFocusOnRender()

    const dirty =
        JSON.stringify({ alias, description, schemas: drafts }) !== JSON.stringify(initial)

    const updateSchema = (key: string, change: Partial<DraftSchema>) =>
        setDrafts(current => current.map(s => (s.key === key ? { ...s, ...change } : s)))

    const addSchema = () => {
        const key = newId()
        focusOnRender(key)
        setDrafts(current => [...current, { key, name: "", type: "text" }])
    }

    const save = async () => {
        if (saving) return
        setSaving(true)
        const id = await runWrite(
            saveDataset({
                ...(dataset && { id: dataset.id }),
                alias,
                description,
                schemas: drafts.map(({ id, name, type }) => ({ ...(id && { id }), name, type }))
            }),
            dataset ? "Dataset saved" : "Dataset created"
        )
        setSaving(false)
        if (id === undefined) return
        pop()
        onSaved?.(id)
    }

    const actions: Action[] = [
        {
            id: "save",
            title: dataset ? "Save Dataset" : "Create Dataset",
            section: "Form",
            shortcut: { key: "enter", mod: true },
            run: save
        },
        {
            id: "add-schema",
            title: "Add Schema",
            section: "Form",
            shortcut: ADD_SCHEMA,
            run: addSchema
        },
        ...(dataset
            ? [
                  {
                      id: "delete",
                      title: "Delete Dataset",
                      section: "Dataset",
                      shortcut: { key: "x", ctrl: true },
                      destructive: true,
                      run: async () => {
                          if (await removeDataset(dataset)) pop()
                      }
                  }
              ]
            : [])
    ]

    return (
        <Frame
            title={dataset ? "Edit Dataset" : "Create Dataset"}
            status={dirty ? "unsaved" : ""}
            actions={actions}
            onEscape={() => escapeForm(dirty, pop)}
        >
            <form className="form" onSubmit={event => event.preventDefault()}>
                <label className="form-label" htmlFor="dataset-alias">
                    Alias
                </label>
                <input
                    id="dataset-alias"
                    data-autofocus
                    className="field"
                    placeholder="one or two words"
                    value={alias}
                    onChange={event => setAlias(event.target.value)}
                />

                <label className="form-label" htmlFor="dataset-description">
                    Description
                </label>
                <input
                    id="dataset-description"
                    className="field"
                    placeholder="What belongs here"
                    value={description}
                    onChange={event => setDescription(event.target.value)}
                />

                <span className="form-label">Schemas</span>
                <div className="attributes">
                    {drafts.length === 0 && (
                        <p className="faint">
                            A schema names an attribute and the type of value it takes.
                        </p>
                    )}
                    {drafts.map(schema => (
                        <div key={schema.key} className="attribute">
                            <input
                                data-focus-key={schema.key}
                                className="field"
                                placeholder="name"
                                aria-label="Schema name"
                                value={schema.name}
                                onChange={event =>
                                    updateSchema(schema.key, { name: event.target.value })
                                }
                            />
                            <select
                                className="field"
                                aria-label="Schema type"
                                value={schema.type}
                                onChange={event =>
                                    updateSchema(schema.key, {
                                        type: event.target.value as SchemaType
                                    })
                                }
                            >
                                {schemaTypes.map(type => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                            <span />
                            <button
                                type="button"
                                className="remove"
                                aria-label="Remove schema"
                                onClick={() =>
                                    setDrafts(current => current.filter(s => s.key !== schema.key))
                                }
                            >
                                ×
                            </button>
                        </div>
                    ))}
                    <button type="button" className="add" onClick={addSchema}>
                        + Add schema <Keys keys={shortcutKeys(ADD_SCHEMA)} />
                    </button>
                </div>
            </form>
        </Frame>
    )
}

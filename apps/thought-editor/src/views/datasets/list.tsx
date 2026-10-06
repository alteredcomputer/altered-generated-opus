import { Fragment, useState } from "react"
import type { Dataset } from "../../data/model.ts"
import { matches } from "../../data/search.ts"
import { useStore } from "../../data/store.tsx"
import type { Action } from "../../shell/action.ts"
import { Frame } from "../../shell/frame.tsx"
import { useNavigation } from "../../shell/navigation.tsx"
import { List } from "../../ui/list.tsx"
import { useListCursor } from "../../ui/use-list-cursor.ts"
import { usePersistentState } from "../../ui/use-persistent-state.ts"
import { resetDemoAction } from "../reset-demo.ts"
import { ThoughtsList } from "../thoughts/list.tsx"
import { DatasetForm } from "./form.tsx"
import { removeDataset } from "./remove.ts"

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`

export function DatasetsList() {
    const { datasets, schemas, thoughts } = useStore()
    const { push } = useNavigation()
    const [query, setQuery] = useState("")
    const [inspector, setInspector] = usePersistentState("datasets.inspector", true)

    const visible = datasets.filter(dataset => matches(query, dataset.alias, dataset.description))
    const list = useListCursor(visible.map(dataset => dataset.id))
    const current = visible.find(dataset => dataset.id === list.cursor)

    const schemasOf = (dataset: Dataset) => schemas.filter(s => s.datasetId === dataset.id)
    const countOf = (dataset: Dataset) =>
        thoughts.filter(t => t.datasetIds.includes(dataset.id)).length

    const edit = (dataset: Dataset) =>
        push(<DatasetForm dataset={dataset} onSaved={list.setCursor} />)
    const open = (dataset: Dataset) => push(<ThoughtsList datasetId={dataset.id} />)

    const actions: Action[] = [
        ...(current
            ? [
                  {
                      id: "open",
                      title: "View Thoughts in Dataset",
                      section: "Dataset",
                      shortcut: { key: "enter" },
                      run: () => open(current)
                  },
                  {
                      id: "edit",
                      title: "Edit Dataset and Schemas",
                      section: "Dataset",
                      shortcut: { key: "e", mod: true },
                      run: () => edit(current)
                  }
              ]
            : []),
        {
            id: "create",
            title: "Create Dataset",
            section: "Dataset",
            shortcut: { key: "n", ctrl: true },
            run: () => push(<DatasetForm onSaved={list.setCursor} />)
        },
        ...(current
            ? [
                  {
                      id: "delete",
                      title: "Delete Dataset",
                      section: "Dataset",
                      shortcut: { key: "x", ctrl: true },
                      destructive: true,
                      run: () => removeDataset(current)
                  }
              ]
            : []),
        {
            id: "inspector",
            title: inspector ? "Hide Inspector" : "Show Inspector",
            section: "View",
            shortcut: { key: "i", mod: true },
            run: () => setInspector(!inspector)
        },
        resetDemoAction
    ]

    return (
        <Frame
            title="Manage Datasets"
            count={{ total: visible.length }}
            search={{ value: query, onChange: setQuery, placeholder: "Search datasets..." }}
            actions={actions}
            onKey={list.handleKey}
            onEscape={() => {
                if (!query) return false
                setQuery("")
                return true
            }}
        >
            <List
                items={visible}
                getId={dataset => dataset.id}
                empty={
                    query ? "No datasets match." : "No datasets yet. Press Ctrl-N to create one."
                }
                cursor={list.cursor}
                selected={[]}
                onClick={id => list.setCursor(id)}
                onActivate={id => {
                    const dataset = visible.find(d => d.id === id)
                    if (dataset) open(dataset)
                }}
                inspectorWidth="40%"
                inspector={
                    inspector &&
                    current && (
                        <>
                            <h1 className="strong">
                                <span className="mark"># </span>
                                {current.alias}
                            </h1>
                            {current.description && <p>{current.description}</p>}
                            <p className="mark">---</p>
                            <h2 className="strong">
                                <span className="mark">## </span>Schemas
                            </h2>
                            {schemasOf(current).length === 0 ? (
                                <span className="faint">None. Press Cmd-E to add one.</span>
                            ) : (
                                <div className="inspector-table">
                                    {schemasOf(current).map(schema => (
                                        <Fragment key={schema.id}>
                                            <span>{schema.name}</span>
                                            <span className="faint">{schema.type}</span>
                                        </Fragment>
                                    ))}
                                </div>
                            )}
                            <p className="mark">---</p>
                            <p className="faint">{plural(countOf(current), "thought")}</p>
                        </>
                    )
                }
                renderRow={dataset => (
                    <>
                        <span className="row-title" data-named>
                            {dataset.alias}
                        </span>
                        <span className="row-subtitle">{dataset.description}</span>
                        {!inspector && (
                            <span className="row-accessories faint">
                                {plural(countOf(dataset), "thought")} -{" "}
                                {plural(schemasOf(dataset).length, "schema")}
                            </span>
                        )}
                    </>
                )}
            />
        </Frame>
    )
}

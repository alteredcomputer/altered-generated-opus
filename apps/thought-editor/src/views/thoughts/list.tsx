import { useMemo, useState } from "react"
import { type Thought, thoughtTitle } from "../../data/model.ts"
import { filterThoughts } from "../../data/search.ts"
import { useStore } from "../../data/store.tsx"
import { addThoughtsToDatasets, deleteThoughts, setThoughtDatasets } from "../../data/writes.ts"
import { shortcutKeys } from "../../keyboard/shortcut.ts"
import { log } from "../../observability/log.ts"
import type { Action } from "../../shell/action.ts"
import { confirm } from "../../shell/confirm.tsx"
import { runWrite } from "../../shell/feedback.ts"
import { Frame } from "../../shell/frame.tsx"
import { useNavigation, useViewState } from "../../shell/navigation.tsx"
import { Picker } from "../../shell/picker.tsx"
import { isString, isStringOrNull } from "../../shell/restore.ts"
import { showToast } from "../../shell/toast.ts"
import { formatAge } from "../../ui/format.ts"
import { Keys } from "../../ui/kbd.tsx"
import { List } from "../../ui/list.tsx"
import { useListCursor } from "../../ui/use-list-cursor.ts"
import { usePersistentState } from "../../ui/use-persistent-state.ts"
import { DatasetPicker } from "../datasets/picker.tsx"
import { resetDemoAction } from "../reset-demo.ts"
import { route } from "../route.ts"
import { ThoughtForm } from "./form.tsx"
import { ThoughtInspector } from "./inspector.tsx"

const INSPECTOR_WIDTHS = ["36%", "50%", "64%"]
const FILTER = { key: "p", mod: true }

export function ThoughtsList({ datasetId = null }: { datasetId?: string | null }) {
    const { thoughts, datasets, datasetById } = useStore()
    const { push } = useNavigation()
    const [query, setQuery] = useViewState("query", "", isString)
    const [filter, setFilter] = useViewState("filter", datasetId, isStringOrNull)
    const [filterOpen, setFilterOpen] = useState(false)
    const [inspector, setInspector] = usePersistentState("thoughts.inspector", true)
    const [width, setWidth] = usePersistentState("thoughts.inspector-width", 0)

    const activeFilter = filter && datasetById.has(filter) ? filter : null
    const visible = useMemo(
        () => filterThoughts(thoughts, query, datasetById, activeFilter),
        [thoughts, query, datasetById, activeFilter]
    )
    const list = useListCursor(visible.map(thought => thought.id))
    const current = visible.find(thought => thought.id === list.cursor)
    const targets = visible.filter(thought => list.targets.includes(thought.id))
    const many = targets.length > 1

    const edit = (thought: Thought) =>
        push(
            <ThoughtForm thought={thought} onSaved={list.setCursor} />,
            route.thoughtForm(thought.id)
        )

    const create = () =>
        push(
            <ThoughtForm
                datasetIds={activeFilter ? [activeFilter] : []}
                onSaved={list.setCursor}
            />,
            route.thoughtForm(null, activeFilter ? [activeFilter] : [])
        )

    const pickDatasets = () => {
        const [first] = targets
        if (!first) return
        const ids = targets.map(thought => thought.id)

        push(
            many ? (
                <DatasetPicker
                    title={`Add ${ids.length} thoughts to datasets`}
                    initial={[]}
                    onConfirm={datasetIds =>
                        runWrite(addThoughtsToDatasets(ids, datasetIds), "Added to datasets")
                    }
                />
            ) : (
                <DatasetPicker
                    title={`Datasets for ${thoughtTitle(first)}`}
                    initial={first.datasetIds}
                    onConfirm={datasetIds =>
                        runWrite(setThoughtDatasets(first.id, datasetIds), "Datasets updated")
                    }
                />
            )
        )
    }

    const remove = async (ask: boolean) => {
        const [first] = targets
        if (!first) return
        const subject = many ? `${targets.length} thoughts` : `"${thoughtTitle(first)}"`

        if (ask) {
            const confirmed = await confirm({
                title: many ? "Delete thoughts" : "Delete thought",
                message: `Delete ${subject}? This cannot be undone.`,
                confirmLabel: "Delete"
            })
            if (!confirmed) return
        }

        const done = await runWrite(
            deleteThoughts(targets.map(thought => thought.id)),
            many ? `${targets.length} thoughts deleted` : "Thought deleted"
        )
        if (done !== undefined) list.clearSelection()
    }

    const copy = async (thought: Thought) => {
        try {
            await navigator.clipboard.writeText(thought.content)
            showToast("Copied content")
        } catch (cause) {
            log("error", "clipboard write refused", { cause })
            showToast("The browser refused clipboard access.", "failure")
        }
    }

    const actions: Action[] = [
        ...(current
            ? [
                  {
                      id: "edit",
                      title: "Edit Thought",
                      section: "Thought",
                      shortcut: { key: "enter" },
                      run: () => edit(current)
                  }
              ]
            : []),
        {
            id: "create",
            title: "Create Thought",
            section: "Thought",
            shortcut: { key: "n", ctrl: true },
            run: create
        },
        ...(targets.length
            ? [
                  {
                      id: "datasets",
                      title: many ? "Add to Datasets" : "Select Datasets",
                      section: "Thought",
                      shortcut: { key: "d", ctrl: true },
                      run: pickDatasets
                  },
                  {
                      id: "delete",
                      title: many ? `Delete ${targets.length} Thoughts` : "Delete Thought",
                      section: "Thought",
                      shortcut: { key: "x", ctrl: true },
                      destructive: true,
                      run: () => remove(true)
                  },
                  {
                      id: "delete-now",
                      title: "Delete Without Confirmation",
                      section: "Thought",
                      shortcut: { key: "x", ctrl: true, shift: true },
                      destructive: true,
                      run: () => remove(false)
                  }
              ]
            : []),
        ...(current
            ? [{ id: "copy", title: "Copy Content", section: "Thought", run: () => copy(current) }]
            : []),
        {
            id: "inspector",
            title: inspector ? "Hide Inspector" : "Show Inspector",
            section: "View",
            shortcut: { key: "i", mod: true },
            run: () => setInspector(!inspector)
        },
        ...(inspector
            ? [
                  {
                      id: "inspector-width",
                      title: "Change Inspector Width",
                      section: "View",
                      shortcut: { key: "i", mod: true, shift: true },
                      run: () => setWidth((width + 1) % INSPECTOR_WIDTHS.length)
                  }
              ]
            : []),
        {
            id: "filter",
            title: "Filter by Dataset",
            section: "View",
            shortcut: FILTER,
            run: () => setFilterOpen(true)
        },
        {
            id: "next",
            title: "Next Thought",
            section: "View",
            shortcut: { key: "tab" },
            run: () => list.step(1)
        },
        {
            id: "previous",
            title: "Previous Thought",
            section: "View",
            shortcut: { key: "tab", shift: true },
            run: () => list.step(-1)
        },
        {
            id: "select-all",
            title: "Select All Thoughts",
            section: "Selection",
            shortcut: { key: "a", mod: true, shift: true },
            run: list.selectAll
        },
        ...(list.selected.length
            ? [
                  {
                      id: "clear",
                      title: "Clear Selection",
                      section: "Selection",
                      run: list.clearSelection
                  }
              ]
            : []),
        resetDemoAction,
        //  The grid editor at /grid shares this data (D176).
        {
            id: "open-grid",
            title: "Open Grid Editor",
            section: "Prototype",
            run: () => location.assign("/grid")
        }
    ]

    const filterLabel = activeFilter ? datasetById.get(activeFilter)?.alias : "All Thoughts"

    return (
        <Frame
            title="View Thoughts"
            count={{ total: visible.length, selected: list.selected.length }}
            status={activeFilter ? `in ${filterLabel}` : ""}
            search={{ value: query, onChange: setQuery, placeholder: "Search thoughts..." }}
            accessory={
                <button type="button" className="accessory" onClick={() => setFilterOpen(true)}>
                    {filterLabel}
                    <Keys keys={shortcutKeys(FILTER)} />
                </button>
            }
            actions={actions}
            onKey={list.handleKey}
            onEscape={() => {
                if (list.selected.length) list.clearSelection()
                else if (query) setQuery("")
                else return false
                return true
            }}
        >
            <List
                items={visible}
                getId={thought => thought.id}
                empty={
                    query ? "No thoughts match." : "No thoughts yet. Press Ctrl-N to capture one."
                }
                cursor={list.cursor}
                selected={list.selected}
                onClick={list.click}
                onActivate={id => {
                    const thought = visible.find(t => t.id === id)
                    if (thought) edit(thought)
                }}
                inspector={inspector && current && <ThoughtInspector thought={current} />}
                inspectorWidth={INSPECTOR_WIDTHS[width] ?? "36%"}
                renderRow={thought => (
                    <>
                        <span className="row-title" data-named={thought.alias !== null}>
                            {thoughtTitle(thought)}
                        </span>
                        <span className="row-subtitle">{thought.alias ? thought.content : ""}</span>
                        {!inspector && (
                            <span className="row-accessories">
                                {thought.datasetIds.map(id => (
                                    <span key={id} className="chip">
                                        {datasetById.get(id)?.alias}
                                    </span>
                                ))}
                                <span className="faint">{formatAge(thought.createdAt)}</span>
                            </span>
                        )}
                    </>
                )}
            />

            {filterOpen && (
                <Picker
                    position="top"
                    placeholder="Search views..."
                    onClose={() => setFilterOpen(false)}
                    items={[
                        {
                            id: "all",
                            title: "All Thoughts",
                            checked: !activeFilter,
                            run: () => setFilter(null)
                        },
                        ...datasets.map(dataset => ({
                            id: dataset.id,
                            title: dataset.alias,
                            section: "Datasets",
                            checked: dataset.id === activeFilter,
                            run: () => setFilter(dataset.id)
                        }))
                    ]}
                />
            )}
        </Frame>
    )
}

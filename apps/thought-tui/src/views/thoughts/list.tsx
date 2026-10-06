import { useRenderer, useTerminalDimensions } from "@opentui/react"
import { useMemo, useState } from "react"
import { type Thought, thoughtTitle } from "../../data/model.ts"
import { filterThoughts } from "../../data/search.ts"
import { useStore } from "../../data/store.tsx"
import { addThoughtsToDatasets, deleteThoughts, setThoughtDatasets } from "../../data/writes.ts"
import { log } from "../../observability/log.ts"
import type { Action } from "../../shell/action.ts"
import { Caps } from "../../shell/caps.tsx"
import { confirm } from "../../shell/confirm.tsx"
import { Frame } from "../../shell/frame.tsx"
import { useNavigation } from "../../shell/navigation.tsx"
import { Palette } from "../../shell/palette.tsx"
import { showToast } from "../../shell/toast.ts"
import { formatAge } from "../../ui/format.ts"
import { label } from "../../ui/keys.ts"
import { List } from "../../ui/list.tsx"
import { width as cellsOf, fitRow } from "../../ui/text.ts"
import { color } from "../../ui/theme.ts"
import { listHelp, useList } from "../../ui/use-list.ts"
import { DatasetsList } from "../datasets/list.tsx"
import { DatasetPicker } from "../datasets/picker.tsx"
import { ThoughtForm } from "./form.tsx"
import { ThoughtInspector } from "./inspector.tsx"

const INSPECTOR_WIDTHS = [0.4, 0.5, 0.64]
const FILTER = { key: "f" }
const SEARCH_MOVES = new Set(["up", "down"])

export function ThoughtsList({ datasetId = null }: { datasetId?: string | null }) {
    const store = useStore()
    const { thoughts, datasets, datasetById } = store
    const { push } = useNavigation()
    const renderer = useRenderer()
    const screen = useTerminalDimensions()
    const [query, setQuery] = useState("")
    const [searching, setSearching] = useState(false)
    const [filter, setFilter] = useState(datasetId)
    const [filterOpen, setFilterOpen] = useState(false)
    const [inspector, setInspector] = useState(true)
    const [width, setWidth] = useState(0)

    const activeFilter = filter && datasetById.has(filter) ? filter : null
    const visible = useMemo(
        () => filterThoughts(thoughts, query, datasetById, activeFilter),
        [thoughts, query, datasetById, activeFilter]
    )
    const list = useList(visible.map(thought => thought.id))
    const current = visible.find(thought => thought.id === list.cursor)
    const targets = visible.filter(thought => list.targets.includes(thought.id))
    const many = targets.length > 1

    const edit = (thought: Thought) =>
        push(<ThoughtForm thought={thought} onSaved={list.setCursor} />)

    const create = () =>
        push(
            <ThoughtForm datasetIds={activeFilter ? [activeFilter] : []} onSaved={list.setCursor} />
        )

    const pickDatasets = () => {
        const [first] = targets
        if (!first) return
        const ids = targets.map(thought => thought.id)
        push(
            <DatasetPicker
                title={
                    many
                        ? `Add ${ids.length} thoughts to datasets`
                        : `Datasets for ${thoughtTitle(first)}`
                }
                initial={many ? [] : first.datasetIds}
                onConfirm={chosen => {
                    store.write("datasets", snapshot =>
                        many
                            ? addThoughtsToDatasets(snapshot, ids, chosen)
                            : setThoughtDatasets(snapshot, first.id, chosen)
                    )
                    showToast(many ? "Added to datasets" : "Datasets updated")
                }}
            />
        )
    }

    const remove = async () => {
        const [first] = targets
        if (!first) return
        const confirmed = await confirm({
            title: many ? "Delete thoughts" : "Delete thought",
            message: `Delete ${many ? `${targets.length} thoughts` : `"${thoughtTitle(first)}"`}? This cannot be undone.`,
            confirmLabel: "Delete"
        })
        if (!confirmed) return
        store.write("delete", snapshot =>
            deleteThoughts(
                snapshot,
                targets.map(t => t.id)
            )
        )
        list.clearSelection()
        showToast(many ? `${targets.length} thoughts deleted` : "Thought deleted")
    }

    const copy = (thought: Thought) => {
        if (renderer.copyToClipboardOSC52(thought.content)) showToast("Copied content")
        else {
            log("error", "clipboard refused", { terminal: process.env.TERM_PROGRAM })
            showToast("This terminal does not accept clipboard writes")
        }
    }

    const actions: Action[] = [
        ...(current
            ? [
                  {
                      id: "edit",
                      title: "Edit Thought",
                      section: "Thought",
                      shortcut: { key: "return" },
                      run: () => edit(current)
                  }
              ]
            : []),
        {
            id: "create",
            title: "Create Thought",
            section: "Thought",
            shortcut: { key: "n" },
            run: create
        },
        ...(targets.length
            ? [
                  {
                      id: "datasets",
                      title: many ? "Add to Datasets" : "Select Datasets",
                      section: "Thought",
                      shortcut: { key: "t" },
                      run: pickDatasets
                  },
                  {
                      id: "delete",
                      title: many ? `Delete ${targets.length} Thoughts` : "Delete Thought",
                      section: "Thought",
                      shortcut: { key: "x" },
                      run: remove
                  }
              ]
            : []),
        ...(current
            ? [
                  {
                      id: "copy",
                      title: "Copy Content",
                      section: "Thought",
                      shortcut: { key: "y" },
                      run: () => copy(current)
                  }
              ]
            : []),
        {
            id: "search",
            title: "Search Thoughts",
            section: "View",
            shortcut: { key: "/" },
            run: () => setSearching(true)
        },
        {
            id: "filter",
            title: "Filter by Dataset",
            section: "View",
            shortcut: FILTER,
            run: () => setFilterOpen(true)
        },
        {
            id: "inspector",
            title: inspector ? "Hide Inspector" : "Show Inspector",
            section: "View",
            shortcut: { key: "i" },
            run: () => setInspector(!inspector)
        },
        ...(inspector
            ? [
                  {
                      id: "width",
                      title: "Change Inspector Width",
                      section: "View",
                      shortcut: { key: "I" },
                      run: () => setWidth((width + 1) % INSPECTOR_WIDTHS.length)
                  }
              ]
            : []),
        {
            id: "browse",
            title: "Browse Datasets",
            section: "View",
            shortcut: { key: "D" },
            run: () => push(<DatasetsList />)
        },
        {
            id: "select-all",
            title: "Select All Thoughts",
            section: "Selection",
            shortcut: { key: "a", ctrl: true },
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
        {
            id: "reset",
            title: "Reset Demo Data",
            section: "Demo",
            run: () => {
                store.reset()
                showToast("Demo data reset")
            }
        }
    ]

    const inspectorCells = inspector
        ? Math.floor(screen.width * (INSPECTOR_WIDTHS[width] ?? 0.4))
        : 0

    const filterLabel = activeFilter ? (datasetById.get(activeFilter)?.alias ?? "") : "All Thoughts"

    return (
        <Frame
            title="View Thoughts"
            count={{ total: visible.length, selected: list.selected.length }}
            search={{
                value: query,
                placeholder: "Search thoughts...",
                focused: searching,
                onChange: setQuery
            }}
            accessory={<Caps title={filterLabel} keys={label(FILTER)} />}
            actions={actions}
            help={[...listHelp, { title: "Finish Search", hint: "⏎" }]}
            typing={searching}
            onKey={event => {
                if (!searching) return list.handleKey(event)
                if (SEARCH_MOVES.has(event.name)) return list.handleKey(event)
                if (event.name === "return") setSearching(false)
                else if (event.name === "escape") {
                    setQuery("")
                    setSearching(false)
                } else return false
                return true
            }}
            overlay={
                filterOpen && (
                    <Palette
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
                )
            }
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
                cursor={list.cursor}
                selected={list.selected}
                empty={query ? "No thoughts match." : "No thoughts yet. Press n to capture one."}
                onCursor={list.setCursor}
                onActivate={id => {
                    const thought = visible.find(t => t.id === id)
                    if (thought) edit(thought)
                }}
                width={screen.width - inspectorCells}
                renderRow={(thought, active, cells) => {
                    const chips = inspector
                        ? []
                        : thought.datasetIds.map(id => datasetById.get(id)?.alias ?? "")
                    const age = formatAge(thought.createdAt).padStart(6)
                    const extra = inspector ? 0 : cellsOf(chips.join("  ") + age) + 2
                    const row = fitRow(
                        thoughtTitle(thought),
                        thought.alias ? thought.content : "",
                        cells - extra
                    )
                    return (
                        <>
                            <text flexGrow={1} wrapMode="none">
                                <span
                                    fg={
                                        thought.alias
                                            ? color.fg
                                            : active
                                              ? color.accent
                                              : color.fgMuted
                                    }
                                >
                                    {row.title}
                                </span>
                                <span fg={color.fgFaint}>{`  ${row.subtitle}`}</span>
                            </text>
                            {!inspector && (
                                <text flexShrink={0} wrapMode="none">
                                    <span fg={color.fgMuted}>{chips.join("  ")}</span>
                                    <span fg={color.fgFaint}>{age}</span>
                                </text>
                            )}
                        </>
                    )
                }}
            />
            {inspector && current && <ThoughtInspector thought={current} width={inspectorCells} />}
        </Frame>
    )
}

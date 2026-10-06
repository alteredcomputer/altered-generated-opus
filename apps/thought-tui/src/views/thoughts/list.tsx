import { useRenderer, useTerminalDimensions } from "@opentui/react"
import { useMemo, useState } from "react"
import { useUi } from "../../config/provider.tsx"
import { type Thought, thoughtTitle } from "../../data/model.ts"
import { filterThoughts } from "../../data/search.ts"
import { useStore } from "../../data/store.tsx"
import { addThoughtsToDatasets, deleteThoughts, setThoughtDatasets } from "../../data/writes.ts"
import type { Action } from "../../shell/action.ts"
import { confirm } from "../../shell/confirm.tsx"
import { Frame } from "../../shell/frame.tsx"
import { useNavigation } from "../../shell/navigation.tsx"
import { Palette } from "../../shell/palette.tsx"
import { showToast } from "../../shell/toast.ts"
import { formatAge } from "../../ui/format.ts"
import { List } from "../../ui/list.tsx"
import { width as cellsOf, fitRow } from "../../ui/text.ts"
import { listHelp, useList } from "../../ui/use-list.ts"
import { DatasetsList } from "../datasets/list.tsx"
import { DatasetPicker } from "../datasets/picker.tsx"
import { ThoughtForm } from "./form.tsx"
import { ThoughtInspector } from "./inspector.tsx"

const INSPECTOR_STEPS = [1, 1.25, 1.6]
const VIEW = { key: "l", ctrl: true }
const dateField = { added: "addedAt", modified: "updatedAt", created: "createdAt" } as const

export function ThoughtsList({ datasetId = null }: { datasetId?: string | null }) {
    const store = useStore()
    const { thoughts, datasets, datasetById } = store
    const { config, colors } = useUi()
    const { push } = useNavigation()
    const renderer = useRenderer()
    const screen = useTerminalDimensions()
    const [query, setQuery] = useState("")
    const [filter, setFilter] = useState(datasetId)
    const [viewOpen, setViewOpen] = useState(false)
    const [inspector, setInspector] = useState(true)
    const [step, setStep] = useState(0)

    const activeFilter = filter && datasetById.has(filter) ? filter : null
    const field = dateField[config.list.date]
    const visible = useMemo(
        () =>
            filterThoughts(thoughts, query, datasetById, activeFilter).sort(
                (a, b) => b.addedAt - a.addedAt
            ),
        [thoughts, query, datasetById, activeFilter]
    )
    const list = useList(
        visible.map(thought => thought.id),
        config.selection.extend
    )
    const current = visible.find(thought => thought.id === list.cursor)
    const targets = visible.filter(thought => list.targets.includes(thought.id))
    const many = targets.length > 1
    const selecting = list.selected.length > 0

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
                    showToast({
                        kind: "success",
                        title: many ? "Added to datasets" : "Datasets updated"
                    })
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
        showToast({
            kind: "success",
            title: many ? `${targets.length} thoughts deleted` : "Thought deleted"
        })
    }

    const copy = (thought: Thought) =>
        renderer.copyToClipboardOSC52(thought.content)
            ? showToast({ kind: "success", title: "Copied content" })
            : showToast({
                  kind: "failure",
                  title: "Clipboard refused",
                  subtitle: "This terminal does not accept OSC 52."
              })

    const actions: Action[] = [
        ...(current
            ? [
                  {
                      id: "toggle",
                      title: list.selected.includes(current.id)
                          ? "Deselect Thought"
                          : "Select Thought",
                      section: "Selection",
                      shortcut: { key: "return" },
                      run: () => list.toggle()
                  },
                  {
                      id: "edit",
                      title: "Edit Thought",
                      section: "Thought",
                      shortcut: { key: "e", ctrl: true },
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
                      shortcut: { key: "t", ctrl: true },
                      run: pickDatasets
                  }
              ]
            : []),
        ...(current
            ? [
                  {
                      id: "copy",
                      title: "Copy Content",
                      section: "Thought",
                      shortcut: { key: "y", ctrl: true },
                      run: () => copy(current)
                  }
              ]
            : []),
        ...(targets.length
            ? [
                  {
                      id: "delete",
                      title: many ? `Delete ${targets.length} Thoughts` : "Delete Thought",
                      section: "Thought",
                      shortcut: { key: "x", ctrl: true },
                      danger: true,
                      run: remove
                  }
              ]
            : []),
        {
            id: "select-all",
            title: "Select All",
            section: "Selection",
            shortcut: { key: "s", ctrl: true },
            run: list.selectAll
        },
        {
            id: "deselect-all",
            title: "Deselect All",
            section: "Selection",
            shortcut: { key: "d", ctrl: true },
            run: list.clearSelection
        },
        {
            id: "gap",
            title: "Select Gap",
            section: "Selection",
            shortcut: { key: "g", ctrl: true },
            run: list.fillGap
        },
        {
            id: "view",
            title: "Change View",
            section: "View",
            shortcut: VIEW,
            run: () => setViewOpen(true)
        },
        {
            id: "inspector",
            title: inspector ? "Hide Inspector" : "Show Inspector",
            section: "View",
            shortcut: { key: "i", ctrl: true },
            run: () => setInspector(!inspector)
        },
        ...(inspector
            ? [
                  {
                      id: "width",
                      title: "Change Inspector Width",
                      section: "View",
                      shortcut: { key: "i", ctrl: true, shift: true },
                      run: () => setStep((step + 1) % INSPECTOR_STEPS.length)
                  }
              ]
            : []),
        {
            id: "browse",
            title: "Browse Datasets",
            section: "View",
            shortcut: { key: "b", ctrl: true },
            run: () => push(<DatasetsList />)
        },
        {
            id: "reset",
            title: "Reset Demo Data",
            section: "Demo",
            run: () => {
                store.reset()
                showToast({ kind: "success", title: "Demo data reset" })
            }
        }
    ]

    const inspectorCells = inspector
        ? Math.floor(screen.width * config.inspector.width * (INSPECTOR_STEPS[step] ?? 1))
        : 0
    const filterLabel = activeFilter ? (datasetById.get(activeFilter)?.alias ?? "") : "All Thoughts"

    return (
        <Frame
            title="View Thoughts"
            count={{ total: visible.length, selected: list.selected.length }}
            search={{ value: query, placeholder: "Search thoughts...", onChange: setQuery }}
            view={{ title: filterLabel, shortcut: VIEW, open: () => setViewOpen(true) }}
            actions={actions}
            help={listHelp(config.glyphs)}
            onKey={list.handleKey}
            onEscape={() => {
                if (!selecting) return false
                list.clearSelection()
                return true
            }}
            overlay={
                viewOpen && (
                    <Palette
                        placeholder="Search views..."
                        anchor="top-right"
                        width={40}
                        onClose={() => setViewOpen(false)}
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
        >
            <List
                items={visible}
                getId={thought => thought.id}
                cursor={list.cursor}
                selected={list.selected}
                selecting={selecting}
                width={screen.width - inspectorCells}
                empty={
                    query ? "No thoughts match." : "No thoughts yet. Press Ctrl-N to capture one."
                }
                onCursor={list.setCursor}
                onToggle={list.toggle}
                onActivate={id => {
                    const thought = visible.find(t => t.id === id)
                    if (thought) edit(thought)
                }}
                renderRow={(thought, active, cells) => {
                    const chips = inspector
                        ? ""
                        : thought.datasetIds.map(id => datasetById.get(id)?.alias ?? "").join("  ")
                    const date = formatAge(thought[field]).padStart(5)
                    const extra = cellsOf(date) + (chips ? cellsOf(chips) + 2 : 0) + 2
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
                                            ? colors.fg
                                            : active
                                              ? colors.accent
                                              : colors.fgMuted
                                    }
                                >
                                    {row.title}
                                </span>
                                <span fg={colors.fgFaint}>{`  ${row.subtitle}`}</span>
                            </text>
                            <text flexShrink={0} wrapMode="none">
                                {chips && <span fg={colors.fgMuted}>{`${chips}  `}</span>}
                                <span fg={colors.fgFaint}>{date}</span>
                            </text>
                        </>
                    )
                }}
            />
            {inspector && current && <ThoughtInspector thought={current} width={inspectorCells} />}
        </Frame>
    )
}

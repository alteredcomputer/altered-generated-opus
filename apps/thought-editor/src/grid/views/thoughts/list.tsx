import { useMemo, useState } from "react"
import { type Thought, thoughtTitle } from "../../../data/model.ts"
import { filterThoughts } from "../../../data/search.ts"
import { useStore } from "../../../data/store.tsx"
import {
    addThoughtsToDatasets,
    deleteThoughts,
    resetDemoData,
    setThoughtDatasets
} from "../../../data/writes.ts"
import { log } from "../../../observability/log.ts"
import { useUi } from "../../config/provider.tsx"
import type { Action } from "../../shell/action.ts"
import { confirm } from "../../shell/confirm.tsx"
import { formatAge } from "../../shell/format.ts"
import { Frame } from "../../shell/frame.tsx"
import { host, label, type Shortcut } from "../../shell/keys.ts"
import { List } from "../../shell/list.tsx"
import { useNavigation } from "../../shell/navigation.tsx"
import { Palette } from "../../shell/palette.tsx"
import { showToast } from "../../shell/toast.ts"
import { listHelp, useList } from "../../shell/use-list.ts"
import { runWrite } from "../../shell/write.ts"
import { width as cellsOf, fitRow, padStart, Span, Text, useGridSize } from "../../ui/index.ts"
import { DatasetsList } from "../datasets/list.tsx"
import { DatasetPicker } from "../datasets/picker.tsx"
import { ThoughtForm } from "./form.tsx"
import { ThoughtInspector } from "./inspector.tsx"

const INSPECTOR_STEPS = [1, 1.25, 1.6]
const VIEW: Shortcut = { key: "l", mod: true }
const CREATE: Shortcut = { key: "n", mod: true }
const dateField = { added: "addedAt", modified: "updatedAt", created: "createdAt" } as const

/** The thoughts list, the grid's home (D174, D176): search, list, inspector, and every action. */
export function ThoughtsList({ datasetId = null }: { datasetId?: string | null }) {
    const { thoughts, datasets, datasetById } = useStore()
    const { config } = useUi()
    const { push } = useNavigation()
    const screen = useGridSize()
    const [query, setQuery] = useState("")
    const [filter, setFilter] = useState(datasetId)
    const [viewOpen, setViewOpen] = useState(false)
    const [inspector, setInspector] = useState(screen.cols >= config.inspector.hideBelow)
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
                onConfirm={chosen =>
                    void runWrite(
                        many
                            ? addThoughtsToDatasets(ids, chosen)
                            : setThoughtDatasets(first.id, chosen),
                        many ? "Added to datasets" : "Datasets updated"
                    )
                }
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
        const deleted = await runWrite(
            deleteThoughts(targets.map(t => t.id)),
            many ? `${targets.length} thoughts deleted` : "Thought deleted"
        )
        if (deleted) list.clearSelection()
    }

    const copy = (thought: Thought) =>
        navigator.clipboard.writeText(thought.content).then(
            () => showToast({ kind: "success", title: "Copied content" }),
            (cause: unknown) => {
                log("error", "clipboard refused", { cause })
                showToast({
                    kind: "failure",
                    title: "Clipboard refused",
                    subtitle: "The browser did not allow it."
                })
            }
        )

    const reset = async () => {
        const confirmed = await confirm({
            title: "Reset demo data",
            message: "Every thought and dataset in this browser is replaced with the demo set.",
            confirmLabel: "Reset"
        })
        if (confirmed) await runWrite(resetDemoData(), "Demo data reset")
    }

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
                      shortcut: { key: "e", mod: true },
                      run: () => edit(current)
                  }
              ]
            : []),
        {
            id: "create",
            title: "Create Thought",
            section: "Thought",
            shortcut: CREATE,
            run: create
        },
        ...(targets.length
            ? [
                  {
                      id: "datasets",
                      title: many ? "Add to Datasets" : "Select Datasets",
                      section: "Thought",
                      shortcut: { key: "t", mod: true },
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
                      shortcut: { key: "y", mod: true },
                      run: () => void copy(current)
                  }
              ]
            : []),
        ...(targets.length
            ? [
                  {
                      id: "delete",
                      title: many ? `Delete ${targets.length} Thoughts` : "Delete Thought",
                      section: "Thought",
                      shortcut: { key: "x", mod: true },
                      danger: true,
                      run: () => void remove()
                  }
              ]
            : []),
        {
            id: "select-all",
            title: "Select All",
            section: "Selection",
            shortcut: { key: "s", mod: true },
            run: list.selectAll
        },
        {
            id: "deselect-all",
            title: "Deselect All",
            section: "Selection",
            shortcut: { key: "d", mod: true },
            run: list.clearSelection
        },
        {
            id: "gap",
            title: "Select Gap",
            section: "Selection",
            shortcut: { key: "g", mod: true },
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
            shortcut: { key: "i", mod: true },
            run: () => setInspector(!inspector)
        },
        ...(inspector
            ? [
                  {
                      id: "width",
                      title: "Change Inspector Width",
                      section: "View",
                      shortcut: { key: "i", mod: true, shift: true },
                      run: () => setStep((step + 1) % INSPECTOR_STEPS.length)
                  }
              ]
            : []),
        {
            id: "browse",
            title: "Browse Datasets",
            section: "View",
            shortcut: { key: "b", mod: true },
            run: () => push(<DatasetsList />)
        },
        {
            id: "reset",
            title: "Reset Demo Data",
            section: "Demo",
            danger: true,
            run: () => void reset()
        }
    ]

    const inspectorCells = inspector
        ? Math.floor(screen.cols * config.inspector.width * (INSPECTOR_STEPS[step] ?? 1))
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
                width={screen.cols - inspectorCells}
                empty={
                    query
                        ? "No thoughts match."
                        : `No thoughts yet. Press ${label(CREATE, config.glyphs, host)} to capture one.`
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
                    const date = padStart(formatAge(thought[field]), 5)
                    const extra = cellsOf(date) + (chips ? cellsOf(chips) + 2 : 0) + 2
                    const row = fitRow(
                        thoughtTitle(thought),
                        thought.alias ? thought.content : "",
                        cells - extra
                    )
                    return (
                        <>
                            <Text flexGrow={1} wrapMode="none">
                                <Span fg={thought.alias ? "fg" : active ? "accent" : "fgMuted"}>
                                    {row.title}
                                </Span>
                                <Span fg="fgFaint">{`  ${row.subtitle}`}</Span>
                            </Text>
                            <Text flexShrink={0} wrapMode="none">
                                {chips && <Span fg="fgMuted">{`${chips}  `}</Span>}
                                <Span fg="fgFaint">{date}</Span>
                            </Text>
                        </>
                    )
                }}
            />
            {inspector && current && <ThoughtInspector thought={current} width={inspectorCells} />}
        </Frame>
    )
}

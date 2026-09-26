import { useState } from "react"
import { matches } from "../../data/search.ts"
import { useStore } from "../../data/store.tsx"
import { createDataset } from "../../data/writes.ts"
import type { Action } from "../../shell/action.ts"
import { runWrite } from "../../shell/feedback.ts"
import { Frame } from "../../shell/frame.tsx"
import { useNavigation } from "../../shell/navigation.tsx"
import { List } from "../../ui/list.tsx"
import { useListCursor } from "../../ui/use-list-cursor.ts"

const CREATE = "create"

type DatasetPickerProps = {
    title: string
    initial: string[]
    onConfirm: (datasetIds: string[]) => void
}

/** Multi-select over datasets. Typing a name that does not exist offers to create it. */
export function DatasetPicker({ title, initial, onConfirm }: DatasetPickerProps) {
    const { datasets } = useStore()
    const { pop } = useNavigation()
    const [query, setQuery] = useState("")
    const [chosen, setChosen] = useState(initial)

    const name = query.trim()
    const canCreate =
        name !== "" && !datasets.some(d => d.alias.toLowerCase() === name.toLowerCase())
    const rows = [
        ...(canCreate ? [{ id: CREATE, alias: `Create dataset "${name}"`, description: "" }] : []),
        ...datasets.filter(dataset => matches(query, dataset.alias, dataset.description))
    ]
    const list = useListCursor(rows.map(row => row.id))

    const toggle = async (id: string | null) => {
        if (id === CREATE) {
            const created = await runWrite(createDataset(name), `Created ${name}`)
            if (created === undefined) return
            setChosen(current => [...current, created])
            setQuery("")
            list.setCursor(created)
        } else if (id)
            setChosen(current =>
                current.includes(id) ? current.filter(x => x !== id) : [...current, id]
            )
    }

    const confirmSelection = () => {
        pop()
        onConfirm(chosen.filter(id => datasets.some(d => d.id === id)))
    }

    const actions: Action[] = [
        {
            id: "toggle",
            title: list.cursor === CREATE ? "Create Dataset" : "Toggle Dataset",
            section: "Datasets",
            shortcut: { key: "enter" },
            run: () => toggle(list.cursor)
        },
        {
            id: "confirm",
            title: "Confirm Datasets",
            section: "Datasets",
            shortcut: { key: "enter", mod: true },
            run: confirmSelection
        }
    ]

    return (
        <Frame
            title={title}
            status={`${chosen.length} chosen`}
            search={{
                value: query,
                onChange: setQuery,
                placeholder: "Search or create datasets..."
            }}
            actions={actions}
            onKey={list.handleKey}
            onEscape={() => {
                if (!query) return false
                setQuery("")
                return true
            }}
        >
            <List
                items={rows}
                getId={row => row.id}
                section="Datasets"
                empty="Type a name to create a dataset."
                cursor={list.cursor}
                selected={[]}
                onClick={id => {
                    list.setCursor(id)
                    toggle(id)
                }}
                onActivate={() => undefined}
                renderRow={row => (
                    <>
                        <span className="mark">
                            {row.id === CREATE ? "[+]" : chosen.includes(row.id) ? "[x]" : "[ ]"}
                        </span>
                        <span className="row-title" data-named={chosen.includes(row.id)}>
                            {row.alias}
                        </span>
                        <span className="row-subtitle">{row.description}</span>
                    </>
                )}
            />
        </Frame>
    )
}

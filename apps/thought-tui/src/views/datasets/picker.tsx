import { useTerminalDimensions } from "@opentui/react"
import { useState } from "react"
import { useStore } from "../../data/store.tsx"
import type { Action } from "../../shell/action.ts"
import { Frame } from "../../shell/frame.tsx"
import { useNavigation } from "../../shell/navigation.tsx"
import { List } from "../../ui/list.tsx"
import { fitRow } from "../../ui/text.ts"
import { color } from "../../ui/theme.ts"
import { listHelp, useList } from "../../ui/use-list.ts"

type DatasetPickerProps = {
    title: string
    initial: string[]
    onConfirm: (datasetIds: string[]) => void
}

/** Pick many datasets: Enter toggles the cursor row, Ctrl-S confirms (the web's Cmd-Enter). */
export function DatasetPicker({ title, initial, onConfirm }: DatasetPickerProps) {
    const { datasets } = useStore()
    const { pop } = useNavigation()
    const screen = useTerminalDimensions()
    const [chosen, setChosen] = useState(initial)
    const list = useList(datasets.map(dataset => dataset.id))

    const toggle = (id: string) =>
        setChosen(current =>
            current.includes(id) ? current.filter(other => other !== id) : [...current, id]
        )

    const actions: Action[] = [
        ...(list.cursor
            ? [
                  {
                      id: "toggle",
                      title: "Toggle Dataset",
                      section: "Datasets",
                      shortcut: { key: "return" },
                      run: () => list.cursor && toggle(list.cursor)
                  }
              ]
            : []),
        {
            id: "confirm",
            title: "Confirm Datasets",
            section: "Datasets",
            shortcut: { key: "s", ctrl: true },
            run: () => {
                pop()
                onConfirm(datasets.filter(d => chosen.includes(d.id)).map(d => d.id))
            }
        }
    ]

    return (
        <Frame
            title="Select Datasets"
            count={{ total: datasets.length, selected: chosen.length }}
            heading={title}
            actions={actions}
            help={listHelp.filter(entry => !entry.title.includes("Selection"))}
            onKey={event => event.name !== "v" && !event.shift && list.handleKey(event)}
        >
            <List
                items={datasets}
                getId={dataset => dataset.id}
                cursor={list.cursor}
                selected={[]}
                empty="No datasets yet."
                onCursor={list.setCursor}
                onActivate={toggle}
                width={screen.width}
                renderRow={(dataset, _active, cells) => {
                    const on = chosen.includes(dataset.id)
                    const row = fitRow(dataset.alias, dataset.description, cells - 4)
                    return (
                        <text flexGrow={1} wrapMode="none">
                            <span fg={color.fgFaint}>{on ? "[x] " : "[ ] "}</span>
                            <span fg={on ? color.fg : color.fgMuted}>{row.title}</span>
                            <span fg={color.fgFaint}>{`  ${row.subtitle}`}</span>
                        </text>
                    )
                }}
            />
        </Frame>
    )
}

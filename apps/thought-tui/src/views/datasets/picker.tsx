import { useTerminalDimensions } from "@opentui/react"
import { useState } from "react"
import { useUi } from "../../config/provider.tsx"
import { useStore } from "../../data/store.tsx"
import type { Action } from "../../shell/action.ts"
import { Frame } from "../../shell/frame.tsx"
import { useNavigation } from "../../shell/navigation.tsx"
import { List } from "../../ui/list.tsx"
import { fitRow } from "../../ui/text.ts"
import { listHelp, useList } from "../../ui/use-list.ts"

type DatasetPickerProps = {
    title: string
    initial: string[]
    onConfirm: (datasetIds: string[]) => void
}

/** Pick many datasets: Enter toggles the cursor row, Ctrl-S confirms (the web's Cmd-Enter). */
export function DatasetPicker({ title, initial, onConfirm }: DatasetPickerProps) {
    const { datasets } = useStore()
    const { config, colors } = useUi()
    const { pop } = useNavigation()
    const screen = useTerminalDimensions()
    const [chosen, setChosen] = useState(initial)
    const list = useList(
        datasets.map(dataset => dataset.id),
        config.selection.extend
    )

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
            help={listHelp(config.glyphs).filter(entry => !entry.title.includes("Selection"))}
            onKey={event => !event.shift && list.handleKey(event)}
        >
            <List
                items={datasets}
                getId={dataset => dataset.id}
                cursor={list.cursor}
                selected={chosen}
                selecting
                width={screen.width}
                empty="No datasets yet."
                onCursor={list.setCursor}
                onToggle={toggle}
                onActivate={toggle}
                renderRow={(dataset, _active, cells) => {
                    const row = fitRow(dataset.alias, dataset.description, cells)
                    return (
                        <text flexGrow={1} wrapMode="none">
                            <span fg={chosen.includes(dataset.id) ? colors.fg : colors.fgMuted}>
                                {row.title}
                            </span>
                            <span fg={colors.fgFaint}>{`  ${row.subtitle}`}</span>
                        </text>
                    )
                }}
            />
        </Frame>
    )
}

import { useState } from "react"
import { useStore } from "../../../data/store.tsx"
import { useUi } from "../../config/provider.tsx"
import type { Action } from "../../shell/action.ts"
import { Frame } from "../../shell/frame.tsx"
import { List } from "../../shell/list.tsx"
import { useNavigation } from "../../shell/navigation.tsx"
import { listHelp, useList } from "../../shell/use-list.ts"
import { fitRow, Span, Text, useGridSize } from "../../ui/index.ts"

type DatasetPickerProps = {
    title: string
    initial: string[]
    onConfirm: (datasetIds: string[]) => void
}

/** Pick many datasets: Enter toggles the cursor row, the modifier and S confirm. */
export function DatasetPicker({ title, initial, onConfirm }: DatasetPickerProps) {
    const { datasets } = useStore()
    const { config } = useUi()
    const { pop } = useNavigation()
    const screen = useGridSize()
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
            shortcut: { key: "s", mod: true },
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
            onKey={key => !key.shift && list.handleKey(key)}
        >
            <List
                items={datasets}
                getId={dataset => dataset.id}
                cursor={list.cursor}
                selected={chosen}
                selecting
                width={screen.cols}
                empty="No datasets yet."
                onCursor={list.setCursor}
                onToggle={toggle}
                onActivate={toggle}
                renderRow={(dataset, _active, cells) => {
                    const row = fitRow(dataset.alias, dataset.description, cells)
                    return (
                        <Text flexGrow={1} wrapMode="none">
                            <Span fg={chosen.includes(dataset.id) ? "fg" : "fgMuted"}>
                                {row.title}
                            </Span>
                            <Span fg="fgFaint">{`  ${row.subtitle}`}</Span>
                        </Text>
                    )
                }}
            />
        </Frame>
    )
}

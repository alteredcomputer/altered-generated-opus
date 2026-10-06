import { useTerminalDimensions } from "@opentui/react"
import { useUi } from "../../config/provider.tsx"
import type { Dataset } from "../../data/model.ts"
import { useStore } from "../../data/store.tsx"
import type { Action } from "../../shell/action.ts"
import { Frame } from "../../shell/frame.tsx"
import { useNavigation } from "../../shell/navigation.tsx"
import { List } from "../../ui/list.tsx"
import { fitRow } from "../../ui/text.ts"
import { inset } from "../../ui/theme.ts"
import { listHelp, useList } from "../../ui/use-list.ts"
import { AttributeList } from "../attributes.tsx"
import { ThoughtsList } from "../thoughts/list.tsx"

/** Every dataset with its thought count; Enter opens its thoughts as a filtered list. */
export function DatasetsList() {
    const { datasets, thoughts, schemas } = useStore()
    const { config, colors } = useUi()
    const { push } = useNavigation()
    const screen = useTerminalDimensions()
    const panelCells = Math.floor(screen.width * config.inspector.width)
    const list = useList(
        datasets.map(dataset => dataset.id),
        config.selection.extend
    )
    const current = datasets.find(dataset => dataset.id === list.cursor)
    const countOf = (dataset: Dataset) =>
        thoughts.filter(thought => thought.datasetIds.includes(dataset.id)).length

    const actions: Action[] = current
        ? [
              {
                  id: "open",
                  title: "Show Thoughts",
                  section: "Dataset",
                  shortcut: { key: "return" },
                  run: () => push(<ThoughtsList datasetId={current.id} />)
              }
          ]
        : []

    return (
        <Frame
            title="View Datasets"
            count={{ total: datasets.length, selected: 0 }}
            heading="Datasets"
            actions={actions}
            help={listHelp(config.glyphs).filter(entry => !entry.title.includes("Selection"))}
            onKey={event => !event.shift && list.handleKey(event)}
        >
            <List
                items={datasets}
                getId={dataset => dataset.id}
                cursor={list.cursor}
                selected={[]}
                selecting={false}
                width={screen.width - (current ? panelCells : 0)}
                empty="No datasets yet."
                onCursor={list.setCursor}
                onToggle={() => {}}
                onActivate={id => push(<ThoughtsList datasetId={id} />)}
                renderRow={(dataset, _active, cells) => {
                    const row = fitRow(dataset.alias, dataset.description, cells - 5)
                    return (
                        <>
                            <text flexGrow={1} wrapMode="none">
                                <span fg={colors.fg}>{row.title}</span>
                                <span fg={colors.fgFaint}>{`  ${row.subtitle}`}</span>
                            </text>
                            <text flexShrink={0} wrapMode="none" fg={colors.fgMuted}>
                                {String(countOf(dataset)).padStart(3)}
                            </text>
                        </>
                    )
                }}
            />
            {current && (
                <box
                    width={panelCells}
                    border={["left"]}
                    borderColor={colors.rule}
                    paddingX={inset}
                    paddingY={1}
                >
                    <AttributeList
                        groups={[
                            [
                                { name: "Alias", value: current.alias, builtIn: true },
                                { name: "Content", value: current.description, builtIn: true }
                            ],
                            [
                                {
                                    name: "Attributes",
                                    value: schemas
                                        .filter(s => s.datasetId === current.id)
                                        .map(s => s.name)
                                        .join(", ")
                                },
                                { name: "Thoughts", value: String(countOf(current)) }
                            ]
                        ]}
                    />
                </box>
            )}
        </Frame>
    )
}

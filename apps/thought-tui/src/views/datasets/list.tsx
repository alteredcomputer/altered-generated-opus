import { useTerminalDimensions } from "@opentui/react"
import type { Dataset } from "../../data/model.ts"
import { useStore } from "../../data/store.tsx"
import type { Action } from "../../shell/action.ts"
import { Frame } from "../../shell/frame.tsx"
import { useNavigation } from "../../shell/navigation.tsx"
import { List } from "../../ui/list.tsx"
import { fitRow } from "../../ui/text.ts"
import { color, inset } from "../../ui/theme.ts"
import { listHelp, useList } from "../../ui/use-list.ts"
import { Chips, Heading, Mark } from "../markdown.tsx"
import { ThoughtsList } from "../thoughts/list.tsx"

/** Every dataset with its thought count; Enter opens its thoughts as a filtered list. */
export function DatasetsList() {
    const { datasets, thoughts, schemas } = useStore()
    const { push } = useNavigation()
    const screen = useTerminalDimensions()
    const panelCells = Math.floor(screen.width * 0.4)
    const list = useList(datasets.map(dataset => dataset.id))
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
                onActivate={id => push(<ThoughtsList datasetId={id} />)}
                width={screen.width - (current ? panelCells : 0)}
                renderRow={(dataset, _active, cells) => {
                    const row = fitRow(dataset.alias, dataset.description, cells - 5)
                    return (
                        <>
                            <text flexGrow={1} wrapMode="none">
                                <span fg={color.fg}>{row.title}</span>
                                <span fg={color.fgFaint}>{`  ${row.subtitle}`}</span>
                            </text>
                            <text flexShrink={0} wrapMode="none" fg={color.fgMuted}>
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
                    borderColor={color.rule}
                    paddingX={inset}
                    paddingY={1}
                    flexDirection="column"
                    gap={1}
                >
                    <Heading level={1}>{current.alias}</Heading>
                    <text fg={color.fgMuted}>{current.description}</text>
                    <Mark>---</Mark>
                    <Heading level={2}>Schemas</Heading>
                    <Chips
                        labels={schemas
                            .filter(schema => schema.datasetId === current.id)
                            .map(schema => `${schema.name}:${schema.type}`)}
                    />
                    <Heading level={2}>Thoughts</Heading>
                    <text fg={color.fg}>{String(countOf(current))}</text>
                </box>
            )}
        </Frame>
    )
}

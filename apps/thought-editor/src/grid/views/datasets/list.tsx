import type { Dataset } from "../../../data/model.ts"
import { useStore } from "../../../data/store.tsx"
import { useUi } from "../../config/provider.tsx"
import type { Action } from "../../shell/action.ts"
import { Frame } from "../../shell/frame.tsx"
import { List } from "../../shell/list.tsx"
import { useNavigation } from "../../shell/navigation.tsx"
import { listHelp, useList } from "../../shell/use-list.ts"
import { Box, fitRow, inset, padStart, Span, Text, useGridSize } from "../../ui/index.ts"
import { AttributeList } from "../attributes.tsx"
import { ThoughtsList } from "../thoughts/list.tsx"

/** Every dataset with its thought count; Enter opens its thoughts as a filtered list. */
export function DatasetsList() {
    const { datasets, thoughts, schemas } = useStore()
    const { config } = useUi()
    const { push } = useNavigation()
    const screen = useGridSize()
    const panelCells = Math.floor(screen.cols * config.inspector.width)
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
            onKey={key => !key.shift && list.handleKey(key)}
        >
            <List
                items={datasets}
                getId={dataset => dataset.id}
                cursor={list.cursor}
                selected={[]}
                selecting={false}
                width={screen.cols - (current ? panelCells : 0)}
                empty="No datasets yet."
                onCursor={list.setCursor}
                onToggle={() => {}}
                onActivate={id => push(<ThoughtsList datasetId={id} />)}
                renderRow={(dataset, _active, cells) => {
                    const row = fitRow(dataset.alias, dataset.description, cells - 5)
                    return (
                        <>
                            <Text flexGrow={1} wrapMode="none">
                                <Span fg="fg">{row.title}</Span>
                                <Span fg="fgFaint">{`  ${row.subtitle}`}</Span>
                            </Text>
                            <Text flexShrink={0} wrapMode="none" fg="fgMuted">
                                {padStart(String(countOf(dataset)), 3)}
                            </Text>
                        </>
                    )
                }}
            />
            {current && (
                <Box
                    width={panelCells}
                    border={["left"]}
                    borderColor="rule"
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
                </Box>
            )}
        </Frame>
    )
}

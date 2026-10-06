import type { Thought } from "../../data/model.ts"
import { useStore } from "../../data/store.tsx"
import { formatDateTime } from "../../ui/format.ts"
import { color, inset } from "../../ui/theme.ts"
import { Chips, Heading, Mark, Table } from "../markdown.tsx"

/** The list's detail pane, written as a markdown document like the web inspector. */
export function ThoughtInspector({ thought, width }: { thought: Thought; width: number }) {
    const { datasetById, schemaById } = useStore()

    const attributes = thought.attributes.map(attribute => {
        const schema = attribute.schemaId ? schemaById.get(attribute.schemaId) : undefined
        const dataset = schema && datasetById.get(schema.datasetId)
        return {
            key: attribute.name,
            value: attribute.value || "empty",
            note: schema && dataset ? `${dataset.alias}/${schema.name}:${schema.type}` : "no schema"
        }
    })

    return (
        <scrollbox
            width={width}
            border={["left"]}
            borderColor={color.rule}
            paddingX={inset}
            paddingY={1}
            verticalScrollbarOptions={{ visible: false }}
        >
            <box flexDirection="column" gap={1}>
                {thought.alias && <Heading level={1}>{thought.alias}</Heading>}
                {thought.content && <text fg={color.fgMuted}>{thought.content}</text>}
                <Mark>---</Mark>
                <Heading level={2}>Datasets</Heading>
                <Chips labels={thought.datasetIds.map(id => datasetById.get(id)?.alias ?? "")} />
                <Heading level={2}>Attributes</Heading>
                <Table rows={attributes} />
                <Mark>---</Mark>
                <Table
                    rows={[
                        { key: "created", value: formatDateTime(thought.createdAt) },
                        { key: "updated", value: formatDateTime(thought.updatedAt) }
                    ]}
                />
            </box>
        </scrollbox>
    )
}

import type { Thought } from "../../../data/model.ts"
import { useStore } from "../../../data/store.tsx"
import { formatDateTime } from "../../shell/format.ts"
import { inset, ScrollBox } from "../../ui/index.ts"
import { AttributeList } from "../attributes.tsx"

/** The list's detail pane: the thought's attributes, uniformly (D174). */
export function ThoughtInspector({ thought, width }: { thought: Thought; width: number }) {
    const { datasetById, schemaById } = useStore()

    return (
        <ScrollBox width={width} border={["left"]} borderColor="rule" paddingX={inset} paddingY={1}>
            <AttributeList
                groups={[
                    [
                        { name: "Alias", value: thought.alias ?? "", builtIn: true },
                        { name: "Content", value: thought.content, builtIn: true }
                    ],
                    [
                        {
                            name: "Datasets",
                            value: thought.datasetIds
                                .map(id => datasetById.get(id)?.alias ?? "")
                                .join(", ")
                        },
                        ...thought.attributes.map(attribute => ({
                            name:
                                (attribute.schemaId && schemaById.get(attribute.schemaId)?.name) ||
                                attribute.name,
                            value: attribute.value
                        }))
                    ],
                    [
                        { name: "Created", value: formatDateTime(thought.createdAt), system: true },
                        {
                            name: "Modified",
                            value: formatDateTime(thought.updatedAt),
                            system: true
                        },
                        { name: "Added", value: formatDateTime(thought.addedAt), system: true }
                    ]
                ]}
            />
        </ScrollBox>
    )
}

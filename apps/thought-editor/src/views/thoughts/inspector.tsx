import { Fragment } from "react"
import type { Thought } from "../../data/model.ts"
import { useStore } from "../../data/store.tsx"
import { formatDateTime } from "../../ui/format.ts"

/** The list detail pane, written as a markdown document to match the rest of the surface. */
export function ThoughtInspector({ thought }: { thought: Thought }) {
    const { datasetById, schemaById } = useStore()

    return (
        <>
            {thought.alias && (
                <h1 className="strong">
                    <span className="mark"># </span>
                    {thought.alias}
                </h1>
            )}
            {thought.content && <p className="inspector-content">{thought.content}</p>}
            <p className="mark">---</p>

            <h2 className="strong">
                <span className="mark">## </span>Datasets
            </h2>
            <div className="inspector-chips">
                {thought.datasetIds.length === 0 && <span className="faint">None</span>}
                {thought.datasetIds.map(id => (
                    <span key={id} className="chip">
                        {datasetById.get(id)?.alias}
                    </span>
                ))}
            </div>

            <h2 className="strong">
                <span className="mark">## </span>Attributes
            </h2>
            {thought.attributes.length === 0 ? (
                <span className="faint">None</span>
            ) : (
                <div className="inspector-table">
                    {thought.attributes.map(attribute => {
                        const schema = attribute.schemaId
                            ? schemaById.get(attribute.schemaId)
                            : null
                        const dataset = schema ? datasetById.get(schema.datasetId) : null
                        return (
                            <Fragment key={attribute.id}>
                                <span className="faint">{attribute.name}</span>
                                <span>
                                    {attribute.value || <span className="faint">empty</span>}
                                    <span className="faint">
                                        {schema && dataset
                                            ? `  ${dataset.alias}/${schema.name}:${schema.type}`
                                            : "  no schema"}
                                    </span>
                                </span>
                            </Fragment>
                        )
                    })}
                </div>
            )}

            <p className="mark">---</p>
            <div className="inspector-table">
                <span className="faint">created</span>
                <span>{formatDateTime(thought.createdAt)}</span>
                <span className="faint">updated</span>
                <span>{formatDateTime(thought.updatedAt)}</span>
            </div>
        </>
    )
}

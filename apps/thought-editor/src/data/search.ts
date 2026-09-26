import type { Dataset, Thought } from "./model.ts"

/** Case-insensitive: every word of the query must appear somewhere in the fields. */
export const matches = (query: string, ...fields: string[]) => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean)
    const haystack = fields.join(" ").toLowerCase()
    return words.every(word => haystack.includes(word))
}

export const filterThoughts = (
    thoughts: Thought[],
    query: string,
    datasetById: Map<string, Dataset>,
    datasetFilter: string | null
) =>
    thoughts.filter(
        thought =>
            (!datasetFilter || thought.datasetIds.includes(datasetFilter)) &&
            matches(
                query,
                thought.alias ?? "",
                thought.content,
                ...thought.datasetIds.map(id => datasetById.get(id)?.alias ?? ""),
                ...thought.attributes.flatMap(attribute => [attribute.name, attribute.value])
            )
    )

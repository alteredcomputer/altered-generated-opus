import { newId, type Snapshot, type Thought } from "./model.ts"

/**
 * Every write is a pure function from one snapshot to the next. The store keeps snapshots in memory
 * only (nothing reaches disk), so these are the whole persistence layer and the unit under test.
 */
export type ThoughtDraft = Pick<Thought, "alias" | "content" | "datasetIds" | "attributes">

export const saveThought = (
    snapshot: Snapshot,
    draft: ThoughtDraft,
    id: string | null,
    now = Date.now()
): { snapshot: Snapshot; id: string } => {
    const clean: ThoughtDraft = {
        alias: draft.alias?.trim() || null,
        content: draft.content.trim(),
        datasetIds: draft.datasetIds,
        attributes: draft.attributes.filter(a => a.name.trim() || a.value.trim())
    }
    if (!clean.alias && !clean.content) throw new Error("A thought needs an alias or content.")

    const existing = id ? snapshot.thoughts.find(t => t.id === id) : undefined
    if (id && !existing) throw new Error("That thought no longer exists.")

    const thought: Thought = existing
        ? { ...existing, ...clean, updatedAt: now }
        : { id: newId(), ...clean, createdAt: now, updatedAt: now }

    const thoughts = existing
        ? snapshot.thoughts.map(t => (t.id === thought.id ? thought : t))
        : [thought, ...snapshot.thoughts]

    return { snapshot: { ...snapshot, thoughts }, id: thought.id }
}

export const deleteThoughts = (snapshot: Snapshot, ids: string[]): Snapshot => ({
    ...snapshot,
    thoughts: snapshot.thoughts.filter(t => !ids.includes(t.id))
})

/** Removing a dataset also clears the schema of any attribute that belonged to it. */
export const setThoughtDatasets = (
    snapshot: Snapshot,
    id: string,
    datasetIds: string[],
    now = Date.now()
): Snapshot => ({
    ...snapshot,
    thoughts: snapshot.thoughts.map(thought =>
        thought.id === id
            ? {
                  ...thought,
                  datasetIds,
                  attributes: detachSchemas(snapshot, thought.attributes, datasetIds),
                  updatedAt: now
              }
            : thought
    )
})

export const addThoughtsToDatasets = (
    snapshot: Snapshot,
    ids: string[],
    datasetIds: string[],
    now = Date.now()
): Snapshot => ({
    ...snapshot,
    thoughts: snapshot.thoughts.map(thought =>
        ids.includes(thought.id)
            ? {
                  ...thought,
                  datasetIds: [...new Set([...thought.datasetIds, ...datasetIds])],
                  updatedAt: now
              }
            : thought
    )
})

export const detachSchemas = (
    snapshot: Snapshot,
    attributes: Thought["attributes"],
    datasetIds: string[]
) =>
    attributes.map(attribute => {
        const schema = snapshot.schemas.find(s => s.id === attribute.schemaId)
        return schema && !datasetIds.includes(schema.datasetId)
            ? { ...attribute, schemaId: null }
            : attribute
    })

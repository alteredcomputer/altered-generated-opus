import { log } from "../observability/log.ts"
import { db } from "./db.ts"
import {
    type Attribute,
    type Dataset,
    newId,
    type Schema,
    type SchemaType,
    type Thought,
    validateValue
} from "./model.ts"
import { trackPending } from "./pending.ts"
import { seed } from "./seed.ts"

/** A write the user can fix by changing their input. The message is shown to them as written. */
export class ValidationError extends Error {
    override readonly name = "ValidationError"
}

/** A write that failed for a reason outside the user's input. */
export class WriteError extends Error {
    override readonly name = "WriteError"
    constructor(
        readonly operation: string,
        override readonly cause: unknown
    ) {
        super(`${operation} failed.`)
    }
}

const tables = [db.thoughts, db.datasets, db.schemas, db.meta]

const write = async <T>(operation: string, work: () => Promise<T>): Promise<T> => {
    const startedAt = performance.now()
    try {
        const result = await trackPending(db.transaction("rw", tables, work))
        log("info", "write", { operation, ms: Math.round(performance.now() - startedAt) })
        return result
    } catch (cause) {
        if (cause instanceof ValidationError) throw cause
        log("error", "write failed", { operation, cause })
        throw new WriteError(operation, cause)
    }
}

const clean = (value: string) => value.trim()

export type ThoughtInput = {
    id?: string
    alias: string
    content: string
    datasetIds: string[]
    attributes: Attribute[]
}

const checkAttributes = async (attributes: Attribute[]) => {
    const kept = attributes
        .map(attribute => ({ ...attribute, name: clean(attribute.name) }))
        .filter(attribute => attribute.name || attribute.value.trim())

    for (const attribute of kept) {
        if (!attribute.name) throw new ValidationError("Every attribute with a value needs a name.")
        if (!attribute.schemaId) continue

        const schema = await db.schemas.get(attribute.schemaId)
        if (!schema)
            throw new ValidationError(`The schema for "${attribute.name}" no longer exists.`)

        const problem = validateValue(schema.type, attribute.value)
        if (problem) throw new ValidationError(`${attribute.name}: ${problem}`)
    }

    return kept
}

export const saveThought = (input: ThoughtInput) =>
    write(input.id ? "update thought" : "create thought", async () => {
        const alias = clean(input.alias) || null
        const content = input.content.trim()
        if (!alias && !content) throw new ValidationError("A thought needs an alias or content.")

        const attributes = await checkAttributes(input.attributes)
        const schemaDatasets = await db.schemas.bulkGet(
            attributes.flatMap(attribute => (attribute.schemaId ? [attribute.schemaId] : []))
        )
        const datasetIds = [
            ...new Set([
                ...input.datasetIds,
                ...schemaDatasets.flatMap(schema => (schema ? [schema.datasetId] : []))
            ])
        ]

        const now = Date.now()
        const existing = input.id ? await db.thoughts.get(input.id) : undefined
        const thought: Thought = {
            id: existing?.id ?? newId(),
            alias,
            content,
            datasetIds,
            attributes,
            createdAt: existing?.createdAt ?? now,
            updatedAt: now,
            addedAt: existing?.addedAt ?? now
        }

        await db.thoughts.put(thought)
        return thought.id
    })

export const deleteThoughts = (ids: string[]) =>
    write("delete thoughts", () => db.thoughts.bulkDelete(ids))

export const addThoughtsToDatasets = (ids: string[], datasetIds: string[]) =>
    write("add thoughts to datasets", async () => {
        await db.thoughts
            .where("id")
            .anyOf(ids)
            .modify(thought => {
                thought.datasetIds = [...new Set([...thought.datasetIds, ...datasetIds])]
                thought.updatedAt = Date.now()
            })
    })

/**
 * Sets one thought's datasets exactly. Attributes whose schema belongs to a removed dataset keep
 * their name and value and lose the schema, which the inspector then shows as unassigned.
 */
export const setThoughtDatasets = (id: string, datasetIds: string[]) =>
    write("set thought datasets", async () => {
        const schemas = await db.schemas.toArray()
        const kept = new Set(datasetIds)

        await db.thoughts
            .where("id")
            .equals(id)
            .modify(thought => {
                thought.datasetIds = datasetIds
                thought.attributes = thought.attributes.map(attribute => {
                    const schema = schemas.find(s => s.id === attribute.schemaId)
                    return schema && !kept.has(schema.datasetId)
                        ? { ...attribute, schemaId: null }
                        : attribute
                })
                thought.updatedAt = Date.now()
            })
    })

export type SchemaInput = { id?: string; name: string; type: SchemaType }

export type DatasetInput = {
    id?: string
    alias: string
    description: string
    schemas: SchemaInput[]
}

const checkAlias = async (alias: string, id: string | undefined) => {
    if (!alias) throw new ValidationError("A dataset needs an alias.")

    const clash = await db.datasets
        .filter(dataset => dataset.id !== id && dataset.alias.toLowerCase() === alias.toLowerCase())
        .first()
    if (clash) throw new ValidationError(`A dataset called "${alias}" already exists.`)
}

/** Detaches attributes from schemas that no longer exist, keeping their names and values. */
const detachSchemas = (schemaIds: string[]) =>
    db.thoughts
        .filter(thought =>
            thought.attributes.some(a => a.schemaId && schemaIds.includes(a.schemaId))
        )
        .modify(thought => {
            thought.attributes = thought.attributes.map(attribute =>
                attribute.schemaId && schemaIds.includes(attribute.schemaId)
                    ? { ...attribute, schemaId: null }
                    : attribute
            )
        })

export const saveDataset = (input: DatasetInput) =>
    write(input.id ? "update dataset" : "create dataset", async () => {
        const alias = clean(input.alias)
        await checkAlias(alias, input.id)

        const schemas = input.schemas
            .map(schema => ({ ...schema, name: clean(schema.name) }))
            .filter(schema => schema.name)
        const names = schemas.map(schema => schema.name.toLowerCase())
        if (new Set(names).size !== names.length)
            throw new ValidationError("Schema names must be unique within a dataset.")

        const now = Date.now()
        const existing = input.id ? await db.datasets.get(input.id) : undefined
        const dataset: Dataset = {
            id: existing?.id ?? newId(),
            alias,
            description: input.description.trim(),
            createdAt: existing?.createdAt ?? now,
            updatedAt: now
        }
        await db.datasets.put(dataset)

        const previous = await db.schemas.where("datasetId").equals(dataset.id).toArray()
        const keptIds = new Set(schemas.flatMap(schema => (schema.id ? [schema.id] : [])))
        const removedIds = previous.filter(schema => !keptIds.has(schema.id)).map(s => s.id)

        await db.schemas.bulkDelete(removedIds)
        await detachSchemas(removedIds)
        await db.schemas.bulkPut(
            schemas.map(
                (schema): Schema => ({
                    id: schema.id ?? newId(),
                    datasetId: dataset.id,
                    name: schema.name,
                    type: schema.type,
                    createdAt: previous.find(p => p.id === schema.id)?.createdAt ?? now
                })
            )
        )

        return dataset.id
    })

export const createDataset = (alias: string) => saveDataset({ alias, description: "", schemas: [] })

export const deleteDataset = (id: string) =>
    write("delete dataset", async () => {
        const schemaIds = (await db.schemas.where("datasetId").equals(id).toArray()).map(s => s.id)

        await db.thoughts
            .where("datasetIds")
            .equals(id)
            .modify(thought => {
                thought.datasetIds = thought.datasetIds.filter(datasetId => datasetId !== id)
            })
        await detachSchemas(schemaIds)
        await db.schemas.bulkDelete(schemaIds)
        await db.datasets.delete(id)
    })

const SEEDED = "seeded"

const insertSeed = async () => {
    const data = seed()
    await db.datasets.bulkPut(data.datasets)
    await db.schemas.bulkPut(data.schemas)
    await db.thoughts.bulkPut(data.thoughts)
    await db.meta.put({ key: SEEDED, value: true })
}

/** Seeds demo data once per browser. Deleting every thought afterwards does not bring it back. */
export const seedOnce = () =>
    write("seed demo data", async () => {
        if (await db.meta.get(SEEDED)) return
        await insertSeed()
    })

export const resetDemoData = () =>
    write("reset demo data", async () => {
        await Promise.all(tables.map(table => table.clear()))
        await insertSeed()
    })

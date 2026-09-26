import { Dexie, type EntityTable } from "dexie"
import type { Dataset, Schema, Thought } from "./model.ts"

type Meta = { key: string; value: unknown }

export type EditorDatabase = Dexie & {
    thoughts: EntityTable<Thought, "id">
    datasets: EntityTable<Dataset, "id">
    schemas: EntityTable<Schema, "id">
    meta: EntityTable<Meta, "key">
}

export const createDatabase = (name: string) => {
    const db = new Dexie(name) as EditorDatabase

    db.version(1).stores({
        thoughts: "id, createdAt, *datasetIds",
        datasets: "id, alias",
        schemas: "id, datasetId",
        meta: "key"
    })

    return db
}

export const db = createDatabase("altered-thought-editor")

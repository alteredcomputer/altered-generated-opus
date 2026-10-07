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

    //  Version 2 (D176): thoughts gain `addedAt`, when they entered ALTERED, the grid editor's sort
    //  key. Every thought stored before it was added in place, so it is filled from `createdAt`;
    //  nothing else changes, and the classic editor reads the same rows.
    db.version(2)
        .stores({ thoughts: "id, createdAt, addedAt, *datasetIds" })
        .upgrade(tx =>
            tx
                .table<Thought, string>("thoughts")
                .toCollection()
                .modify(thought => {
                    thought.addedAt ??= thought.createdAt
                })
        )

    return db
}

export const db = createDatabase("altered-thought-editor")

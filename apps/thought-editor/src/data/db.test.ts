import "fake-indexeddb/auto"
import { Dexie } from "dexie"
import { describe, expect, it } from "vitest"
import { createDatabase } from "./db.ts"

describe("schema upgrade", () => {
    it("fills addedAt from createdAt and keeps everything else (version 1 to 2)", async () => {
        const name = "upgrade-test"
        const old = new Dexie(name)
        old.version(1).stores({
            thoughts: "id, createdAt, *datasetIds",
            datasets: "id, alias",
            schemas: "id, datasetId",
            meta: "key"
        })
        const stored = {
            id: "t1",
            alias: "Local first",
            content: "Open instantly from disk.",
            datasetIds: ["d1"],
            attributes: [{ id: "a1", name: "status", value: "locked", schemaId: null }],
            createdAt: 1000,
            updatedAt: 2000
        }
        await old.table("thoughts").put(stored)
        await old.table("meta").put({ key: "seeded", value: true })
        old.close()

        const db = createDatabase(name)
        expect(await db.thoughts.get("t1")).toEqual({ ...stored, addedAt: 1000 })
        expect(await db.meta.get("seeded")).toEqual({ key: "seeded", value: true })
        expect((await db.thoughts.orderBy("addedAt").first())?.id).toBe("t1")
        db.close()
    })
})

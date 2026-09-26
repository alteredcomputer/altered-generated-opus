import "fake-indexeddb/auto"
import { beforeEach, describe, expect, it } from "vitest"
import { db } from "./db.ts"
import { filterThoughts } from "./search.ts"
import {
    deleteDataset,
    resetDemoData,
    saveDataset,
    saveThought,
    setThoughtDatasets,
    ValidationError
} from "./writes.ts"

beforeEach(resetDemoData)

const datasetNamed = async (alias: string) => {
    const dataset = await db.datasets.where("alias").equals(alias).first()
    if (!dataset) throw new Error(`missing ${alias}`)
    return dataset
}

describe("seed", () => {
    it("creates 25 thoughts whose datasets all exist", async () => {
        const thoughts = await db.thoughts.toArray()
        const datasetIds = new Set((await db.datasets.toArray()).map(d => d.id))

        expect(thoughts).toHaveLength(25)
        for (const thought of thoughts)
            for (const id of thought.datasetIds) expect(datasetIds.has(id)).toBe(true)
    })
})

describe("saveThought", () => {
    it("refuses a thought with neither alias nor content", async () => {
        await expect(
            saveThought({ alias: " ", content: "", datasetIds: [], attributes: [] })
        ).rejects.toBeInstanceOf(ValidationError)
    })

    it("adds the dataset that owns an assigned schema", async () => {
        const koa = await datasetNamed("koa")
        const phase = await db.schemas.where("datasetId").equals(koa.id).first()

        const id = await saveThought({
            alias: "",
            content: "New thought",
            datasetIds: [],
            attributes: [{ id: "a", name: "phase", value: "memory", schemaId: phase?.id ?? null }]
        })

        expect((await db.thoughts.get(id))?.datasetIds).toEqual([koa.id])
    })

    it("drops attribute rows left completely empty", async () => {
        const id = await saveThought({
            alias: "x",
            content: "",
            datasetIds: [],
            attributes: [{ id: "a", name: " ", value: "", schemaId: null }]
        })
        expect((await db.thoughts.get(id))?.attributes).toEqual([])
    })
})

describe("datasets and schemas", () => {
    it("refuses a duplicate alias regardless of case", async () => {
        await expect(
            saveDataset({ alias: "KOA", description: "", schemas: [] })
        ).rejects.toBeInstanceOf(ValidationError)
    })

    it("detaches attributes when their dataset leaves the thought, keeping the value", async () => {
        const decisions = await datasetNamed("decisions")
        const thought = await db.thoughts.filter(t => t.alias === "Local first").first()
        if (!thought) throw new Error("missing seed thought")

        await setThoughtDatasets(thought.id, [])

        const after = await db.thoughts.get(thought.id)
        expect(after?.datasetIds).not.toContain(decisions.id)
        expect(after?.attributes[0]).toMatchObject({
            name: "status",
            value: "prototype",
            schemaId: null
        })
    })

    it("deleting a dataset keeps its thoughts and removes its schemas", async () => {
        const decisions = await datasetNamed("decisions")
        const before = await db.thoughts.count()

        await deleteDataset(decisions.id)

        expect(await db.thoughts.count()).toBe(before)
        expect(await db.schemas.where("datasetId").equals(decisions.id).count()).toBe(0)
        expect(await db.thoughts.where("datasetIds").equals(decisions.id).count()).toBe(0)
    })
})

describe("filterThoughts", () => {
    it("matches every word across alias, content, dataset, and attribute values", async () => {
        const thoughts = await db.thoughts.toArray()
        const datasetById = new Map((await db.datasets.toArray()).map(d => [d.id, d]))

        expect(filterThoughts(thoughts, "koa memory", datasetById, null).map(t => t.alias)).toEqual(
            ["Koa remembers decisions"]
        )
        expect(
            filterThoughts(thoughts, "", datasetById, (await datasetNamed("tenets")).id)
        ).toHaveLength(7)
    })
})

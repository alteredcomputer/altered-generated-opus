import { describe, expect, test } from "bun:test"
import { seed } from "./seed.ts"
import { addThoughtsToDatasets, deleteThoughts, saveThought, setThoughtDatasets } from "./writes.ts"

const base = seed(0)
const empty = { alias: "", content: "", datasetIds: [], attributes: [] }

describe("writes", () => {
    test("creating puts the new thought first and trims it", () => {
        const { snapshot, id } = saveThought(base, { ...empty, alias: "  New  " }, null, 5)
        expect(snapshot.thoughts[0]).toMatchObject({ id, alias: "New", createdAt: 5 })
        expect(snapshot.thoughts).toHaveLength(base.thoughts.length + 1)
    })

    test("a thought needs an alias or content", () => {
        expect(() => saveThought(base, empty, null)).toThrow("alias or content")
    })

    test("editing keeps the id and creation time, drops blank attributes", () => {
        const [first] = base.thoughts
        if (!first) throw new Error("seed is empty")
        const blank = { id: "x", name: " ", value: "", schemaId: null }
        const draft = { ...first, content: "Changed", attributes: [...first.attributes, blank] }
        const { snapshot } = saveThought(base, draft, first.id, 9)
        const saved = snapshot.thoughts.find(t => t.id === first.id)
        expect(saved).toMatchObject({
            content: "Changed",
            createdAt: first.createdAt,
            updatedAt: 9
        })
        expect(saved?.attributes).toEqual(first.attributes)
    })

    test("removing a dataset detaches its schemas from attributes", () => {
        const withSchema = base.thoughts.find(t => t.attributes.some(a => a.schemaId))
        if (!withSchema) throw new Error("seed has no schema-bound attribute")
        const next = setThoughtDatasets(base, withSchema.id, [])
        const saved = next.thoughts.find(t => t.id === withSchema.id)
        expect(saved?.attributes.every(a => a.schemaId === null)).toBe(true)
    })

    test("adding many thoughts to datasets merges without duplicates", () => {
        const [a, b] = base.thoughts
        const [d] = base.datasets
        if (!a || !b || !d) throw new Error("seed is too small")
        const next = addThoughtsToDatasets(base, [a.id, b.id], [d.id, d.id])
        for (const id of [a.id, b.id]) {
            const ids = next.thoughts.find(t => t.id === id)?.datasetIds ?? []
            expect(ids.filter(x => x === d.id)).toHaveLength(1)
        }
    })

    test("delete removes exactly the named thoughts", () => {
        const ids = base.thoughts.slice(0, 2).map(t => t.id)
        const next = deleteThoughts(base, ids)
        expect(next.thoughts).toHaveLength(base.thoughts.length - 2)
        expect(next.thoughts.some(t => ids.includes(t.id))).toBe(false)
    })
})

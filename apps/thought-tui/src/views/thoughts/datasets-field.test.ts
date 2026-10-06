import { describe, expect, test } from "bun:test"
import type { Dataset } from "../../data/model.ts"
import { accept, currentToken, splitNames, suggest, unknownNames } from "./datasets-field.ts"

const ds = (alias: string): Dataset => ({
    id: alias,
    alias,
    description: "",
    createdAt: 0,
    updatedAt: 0
})
const all = ["Tenets", "Decisions", "Ideas", "Questions"].map(ds)

describe("datasets field", () => {
    test("splits names and finds the token being typed", () => {
        expect(splitNames("Tenets, Ideas, ")).toEqual(["Tenets", "Ideas"])
        expect(currentToken("Tenets, de")).toBe("de")
    })

    test("suggests matches that are not already listed", () => {
        expect(suggest("Ideas, e", all).map(d => d.alias)).toEqual([
            "Tenets",
            "Decisions",
            "Questions"
        ])
        expect(suggest("Tenets, ", all)).toEqual([])
    })

    test("accepting replaces the token", () => {
        expect(accept("Tenets, de", "Decisions")).toBe("Tenets, Decisions, ")
        expect(accept("de", "Decisions")).toBe("Decisions, ")
    })

    test("names that match no dataset are reported, ignoring case", () => {
        expect(unknownNames("tenets, Nope", all)).toEqual(["Nope"])
    })
})

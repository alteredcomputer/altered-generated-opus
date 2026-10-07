import { describe, expect, it } from "vitest"
import overrides from "./grid.config.ts"
import { defaults, resolve } from "./schema.ts"

describe("grid config", () => {
    it("resolves the committed settings file", () => {
        expect(resolve(overrides).selection.mark).toBe("×")
    })

    it("keeps defaults for what is not set", () => {
        expect(resolve({ list: { gap: 1 } })).toEqual({
            ...defaults,
            list: { ...defaults.list, gap: 1 }
        })
    })

    it("names every bad key", () => {
        expect(() => resolve({ list: { gap: "1", date: "never" }, nope: 1 })).toThrow(
            "list.gap must be a number; list.date must be one of added, modified, created; nope is not a setting"
        )
    })
})

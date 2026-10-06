import { describe, expect, test } from "bun:test"
import { defaults, resolve } from "./schema.ts"

describe("config", () => {
    test("no overrides gives the defaults", () => {
        expect(resolve({})).toEqual(defaults)
    })

    test("overrides merge deeply", () => {
        const config = resolve({ list: { gap: 1 } })
        expect(config.list).toEqual({ ...defaults.list, gap: 1 })
        expect(config.header).toEqual(defaults.header)
    })

    test("unknown keys, wrong types, and bad choices are all named", () => {
        expect(() =>
            resolve({ list: { gapp: 1, date: "opened" }, header: { paddingTop: "1" } })
        ).toThrow(
            /list.gapp is not a setting; list.date must be one of .*; header.paddingTop must be a number/
        )
    })
})

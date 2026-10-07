import { describe, expect, it } from "vitest"
import { formatDateTime } from "./format.ts"

describe("formatDateTime", () => {
    it("joins the parts the same way in every engine", () => {
        expect(formatDateTime(Date.UTC(2026, 9, 7, 12, 0))).toMatch(
            /^[A-Z][a-z]{2} \d{1,2}, 2026, \d{2}:\d{2}( [AP]M)?$/
        )
    })
})

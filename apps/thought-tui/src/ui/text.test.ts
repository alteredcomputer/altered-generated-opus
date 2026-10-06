import { describe, expect, test } from "bun:test"
import { ellipsize, fitRow, width } from "./text.ts"

describe("ellipsize", () => {
    test("leaves text that fits alone", () => {
        expect(ellipsize("Local first", 11)).toBe("Local first")
    })

    test("ends with an ellipsis inside the width", () => {
        const out = ellipsize("Open instantly from disk", 10)
        expect(out).toBe("Open inst…")
        expect(width(out)).toBeLessThanOrEqual(10)
    })

    test("does not leave a space before the ellipsis", () => {
        expect(ellipsize("Open instantly", 6)).toBe("Open…")
    })

    test("folds newlines into spaces for a one-line preview", () => {
        expect(ellipsize("a\nb", 5)).toBe("a b")
    })

    test("counts wide characters as two cells", () => {
        expect(width(ellipsize("日本語のテキスト", 7))).toBeLessThanOrEqual(7)
    })
})

describe("fitRow", () => {
    test("gives the title up to 60% and the rest to the subtitle", () => {
        const row = fitRow("A".repeat(40), "b".repeat(40), 50)
        expect(width(row.title)).toBe(30)
        expect(width(row.title) + 2 + width(row.subtitle)).toBeLessThanOrEqual(50)
    })

    test("lets a long title use the room a short subtitle leaves", () => {
        expect(fitRow("A".repeat(40), "bb", 50).title).toBe("A".repeat(40))
    })
})

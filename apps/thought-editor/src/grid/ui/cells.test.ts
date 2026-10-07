import { describe, expect, it } from "vitest"
import { ellipsize, ellipsizeMiddle, fitRow, segments, width } from "./cells.ts"

describe("cells", () => {
    it("counts wide characters as two cells and marks as none", () => {
        expect(width("abc")).toBe(3)
        expect(width("日本")).toBe(4)
        expect(width("é")).toBe(1)
    })

    it("pins characters the font lacks to their cells", () => {
        expect(segments("Edit ↵")).toEqual([{ text: "Edit " }, { text: "↵", cells: 1 }])
        expect(segments("plain • text")).toEqual([{ text: "plain • text" }])
        expect(segments("日")).toEqual([{ text: "日", cells: 2 }])
    })
})

describe("ellipsize", () => {
    it("leaves text that fits alone", () => {
        expect(ellipsize("Local first", 11)).toBe("Local first")
    })

    it("ends with an ellipsis inside the width", () => {
        const out = ellipsize("Open instantly from disk", 10)
        expect(out).toBe("Open inst…")
        expect(width(out)).toBeLessThanOrEqual(10)
    })

    it("does not leave a space before the ellipsis", () => {
        expect(ellipsize("Open instantly", 6)).toBe("Open…")
    })

    it("folds newlines into spaces for a one-line preview", () => {
        expect(ellipsize("a\nb", 5)).toBe("a b")
    })

    it("counts wide characters as two cells", () => {
        expect(width(ellipsize("日本語のテキスト", 7))).toBeLessThanOrEqual(7)
    })

    it("elides the middle when asked", () => {
        expect(ellipsizeMiddle("apps/thought-editor/src", 9)).toBe("apps…/src")
    })
})

describe("fitRow", () => {
    it("gives the title up to 60% and the rest to the subtitle", () => {
        const row = fitRow("A".repeat(40), "b".repeat(40), 50)
        expect(width(row.title)).toBe(30)
        expect(width(row.title) + 2 + width(row.subtitle)).toBeLessThanOrEqual(50)
    })

    it("lets a long title use the room a short subtitle leaves", () => {
        expect(fitRow("A".repeat(40), "bb", 50).title).toBe("A".repeat(40))
    })
})

import { describe, expect, it } from "vitest"
import { caretChar, inputCaret, toCell } from "./input.tsx"
import { gridSize } from "./metrics.ts"
import { snapRows } from "./scroll-box.tsx"

describe("grid size", () => {
    it("floors the window to whole cells", () => {
        expect(gridSize(1280, 800, 7, 15)).toEqual({ cols: 182, rows: 53 })
        expect(gridSize(390, 844, 7, 15)).toEqual({ cols: 55, rows: 56 })
    })

    it("never reports less than one cell", () => {
        expect(gridSize(0, 0, 7, 15)).toEqual({ cols: 1, rows: 1 })
    })
})

describe("caret", () => {
    it("sits at the column of the offset, less the scroll", () => {
        expect(inputCaret("hello", 2, 0, 7, "").x).toBe(14)
        expect(inputCaret("hello", 5, 7, 7, "").x).toBe(28)
        expect(inputCaret("日本", 1, 0, 7, "").x).toBe(14)
    })

    it("shows the character under it, or the placeholder's while empty", () => {
        expect(caretChar("abc", 1, "")).toBe("b")
        expect(caretChar("abc", 3, "")).toBe(" ")
        expect(caretChar("", 0, "› Search")).toBe("›")
    })

    it("snaps measured positions to cells", () => {
        expect(toCell(21, 7)).toBe(3)
        expect(toCell(29.6, 15)).toBe(2)
    })
})

describe("scrolling", () => {
    it("lands on whole rows inside the content", () => {
        expect(snapRows(22, 15, 300)).toBe(15)
        expect(snapRows(-5, 15, 300)).toBe(0)
        expect(snapRows(999, 15, 300)).toBe(300)
    })
})

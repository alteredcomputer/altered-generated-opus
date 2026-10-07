import { describe, expect, it } from "vitest"
import { caretBox, type FieldBox, isInside, isTextField, splitAt } from "./caret-math.ts"

const field = (over: Partial<FieldBox> = {}): FieldBox => ({
    rect: { left: 100, top: 50, right: 400, bottom: 84 },
    clientLeft: 1,
    clientTop: 1,
    clientHeight: 32,
    paddingTop: 4,
    paddingBottom: 4,
    scrollLeft: 0,
    scrollTop: 0,
    lineHeight: 20,
    multiline: false,
    ...over
})

describe("isTextField", () => {
    it("takes text inputs and textareas", () => {
        expect(isTextField({ tagName: "INPUT", type: "text" })).toBe(true)
        expect(isTextField({ tagName: "INPUT", type: "search" })).toBe(true)
        expect(isTextField({ tagName: "TEXTAREA" })).toBe(true)
    })

    it("leaves out other inputs and fields that cannot be edited", () => {
        expect(isTextField({ tagName: "INPUT", type: "password" })).toBe(false)
        expect(isTextField({ tagName: "INPUT", type: "checkbox" })).toBe(false)
        expect(isTextField({ tagName: "INPUT" })).toBe(false)
        expect(isTextField({ tagName: "TEXTAREA", readOnly: true })).toBe(false)
        expect(isTextField({ tagName: "INPUT", type: "text", disabled: true })).toBe(false)
        expect(isTextField({ tagName: "BUTTON" })).toBe(false)
    })
})

describe("splitAt", () => {
    it("puts the next character under the caret", () => {
        expect(splitAt("hello", 1)).toEqual({ before: "h", char: "e", after: "llo" })
    })

    it("sits on blank space at the end and before a line break", () => {
        expect(splitAt("hi", 2)).toEqual({ before: "hi", char: "", after: "" })
        expect(splitAt("a\nb", 1)).toEqual({ before: "a", char: "", after: "\nb" })
    })

    it("keeps a whole code point under the caret", () => {
        expect(splitAt("a😀b", 1)).toEqual({ before: "a", char: "😀", after: "b" })
    })
})

describe("caretBox", () => {
    it("centres an input's one line in its content box, less the scroll", () => {
        expect(caretBox(field({ scrollLeft: 30 }), { left: 54, top: 4 })).toEqual({
            x: 100 + 1 + 54 - 30,
            y: 50 + 1 + 4 + (24 - 20) / 2,
            height: 20
        })
    })

    it("stacks a textarea's lines from the top, less the scroll", () => {
        const box = caretBox(field({ multiline: true, scrollTop: 20 }), { left: 4, top: 44 })
        expect(box).toEqual({ x: 105, y: 50 + 1 + 44 - 20, height: 20 })
    })
})

describe("isInside", () => {
    const clip = { left: 0, top: 0, right: 100, bottom: 100 }

    it("draws a caret inside every clip", () => {
        expect(isInside({ x: 10, y: 10, height: 20 }, [clip])).toBe(true)
        expect(isInside({ x: 10, y: 10, height: 20 }, [])).toBe(true)
    })

    it("hides a caret scrolled out of any clip", () => {
        expect(isInside({ x: 10, y: 95, height: 20 }, [clip])).toBe(false)
        expect(isInside({ x: 120, y: 10, height: 20 }, [clip, { ...clip, right: 200 }])).toBe(false)
    })
})

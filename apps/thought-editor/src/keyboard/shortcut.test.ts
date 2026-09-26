import { describe, expect, it } from "vitest"
import { matchShortcut, shortcutKeys } from "./shortcut.ts"

const press = (init: Partial<KeyboardEvent>) =>
    ({
        key: "",
        code: "",
        metaKey: false,
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        ...init
    }) as KeyboardEvent

describe("matchShortcut", () => {
    it("maps mod to Command on macOS and Control elsewhere", () => {
        const cmdK = press({ key: "k", code: "KeyK", metaKey: true })
        const ctrlK = press({ key: "k", code: "KeyK", ctrlKey: true })

        expect(matchShortcut({ key: "k", mod: true }, cmdK, true)).toBe(true)
        expect(matchShortcut({ key: "k", mod: true }, ctrlK, true)).toBe(false)
        expect(matchShortcut({ key: "k", mod: true }, ctrlK, false)).toBe(true)
    })

    it("requires modifiers to match exactly", () => {
        const shiftCmdI = press({ key: "I", code: "KeyI", metaKey: true, shiftKey: true })

        expect(matchShortcut({ key: "i", mod: true }, shiftCmdI, true)).toBe(false)
        expect(matchShortcut({ key: "i", mod: true, shift: true }, shiftCmdI, true)).toBe(true)
    })

    it("matches letters by physical key so Option does not change them", () => {
        const optionA = press({ key: "å", code: "KeyA", altKey: true })
        expect(matchShortcut({ key: "a", alt: true }, optionA, true)).toBe(true)
    })

    it("matches named keys", () => {
        expect(
            matchShortcut({ key: "enter", mod: true }, press({ key: "Enter", metaKey: true }), true)
        ).toBe(true)
        expect(matchShortcut({ key: "tab" }, press({ key: "Tab", shiftKey: true }), true)).toBe(
            false
        )
    })
})

describe("shortcutKeys", () => {
    it("orders macOS modifiers as Control, Option, Shift, Command", () => {
        expect(shortcutKeys({ key: "x", ctrl: true, shift: true }, true)).toEqual(["⌃", "⇧", "X"])
        expect(shortcutKeys({ key: "enter", mod: true }, true)).toEqual(["⌘", "↵"])
    })
})

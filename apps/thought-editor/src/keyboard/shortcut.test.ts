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

describe("matchShortcut in the Apple shell", () => {
    const createThought = { key: "n", ctrl: true }
    const deleteThought = { key: "x", ctrl: true }
    const addAttribute = { key: "a", ctrl: true }
    const field = (value: string, selectionStart: number, selectionEnd = selectionStart) =>
        ({ value, selectionStart, selectionEnd }) as unknown as EventTarget

    it("lets Command stand in for Control there, and only there", () => {
        const cmdN = press({ key: "n", code: "KeyN", metaKey: true })
        const ctrlN = press({ key: "n", code: "KeyN", ctrlKey: true })

        expect(matchShortcut(createThought, cmdN, true, true)).toBe(true)
        expect(matchShortcut(createThought, ctrlN, true, true)).toBe(true)
        expect(matchShortcut(createThought, cmdN, true, false)).toBe(false)
        expect(matchShortcut(createThought, cmdN, false, true)).toBe(false)
    })

    it("leaves Cmd-X to Cut while there is selected text", () => {
        const cmdX = (target: EventTarget) =>
            press({ key: "x", code: "KeyX", metaKey: true, target })

        expect(matchShortcut(deleteThought, cmdX(field("draft", 0, 5)), true, true)).toBe(false)
        expect(matchShortcut(deleteThought, cmdX(field("draft", 5)), true, true)).toBe(true)
    })

    it("leaves Cmd-A to Select All while the field has text", () => {
        const cmdA = (target: EventTarget) =>
            press({ key: "a", code: "KeyA", metaKey: true, target })

        expect(matchShortcut(addAttribute, cmdA(field("text", 4)), true, true)).toBe(false)
        expect(matchShortcut(addAttribute, cmdA(field("", 0)), true, true)).toBe(true)
    })
})

describe("shortcutKeys", () => {
    it("shows a Control shortcut as Command in the shell", () => {
        expect(shortcutKeys({ key: "n", ctrl: true }, true, true)).toEqual(["⌘", "N"])
        expect(shortcutKeys({ key: "n", ctrl: true }, true, false)).toEqual(["⌃", "N"])
    })

    it("orders macOS modifiers as Control, Option, Shift, Command", () => {
        expect(shortcutKeys({ key: "x", ctrl: true, shift: true }, true)).toEqual(["⌃", "⇧", "X"])
        expect(shortcutKeys({ key: "enter", mod: true }, true)).toEqual(["⌘", "↵"])
    })
})

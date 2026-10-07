import { describe, expect, it } from "vitest"
import { defaults } from "../config/schema.ts"
import { detectHost, type Key, label, matches, toKey } from "./keys.ts"

const key = (name: string, mods: Partial<Omit<Key, "name">> = {}): Key => ({
    name,
    meta: false,
    ctrl: false,
    shift: false,
    alt: false,
    ...mods
})
const chromeMac = { apple: true, cmdForAll: false }
const safari = { apple: true, cmdForAll: true }
const linux = { apple: false, cmdForAll: false }

describe("hosts", () => {
    it("tells Safari and the Apple shell from Chrome", () => {
        const mac = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15"
        expect(
            detectHost("MacIntel", `${mac} (KHTML, like Gecko) Version/26.0 Safari/605.1.15`)
        ).toEqual(safari)
        expect(detectHost("MacIntel", `${mac} AlteredShell/1.0`)).toEqual(safari)
        expect(detectHost("MacIntel", `${mac} Chrome/141.0 Safari/537.36`)).toEqual(chromeMac)
        expect(detectHost("Linux x86_64", "Mozilla/5.0 (X11; Linux x86_64) Chrome/141.0")).toEqual(
            linux
        )
    })
})

describe("the modifier", () => {
    const edit = { key: "e", mod: true }
    const create = { key: "n", mod: true }

    it("is Command on Apple platforms and Control elsewhere", () => {
        expect(matches(key("e", { meta: true }), edit, chromeMac)).toBe(true)
        expect(matches(key("e", { ctrl: true }), edit, chromeMac)).toBe(false)
        expect(matches(key("e", { ctrl: true }), edit, linux)).toBe(true)
        expect(matches(key("e", { meta: true }), edit, linux)).toBe(false)
    })

    it("also takes Control for N, T, and W in Chrome on a Mac, where Command never arrives", () => {
        expect(matches(key("n", { ctrl: true }), create, chromeMac)).toBe(true)
        expect(matches(key("n", { ctrl: true }), create, safari)).toBe(false)
        expect(matches(key("n", { meta: true }), create, safari)).toBe(true)
        expect(label(create, defaults.glyphs, chromeMac)).toBe("^N")
        expect(label(create, defaults.glyphs, safari)).toBe("⌘N")
        expect(label(edit, defaults.glyphs, chromeMac)).toBe("⌘E")
    })

    it("needs the exact shift and no stray modifiers", () => {
        const theme = { key: "d", mod: true, shift: true }
        expect(matches(key("d", { meta: true, shift: true }), theme, safari)).toBe(true)
        expect(matches(key("d", { meta: true }), theme, safari)).toBe(false)
        expect(matches(key("return", { meta: true }), { key: "return" }, safari)).toBe(false)
        expect(label(theme, defaults.glyphs, linux)).toBe("^⇧D")
    })
})

describe("key names", () => {
    it("reads letters by character, or by physical key when Option changes them", () => {
        const event = { metaKey: false, ctrlKey: false, shiftKey: false, altKey: false }
        expect(toKey({ ...event, key: "Enter", code: "Enter" }).name).toBe("return")
        expect(toKey({ ...event, key: "D", code: "KeyD", shiftKey: true }).name).toBe("d")
        expect(toKey({ ...event, key: "∂", code: "KeyD", altKey: true }).name).toBe("d")
        expect(toKey({ ...event, key: "/", code: "Slash" }).name).toBe("/")
    })
})

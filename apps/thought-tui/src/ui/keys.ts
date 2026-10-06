import type { KeyEvent } from "@opentui/core"
import type { Config } from "../config/schema.ts"

/**
 * A key binding as data, so one value both matches events and labels the action menu, the footer,
 * and the keyboard map. `key` is OpenTUI's key name ("e", "return", "tab", "up", "/").
 */
export type Shortcut = { key: string; ctrl?: boolean; shift?: boolean }

export const matches = (event: KeyEvent, shortcut: Shortcut) =>
    event.name === shortcut.key &&
    event.ctrl === (shortcut.ctrl ?? false) &&
    event.shift === (shortcut.shift ?? false) &&
    !event.meta

/** "^⇧D", "↵", "⇥": glyphs come from the config, so they can be swapped per font. */
export const label = (shortcut: Shortcut, glyphs: Config["glyphs"]) => {
    const named: Record<string, string> = {
        return: glyphs.enter,
        tab: glyphs.tab,
        escape: glyphs.escape,
        up: glyphs.up,
        down: glyphs.down,
        backspace: glyphs.backspace
    }
    const key =
        named[shortcut.key] ??
        (shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key)
    return `${shortcut.ctrl ? glyphs.ctrl : ""}${shortcut.shift ? glyphs.shift : ""}${key}`
}

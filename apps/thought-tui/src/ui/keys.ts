import type { KeyEvent } from "@opentui/core"

/**
 * A key binding as data, so one value both matches events and labels the action menu, the footer,
 * and the help overlay. `key` is OpenTUI's key name ("j", "return", "space", "up").
 */
export type Shortcut = { key: string; ctrl?: boolean; shift?: boolean }

const glyphs: Record<string, string> = {
    return: "⏎",
    space: "␣",
    escape: "esc",
    tab: "⇥",
    up: "↑",
    down: "↓",
    left: "←",
    right: "→",
    backspace: "⌫"
}

/** Shifted letters arrive as `shift` plus the lowercase name; a binding to "J" means shift-j. */
export const matches = (event: KeyEvent, shortcut: Shortcut) => {
    const upper = shortcut.key.length === 1 && shortcut.key !== shortcut.key.toLowerCase()
    const name = upper ? shortcut.key.toLowerCase() : shortcut.key
    return (
        event.name === name &&
        event.ctrl === (shortcut.ctrl ?? false) &&
        event.shift === (upper || (shortcut.shift ?? false)) &&
        !event.meta
    )
}

export const label = (shortcut: Shortcut) =>
    `${shortcut.ctrl ? "^" : ""}${shortcut.shift ? "⇧" : ""}${glyphs[shortcut.key] ?? shortcut.key}`

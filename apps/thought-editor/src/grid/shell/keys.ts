import type { Config } from "../config/schema.ts"

/**
 * A key binding as data, so one value both matches events and labels the action menu, the footer,
 * and the keyboard map. `mod` is the app modifier (D176): Command on Apple platforms, Control
 * elsewhere. `ctrl` is the Control key itself, on every platform.
 */
export type Shortcut = {
    key: string
    mod?: boolean
    ctrl?: boolean
    shift?: boolean
    alt?: boolean
}

/** A key event reduced to what bindings read, so matching is pure and testable. */
export type Key = {
    /** "e", "return", "tab", "up", "escape", "/", ",", "f1". */
    name: string
    meta: boolean
    ctrl: boolean
    shift: boolean
    alt: boolean
}

export type Host = {
    apple: boolean
    /** Command reaches the page for every key: Safari, and the Apple shell (D175). */
    cmdForAll: boolean
}

/** Chrome keeps Command-N, T, and W for itself; there they also answer to Control (D176). */
const RESERVED = new Set(["n", "t", "w"])

export const detectHost = (
    platform = navigator.platform,
    userAgent = navigator.userAgent
): Host => {
    const apple = /Mac|iPhone|iPad|iPod/.test(platform) || /Mac OS X|iPhone|iPad/.test(userAgent)
    const shell = /AlteredShell/.test(userAgent)
    const safari =
        /Safari\//.test(userAgent) && !/Chrome|Chromium|CriOS|Edg|Firefox|FxiOS/.test(userAgent)
    return { apple, cmdForAll: apple && (shell || safari) }
}

const named: Record<string, string> = {
    Enter: "return",
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    Tab: "tab",
    Escape: "escape",
    PageUp: "pageup",
    PageDown: "pagedown",
    Home: "home",
    End: "end",
    Backspace: "backspace",
    Delete: "delete",
    F1: "f1",
    " ": "space"
}

/** Letters by their character, or by their physical key when a layout or Option changes it. */
export const toKey = (
    event: Pick<KeyboardEvent, "key" | "code" | "metaKey" | "ctrlKey" | "shiftKey" | "altKey">
): Key => {
    const letter = /^Key[A-Z]$/.test(event.code) ? event.code.slice(3).toLowerCase() : null
    const lower = event.key.length === 1 ? event.key.toLowerCase() : event.key
    const name =
        named[event.key] ??
        (/^[a-z]$/.test(lower) ? lower : (letter ?? (event.code === "Slash" ? "/" : lower)))
    return {
        name,
        meta: event.metaKey,
        ctrl: event.ctrlKey,
        shift: event.shiftKey,
        alt: event.altKey
    }
}

export const matches = (key: Key, shortcut: Shortcut, host: Host) => {
    if (key.name !== shortcut.key) return false
    if (key.shift !== (shortcut.shift ?? false) || key.alt !== (shortcut.alt ?? false)) return false
    if (shortcut.ctrl) return key.ctrl && !key.meta
    if (!shortcut.mod) return !key.ctrl && !key.meta
    if (!host.apple) return key.ctrl && !key.meta
    if (key.meta && !key.ctrl) return true
    return RESERVED.has(shortcut.key) && !host.cmdForAll && key.ctrl && !key.meta
}

/** The modifier glyph that works in this host: ⌘ on Apple, ^ elsewhere and for Chrome's three. */
const modifier = (shortcut: Shortcut, glyphs: Config["glyphs"], host: Host) => {
    if (shortcut.ctrl) return glyphs.ctrl
    if (!shortcut.mod) return ""
    if (!host.apple) return glyphs.ctrl
    return RESERVED.has(shortcut.key) && !host.cmdForAll ? glyphs.ctrl : glyphs.cmd
}

/** "⌘⇧D", "↵", "⇥": glyphs come from the config, so they can be swapped. */
export const label = (shortcut: Shortcut, glyphs: Config["glyphs"], host: Host) => {
    const names: Record<string, string> = {
        return: glyphs.enter,
        tab: glyphs.tab,
        escape: glyphs.escape,
        up: glyphs.up,
        down: glyphs.down,
        backspace: glyphs.backspace
    }
    const key =
        names[shortcut.key] ??
        (shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key)
    return `${modifier(shortcut, glyphs, host)}${shortcut.alt ? "⌥" : ""}${shortcut.shift ? glyphs.shift : ""}${key}`
}

/** The host this page runs in, read once. */
export const host =
    typeof navigator === "undefined" ? { apple: false, cmdForAll: false } : detectHost()

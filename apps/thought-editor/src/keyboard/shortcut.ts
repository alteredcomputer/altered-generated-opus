/**
 * @remarks
 * `mod` is Command on macOS and Control elsewhere. Chrome never delivers Cmd-N, Cmd-T, or Cmd-W
 * to a page, so creation shortcuts use Control, as Raycast does for its own reserved keys.
 */
export type Shortcut = {
    key: string
    mod?: boolean
    ctrl?: boolean
    shift?: boolean
    alt?: boolean
}

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)

/**
 * Letters and digits match on the physical key, so Option and Shift (which change `event.key`,
 * for example Option-A typing "å") do not break a binding.
 */
const keyOf = (event: KeyboardEvent) => {
    if (/^Key[A-Z]$/.test(event.code)) return event.code.slice(3).toLowerCase()
    if (/^Digit[0-9]$/.test(event.code)) return event.code.slice(5)
    return event.key.toLowerCase()
}

export const matchShortcut = (shortcut: Shortcut, event: KeyboardEvent, mac = isMac) => {
    const wantMeta = mac ? Boolean(shortcut.mod) : false
    const wantCtrl = Boolean(shortcut.ctrl) || (!mac && Boolean(shortcut.mod))

    return (
        keyOf(event) === shortcut.key &&
        event.metaKey === wantMeta &&
        event.ctrlKey === wantCtrl &&
        event.shiftKey === Boolean(shortcut.shift) &&
        event.altKey === Boolean(shortcut.alt)
    )
}

const keyLabels: Record<string, string> = {
    enter: "↵",
    backspace: "⌫",
    delete: "⌦",
    escape: "esc",
    tab: "⇥",
    arrowup: "↑",
    arrowdown: "↓",
    arrowleft: "←",
    arrowright: "→"
}

/** Splits a shortcut into keycaps, in macOS modifier order. */
export const shortcutKeys = (shortcut: Shortcut, mac = isMac) => {
    const keys: string[] = []
    if (shortcut.ctrl) keys.push(mac ? "⌃" : "Ctrl")
    if (shortcut.alt) keys.push(mac ? "⌥" : "Alt")
    if (shortcut.shift) keys.push("⇧")
    if (shortcut.mod) keys.push(mac ? "⌘" : "Ctrl")
    keys.push(keyLabels[shortcut.key] ?? shortcut.key.toUpperCase())
    return keys
}

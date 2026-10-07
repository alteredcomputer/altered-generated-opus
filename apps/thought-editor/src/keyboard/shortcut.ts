/**
 * @remarks
 * `mod` is Command on macOS and Control elsewhere. Chrome never delivers Cmd-N, Cmd-T, or Cmd-W
 * to a page, so creation shortcuts use Control, as Raycast does for its own reserved keys. The
 * Apple shell (D175) does deliver them, so there a Control shortcut also answers to Command.
 */
export type Shortcut = {
    key: string
    mod?: boolean
    ctrl?: boolean
    shift?: boolean
    alt?: boolean
}

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)

/** The Apple shell names itself in the user agent (`AlteredShell/<version>`). */
const inShell = typeof navigator !== "undefined" && /AlteredShell\//.test(navigator.userAgent)

/**
 * Letters and digits match on the physical key, so Option and Shift (which change `event.key`,
 * for example Option-A typing "å") do not break a binding.
 */
const keyOf = (event: KeyboardEvent) => {
    if (/^Key[A-Z]$/.test(event.code)) return event.code.slice(3).toLowerCase()
    if (/^Digit[0-9]$/.test(event.code)) return event.code.slice(5)
    return event.key.toLowerCase()
}

type TextField = { value: string; selectionStart: number; selectionEnd: number }

const textField = (target: EventTarget | null | undefined) => {
    const field = target as Partial<TextField> | null | undefined
    return typeof field?.value === "string" && typeof field.selectionStart === "number"
        ? (field as TextField)
        : null
}

/**
 * Cmd-X and Cmd-A are Cut and Select All in a text field. They stand in for Ctrl-X (delete) and
 * Ctrl-A (add) only when that Edit command would do nothing: no selected text, no text at all.
 */
const editCommandWouldAct = (key: string, target: EventTarget | null | undefined) => {
    const field = textField(target)
    if (!field) return false
    if (key === "x") return field.selectionStart !== field.selectionEnd
    if (key === "a") return field.value.length > 0
    return false
}

export const matchShortcut = (
    shortcut: Shortcut,
    event: KeyboardEvent,
    mac = isMac,
    shell = inShell
) => {
    if (keyOf(event) !== shortcut.key) return false
    const exact = (meta: boolean, ctrl: boolean) =>
        event.metaKey === meta &&
        event.ctrlKey === ctrl &&
        event.shiftKey === Boolean(shortcut.shift) &&
        event.altKey === Boolean(shortcut.alt)

    const wantMeta = mac ? Boolean(shortcut.mod) : false
    const wantCtrl = Boolean(shortcut.ctrl) || (!mac && Boolean(shortcut.mod))
    if (exact(wantMeta, wantCtrl)) return true

    const commandStandsIn = shell && mac && Boolean(shortcut.ctrl) && !shortcut.mod
    return commandStandsIn && exact(true, false) && !editCommandWouldAct(shortcut.key, event.target)
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

/**
 * Splits a shortcut into keycaps, in macOS modifier order. In the shell a Control shortcut shows
 * as Command, the key it is pressed with there (Control still works).
 */
export const shortcutKeys = (shortcut: Shortcut, mac = isMac, shell = inShell) => {
    const keys: string[] = []
    const ctrlAsCommand = Boolean(shortcut.ctrl) && mac && shell && !shortcut.mod
    if (shortcut.ctrl && !ctrlAsCommand) keys.push(mac ? "⌃" : "Ctrl")
    if (shortcut.alt) keys.push(mac ? "⌥" : "Alt")
    if (shortcut.shift) keys.push("⇧")
    if (shortcut.mod || ctrlAsCommand) keys.push(mac ? "⌘" : "Ctrl")
    keys.push(keyLabels[shortcut.key] ?? shortcut.key.toUpperCase())
    return keys
}

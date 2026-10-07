import { useEffect, useRef } from "react"
import { focusOwner } from "../ui/index.ts"
import { type Key, toKey } from "./keys.ts"

/** Returns true when it handled the key; the router then stops the browser and fields seeing it. */
export type KeyHandler = (key: Key) => boolean

/**
 * A stack of key layers: only the newest mounted layer receives keys. A pushed view, the action
 * menu, and a confirmation each mount after what they cover, so they own the keyboard until they
 * unmount, and the covered view keeps its state without any focus bookkeeping (as in the TUI).
 */
const layers: { handle: { current: KeyHandler } }[] = []

export function useKeyLayer(handler: KeyHandler) {
    const handle = useRef(handler)
    handle.current = handler
    useEffect(() => {
        const layer = { handle }
        layers.push(layer)
        return () => {
            layers.splice(layers.indexOf(layer), 1)
        }
    }, [])
}

const isField = (element: Element | null): element is HTMLInputElement | HTMLTextAreaElement =>
    element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement

const hasSelection = (element: Element | null) =>
    isField(element) && element.selectionStart !== element.selectionEnd

/**
 * Mounted once. Keys go to the top layer before any field sees them. Three exceptions: keys
 * during an IME composition belong to the composition; Command or Control with X or C while text
 * is selected in a field is a native cut or copy; and a printable key while focus has wandered
 * (after selecting text with the mouse) first returns focus to the field that owns the caret.
 */
export function KeyRouter() {
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.isComposing || event.keyCode === 229) return
            const key = toKey(event)
            const active = document.activeElement
            if (
                (key.meta || key.ctrl) &&
                (key.name === "x" || key.name === "c") &&
                hasSelection(active)
            )
                return
            if (
                !isField(active) &&
                focusOwner.current &&
                event.key.length === 1 &&
                !key.meta &&
                !key.ctrl
            )
                focusOwner.current.focus({ preventScroll: true })
            if (layers.at(-1)?.handle.current(key)) {
                event.preventDefault()
                event.stopPropagation()
            }
        }
        addEventListener("keydown", onKey, { capture: true })
        return () => removeEventListener("keydown", onKey, { capture: true })
    }, [])
    return null
}

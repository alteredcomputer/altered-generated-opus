import type { KeyEvent } from "@opentui/core"
import { useKeyboard } from "@opentui/react"
import { useEffect, useRef } from "react"

/** Returns true when it handled the key; the router then stops a focused input from seeing it. */
export type KeyHandler = (event: KeyEvent) => boolean

/**
 * A stack of key layers: only the newest mounted layer receives keys. A pushed view, the action
 * menu, and a confirmation each mount after what they cover, so they own the keyboard until they
 * unmount, and the covered view keeps its state without any focus bookkeeping.
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

/** Mounted once at the root. OpenTUI runs global handlers before the focused input's own. */
export function KeyRouter() {
    useKeyboard(event => {
        if (layers.at(-1)?.handle.current(event)) event.preventDefault()
    })
    return null
}

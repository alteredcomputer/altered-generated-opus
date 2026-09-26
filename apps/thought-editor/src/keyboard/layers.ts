import { useEffect, useRef } from "react"

type Handler = (event: KeyboardEvent) => void

const layers: { current: Handler }[] = []

const dispatch = (event: KeyboardEvent) => {
    if (event.isComposing) return
    layers.at(-1)?.current(event)
}

if (typeof window !== "undefined") window.addEventListener("keydown", dispatch)

/**
 * Pushes a key layer while `enabled`. Only the most recently pushed layer receives keys, so an
 * open action palette or confirmation shadows the view underneath without either knowing about
 * the other.
 */
export const useKeyLayer = (handler: Handler, enabled: boolean) => {
    const ref = useRef(handler)
    ref.current = handler

    useEffect(() => {
        if (!enabled) return
        const entry = { current: (event: KeyboardEvent) => ref.current(event) }
        layers.push(entry)
        return () => {
            layers.splice(layers.indexOf(entry), 1)
        }
    }, [enabled])
}

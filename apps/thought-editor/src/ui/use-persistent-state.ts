import { useEffect, useState } from "react"
import { log } from "../observability/log.ts"

const read = <T>(key: string, fallback: T): T => {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    try {
        return JSON.parse(raw) as T
    } catch (cause) {
        log("error", "unreadable preference, using default", { key, cause })
        return fallback
    }
}

/** A view preference (inspector open, pane width) that survives restarts. */
export const usePersistentState = <T>(key: string, fallback: T) => {
    const [value, setValue] = useState(() => read(key, fallback))

    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(value))
    }, [key, value])

    return [value, setValue] as const
}

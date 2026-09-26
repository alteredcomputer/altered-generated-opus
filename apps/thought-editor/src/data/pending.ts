import { useEffect, useState, useSyncExternalStore } from "react"

let pending = 0
const listeners = new Set<() => void>()

const emit = () => {
    for (const listener of listeners) listener()
}

/**
 * @remarks
 * Counts in-flight writes for the loading line under the search bar. Local writes finish in
 * milliseconds, so the hook holds the line for a moment after the count drops; otherwise a save
 * would be invisible.
 */
export const trackPending = async <T>(work: Promise<T>): Promise<T> => {
    pending++
    emit()
    try {
        return await work
    } finally {
        pending--
        emit()
    }
}

const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
}

const HOLD_MS = 450

export const useIsSyncing = () => {
    const count = useSyncExternalStore(subscribe, () => pending)
    const [held, setHeld] = useState(false)

    useEffect(() => {
        if (count > 0) return setHeld(true)
        const timer = setTimeout(() => setHeld(false), HOLD_MS)
        return () => clearTimeout(timer)
    }, [count])

    return count > 0 || held
}

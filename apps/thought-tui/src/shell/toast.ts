import { useSyncExternalStore } from "react"

/** One footer message at a time, replaced by the next and cleared after a moment. */
let current: string | null = null
let timer: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<() => void>()
const notify = () => {
    for (const listener of listeners) listener()
}

export const showToast = (message: string) => {
    current = message
    clearTimeout(timer)
    timer = setTimeout(() => {
        current = null
        notify()
    }, 2500)
    notify()
}

export const useToast = () =>
    useSyncExternalStore(
        listener => {
            listeners.add(listener)
            return () => listeners.delete(listener)
        },
        () => current
    )

import { useSyncExternalStore } from "react"

export type Toast = { id: number; title: string; style: "success" | "failure" }

let current: Toast | null = null
let nextId = 0
let timer: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<() => void>()

const set = (toast: Toast | null) => {
    current = toast
    for (const listener of listeners) listener()
}

const VISIBLE_MS = 3000

/** Shows a short message in the footer, where Raycast puts its toasts. */
export const showToast = (title: string, style: Toast["style"] = "success") => {
    clearTimeout(timer)
    set({ id: nextId++, title, style })
    timer = setTimeout(() => set(null), VISIBLE_MS)
}

export const useToast = () =>
    useSyncExternalStore(
        listener => {
            listeners.add(listener)
            return () => listeners.delete(listener)
        },
        () => current
    )

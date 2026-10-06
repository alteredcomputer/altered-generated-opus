import { useSyncExternalStore } from "react"
import { log } from "../observability/log.ts"

/**
 * Footer toasts and the background-activity indicator, animated with his braille frames at 125 ms
 * (D174). Loading loops; success holds a check for 24 frames (3 s); failure blinks a cross, then
 * holds it. Blank frames (U+2800, braille-width) bracket each mark so it appears and leaves cleanly.
 */
const B = "⠀⠀"
export const LOADING = ["⣏⣩", "⣏⣙", "⣏⡹", "⣏⢹", "⡏⣹", "⢏⣹", "⣋⣹", "⣍⣹", "⣎⣹", "⣇⣹", "⣏⣸", "⣏⣱"]
const repeat = (frame: string, times: number) => Array<string>(times).fill(frame)
export const SUCCESS = [B, B, ...repeat("⢦⠞", 24), B, B]
export const FAILURE = [B, B, "⡱⢎", "⡱⢎", B, B, ...repeat("⡱⢎", 20), B, B]
export const IDLE = "⣿⣿"
const FRAME_MS = 125

export type ToastKind = "loading" | "success" | "failure"
export type ToastInput = { kind: ToastKind; title: string; subtitle?: string }
type Toast = ToastInput & { frame: number }

let toast: Toast | null = null
let busy = 0
let tick = 0
let timer: ReturnType<typeof setInterval> | undefined
const listeners = new Set<() => void>()
let snapshot: { toast: Toast | null; busy: number; tick: number } = { toast, busy, tick }

const notify = () => {
    snapshot = { toast, busy, tick }
    for (const listener of listeners) listener()
}

const advance = () => {
    tick++
    if (toast && toast.kind !== "loading") {
        const frames = toast.kind === "success" ? SUCCESS : FAILURE
        toast = toast.frame + 1 < frames.length ? { ...toast, frame: toast.frame + 1 } : null
    } else if (toast) toast = { ...toast, frame: (toast.frame + 1) % LOADING.length }
    if (!toast && busy === 0) {
        clearInterval(timer)
        timer = undefined
    }
    notify()
}

const run = () => {
    timer ??= setInterval(advance, FRAME_MS)
}

export const showToast = (input: ToastInput) => {
    toast = { ...input, frame: 0 }
    if (input.kind === "failure")
        log("error", "toast", { title: input.title, subtitle: input.subtitle })
    run()
    notify()
}

export const dismissToast = () => {
    toast = null
    notify()
}

/** Shows a loading toast for the work, then its success or failure. */
export const toastTask = async <T>(
    work: () => Promise<T>,
    messages: { loading: string; success: string; failure: (cause: unknown) => string }
): Promise<T | undefined> => {
    showToast({ kind: "loading", title: messages.loading })
    try {
        const result = await work()
        showToast({ kind: "success", title: messages.success })
        return result
    } catch (cause) {
        showToast({ kind: "failure", title: messages.failure(cause) })
        return undefined
    }
}

/** Background work: spins the footer indicator, never a toast. */
export const trackActivity = async <T>(work: Promise<T>): Promise<T> => {
    busy++
    run()
    notify()
    try {
        return await work
    } finally {
        busy--
        notify()
    }
}

export const frameOf = (current: Toast) =>
    current.kind === "loading"
        ? (LOADING[current.frame] ?? B)
        : ((current.kind === "success" ? SUCCESS : FAILURE)[current.frame] ?? B)

export const useFeedback = () =>
    useSyncExternalStore(
        listener => {
            listeners.add(listener)
            return () => listeners.delete(listener)
        },
        () => snapshot
    )

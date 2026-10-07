import { log } from "../observability/log.ts"

/**
 * A screen the stack can rebuild after a relaunch, as plain data. Views decide what a route
 * holds; the shell only stores it. Views that hold callbacks (the pickers) have none and end
 * the saved stack.
 */
export type Route = { readonly view: string } & Readonly<Record<string, unknown>>

/** One saved stack entry: its route and the view state it chose to remember. */
export type SavedEntry = { route: Route; state: Record<string, unknown> }

/**
 * @remarks
 * iOS can kill the shell's web view in the background, and a relaunch would otherwise land on
 * the default screen (D175). The stack is saved on every change and read once at boot. The
 * version is bumped whenever a saved shape changes, so an old save is dropped, not misread.
 */
const KEY = "view-stack"
const VERSION = 1

export const isString = (value: unknown): value is string => typeof value === "string"
export const isNumber = (value: unknown): value is number =>
    typeof value === "number" && Number.isFinite(value)
export const isStringOrNull = (value: unknown): value is string | null =>
    value === null || typeof value === "string"
export const isStringArray = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every(isString)

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value)

const isSavedEntry = (value: unknown): value is SavedEntry =>
    isRecord(value) && isRecord(value.route) && isString(value.route.view) && isRecord(value.state)

/** The saved stack, or an empty one when nothing valid is stored (logged, never thrown). */
export const loadStack = (): SavedEntry[] => {
    let raw: string | null
    try {
        raw = localStorage.getItem(KEY)
    } catch (cause) {
        log("error", "view stack unreadable, opening the default screen", { cause })
        return []
    }
    if (raw === null) return []

    try {
        const saved: unknown = JSON.parse(raw)
        if (
            isRecord(saved) &&
            saved.version === VERSION &&
            Array.isArray(saved.stack) &&
            saved.stack.every(isSavedEntry)
        )
            return saved.stack
        log("error", "saved view stack has an unknown shape, opening the default screen")
    } catch (cause) {
        log("error", "saved view stack is not JSON, opening the default screen", { cause })
    }
    return []
}

export const saveStack = (stack: SavedEntry[]) => {
    try {
        localStorage.setItem(KEY, JSON.stringify({ version: VERSION, stack }))
    } catch (cause) {
        log("error", "view stack not saved", { cause, depth: stack.length })
    }
}

import type { Shortcut } from "./keys.ts"

/** One thing a view can do. Declared once, it appears in the action menu, footer, and key map. */
export type Action = {
    id: string
    title: string
    section: string
    shortcut?: Shortcut
    /** Drawn in the attention colour: irreversible. */
    danger?: boolean
    run: () => void
}

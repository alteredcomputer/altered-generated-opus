import type { Shortcut } from "../ui/keys.ts"

/** One thing a view can do. Declared once, it appears in the action menu, help, and key map. */
export type Action = {
    id: string
    title: string
    section: string
    shortcut?: Shortcut
    /** Drawn in the attention colour: irreversible. */
    danger?: boolean
    run: () => void
}

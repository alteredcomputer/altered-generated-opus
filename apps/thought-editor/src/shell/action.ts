import type { Shortcut } from "../keyboard/shortcut.ts"

/**
 * One thing the user can do in a view. The first action is the primary one shown in the footer;
 * all of them appear in the Cmd-K palette, grouped by section.
 */
export type Action = {
    id: string
    title: string
    section: string
    shortcut?: Shortcut
    destructive?: boolean
    run: () => void
}

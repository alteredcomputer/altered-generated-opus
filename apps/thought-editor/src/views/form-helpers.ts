import { useEffect, useRef } from "react"
import { confirm } from "../shell/confirm.tsx"

/** Escape handler for forms: leaves at once when clean, asks first when there are edits. */
export const escapeForm = (dirty: boolean, leave: () => void) => {
    if (!dirty) return false
    confirm({
        title: "Discard changes",
        message: "Leave this form and lose what you changed?",
        confirmLabel: "Discard"
    }).then(discard => discard && leave())
    return true
}

/**
 * Focuses the element carrying `data-focus-key` once it renders, so a newly added attribute or
 * schema row is ready to type into.
 */
export const useFocusOnRender = () => {
    const pending = useRef<string | null>(null)

    useEffect(() => {
        if (!pending.current) return
        document.querySelector<HTMLElement>(`[data-focus-key="${pending.current}"]`)?.focus()
        pending.current = null
    })

    return (key: string) => {
        pending.current = key
    }
}

import { type ReactNode, useEffect, useRef, useState } from "react"
import { useIsSyncing } from "../data/pending.ts"
import { useKeyLayer } from "../keyboard/layers.ts"
import { matchShortcut, shortcutKeys } from "../keyboard/shortcut.ts"
import { Keys } from "../ui/kbd.tsx"
import type { Action } from "./action.ts"
import { useIsActiveView, useNavigation } from "./navigation.tsx"
import { Picker } from "./picker.tsx"
import { useToast } from "./toast.ts"
import "./shell.css"

type FrameProps = {
    title: string
    /** The list size shown after the title in the footer; `selected` reads as "3 of 12". */
    count?: { total: number; selected?: number }
    status?: string
    search?: { value: string; onChange: (value: string) => void; placeholder: string }
    accessory?: ReactNode
    actions: Action[]
    /** View-specific keys such as list movement. Return true when the key was used. */
    onKey?: (event: KeyboardEvent) => boolean
    /** Return true when Escape was used (clearing a search, a selection, or a dirty form). */
    onEscape?: () => boolean
    children: ReactNode
}

const PALETTE = { key: "k", mod: true }

/**
 * The window every view renders into: search bar with the sync line, body, and the footer with
 * the primary action and Cmd-K. Only the active view's frame receives keys.
 */
export function Frame({
    title,
    count,
    status,
    search,
    accessory,
    actions,
    onKey,
    onEscape,
    children
}: FrameProps) {
    const active = useIsActiveView()
    const { depth, pop } = useNavigation()
    const syncing = useIsSyncing()
    const toast = useToast()
    const [paletteOpen, setPaletteOpen] = useState(false)
    const rootRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (active) rootRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus()
    }, [active])

    const runShortcut = (event: KeyboardEvent) => {
        const action = actions.find(a => a.shortcut && matchShortcut(a.shortcut, event))
        if (!action) return
        event.preventDefault()
        action.run()
    }

    const back = () => {
        if (onEscape?.()) return
        if (depth > 1) pop()
    }

    useKeyLayer(event => {
        if (matchShortcut(PALETTE, event)) {
            event.preventDefault()
            setPaletteOpen(true)
        } else if (event.key === "Escape") {
            event.preventDefault()
            back()
        } else if (onKey?.(event)) event.preventDefault()
        else runShortcut(event)
    }, active)

    const primary = actions[0]

    return (
        <div className="frame" ref={rootRef}>
            <header className="frame-header">
                {depth > 1 && (
                    <button type="button" className="back" aria-label="Back" onClick={back}>
                        ←
                    </button>
                )}
                {search ? (
                    <input
                        data-autofocus
                        className="search"
                        placeholder={search.placeholder}
                        value={search.value}
                        onChange={event => search.onChange(event.target.value)}
                        spellCheck={false}
                    />
                ) : (
                    <p className="frame-title">{title}</p>
                )}
                {accessory}
                <div className="sync-line" data-syncing={syncing} aria-hidden />
            </header>

            <main className="frame-body">{children}</main>

            <footer className="frame-footer">
                <p className="footer-status" data-style={toast?.style}>
                    {toast ? (
                        toast.title
                    ) : (
                        <>
                            <span>{title}</span>
                            {count && (
                                <span className="faint">
                                    {count.selected ? `${count.selected} of ` : ""}
                                    {count.total} Total
                                </span>
                            )}
                            {status && <span className="faint">{status}</span>}
                        </>
                    )}
                </p>
                {primary && (
                    <button type="button" className="footer-action" onClick={primary.run}>
                        <span className="footer-primary">{primary.title}</span>
                        {primary.shortcut && <Keys keys={shortcutKeys(primary.shortcut)} />}
                    </button>
                )}
                <button
                    type="button"
                    className="footer-action"
                    onClick={() => setPaletteOpen(true)}
                >
                    Actions <Keys keys={shortcutKeys(PALETTE)} />
                </button>
            </footer>

            {paletteOpen && (
                <Picker
                    position="bottom"
                    placeholder="Search for actions..."
                    onClose={() => setPaletteOpen(false)}
                    onOtherKey={event => {
                        if (matchShortcut(PALETTE, event)) {
                            event.preventDefault()
                            setPaletteOpen(false)
                        } else if (
                            actions.some(a => a.shortcut && matchShortcut(a.shortcut, event))
                        ) {
                            setPaletteOpen(false)
                            runShortcut(event)
                        }
                    }}
                    items={actions.map(action => ({
                        id: action.id,
                        title: action.title,
                        section: action.section,
                        ...(action.shortcut && { keys: shortcutKeys(action.shortcut) }),
                        ...(action.destructive && { destructive: true }),
                        run: action.run
                    }))}
                />
            )}
        </div>
    )
}

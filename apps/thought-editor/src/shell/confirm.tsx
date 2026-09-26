import { useSyncExternalStore } from "react"
import { useKeyLayer } from "../keyboard/layers.ts"
import { Keys } from "../ui/kbd.tsx"

type Request = {
    title: string
    message: string
    confirmLabel: string
    resolve: (confirmed: boolean) => void
}

let request: Request | null = null
const listeners = new Set<() => void>()

const set = (next: Request | null) => {
    request = next
    for (const listener of listeners) listener()
}

/** Asks for confirmation in a modal that owns the keyboard: Enter confirms, Escape cancels. */
export const confirm = (options: Omit<Request, "resolve">) =>
    new Promise<boolean>(resolve => {
        request?.resolve(false)
        set({ ...options, resolve })
    })

const settle = (confirmed: boolean) => {
    request?.resolve(confirmed)
    set(null)
}

export function ConfirmHost() {
    const current = useSyncExternalStore(
        listener => {
            listeners.add(listener)
            return () => listeners.delete(listener)
        },
        () => request
    )

    useKeyLayer(event => {
        if (event.key === "Enter") settle(true)
        else if (event.key === "Escape") settle(false)
        else return
        event.preventDefault()
    }, current !== null)

    if (!current) return null

    return (
        <div className="scrim">
            <div className="dialog" role="alertdialog" aria-label={current.title}>
                <p className="dialog-title">{current.title}</p>
                <p>{current.message}</p>
                <div className="dialog-actions">
                    <button type="button" onClick={() => settle(false)}>
                        Cancel <Keys keys={["esc"]} />
                    </button>
                    <button type="button" className="danger" onClick={() => settle(true)}>
                        {current.confirmLabel} <Keys keys={["↵"]} />
                    </button>
                </div>
            </div>
        </div>
    )
}

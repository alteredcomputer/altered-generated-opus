import { useSyncExternalStore } from "react"
import { color, inset } from "../ui/theme.ts"
import { Caps } from "./caps.tsx"
import { useKeyLayer } from "./keyboard.ts"
import { Overlay } from "./overlay.tsx"

type Request = {
    title: string
    message: string
    confirmLabel: string
    resolve: (ok: boolean) => void
}

let pending: Request | null = null
const listeners = new Set<() => void>()
const set = (next: Request | null) => {
    pending = next
    for (const listener of listeners) listener()
}

/** Asks before something irreversible. Resolves true only on an explicit yes. */
export const confirm = (request: Omit<Request, "resolve">) =>
    new Promise<boolean>(resolve => set({ ...request, resolve }))

export function ConfirmHost() {
    const request = useSyncExternalStore(
        listener => {
            listeners.add(listener)
            return () => listeners.delete(listener)
        },
        () => pending
    )
    return request ? <ConfirmDialog request={request} /> : null
}

function ConfirmDialog({ request }: { request: Request }) {
    const answer = (ok: boolean) => {
        set(null)
        request.resolve(ok)
    }

    useKeyLayer(event => {
        if (event.name === "y" || event.name === "return") answer(true)
        else if (event.name === "n" || event.name === "escape" || event.name === "q") answer(false)
        return true
    })

    return (
        <Overlay width={52} top={8}>
            <box paddingX={inset - 1} paddingY={1} flexDirection="column" gap={1}>
                <text fg={color.fg}>
                    <strong>{request.title}</strong>
                </text>
                <text fg={color.fgMuted}>{request.message}</text>
                <box flexDirection="row" gap={3}>
                    <Caps title={request.confirmLabel} keys="y" strong />
                    <Caps title="Cancel" keys="n" />
                </box>
            </box>
        </Overlay>
    )
}

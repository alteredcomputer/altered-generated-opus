import { useSyncExternalStore } from "react"
import { useUi } from "../config/provider.tsx"
import { inset } from "../ui/theme.ts"
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
    const { colors } = useUi()
    const answer = (ok: boolean) => {
        set(null)
        request.resolve(ok)
    }

    useKeyLayer(event => {
        if (event.name === "y" || event.name === "return") answer(true)
        else if (event.name === "n" || event.name === "escape") answer(false)
        return true
    })

    return (
        <Overlay width={56} height={9} onClose={() => answer(false)}>
            <box paddingX={inset} paddingY={1} flexDirection="column" gap={1}>
                <text fg={colors.fg}>
                    <strong>{request.title}</strong>
                </text>
                <text fg={colors.fgMuted}>{request.message}</text>
                <box flexDirection="row" gap={3}>
                    <box onMouseDown={() => answer(true)}>
                        <text>
                            <span fg={colors.attention}>{`${request.confirmLabel} `}</span>
                            <span fg={colors.fgMuted} bg={colors.bgCursor}>
                                {" Y "}
                            </span>
                        </text>
                    </box>
                    <box onMouseDown={() => answer(false)}>
                        <text>
                            <span fg={colors.fgMuted}>{"Cancel "}</span>
                            <span fg={colors.fgMuted} bg={colors.bgCursor}>
                                {" N "}
                            </span>
                        </text>
                    </box>
                </box>
            </box>
        </Overlay>
    )
}

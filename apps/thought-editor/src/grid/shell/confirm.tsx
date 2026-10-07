import { useSyncExternalStore } from "react"
import { Box, inset, Span, Strong, Text, useGridSize, wrappedRows } from "../ui/index.ts"
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

const WIDTH = 56

function ConfirmDialog({ request }: { request: Request }) {
    const screen = useGridSize()
    // Borders, padding, the title, two gaps, and the buttons, around the wrapped message.
    const inner = Math.min(WIDTH, screen.cols - 2) - 2 - 2 * inset
    const height = 8 + wrappedRows(request.message, inner)
    const answer = (ok: boolean) => {
        set(null)
        request.resolve(ok)
    }

    useKeyLayer(key => {
        if (key.name === "y" || key.name === "return") answer(true)
        else if (key.name === "n" || key.name === "escape") answer(false)
        return true
    })

    return (
        <Overlay width={WIDTH} height={height} onClose={() => answer(false)}>
            <Box paddingX={inset} paddingY={1} gap={1}>
                <Text fg="fg">
                    <Strong>{request.title}</Strong>
                </Text>
                <Text fg="fgMuted">{request.message}</Text>
                <Box flexDirection="row" gap={3}>
                    <Box onMouseDown={() => answer(true)}>
                        <Text wrapMode="none">
                            <Span fg="attention">{`${request.confirmLabel} `}</Span>
                            <Span fg="fgMuted" bg="bgCursor">
                                {" Y "}
                            </Span>
                        </Text>
                    </Box>
                    <Box onMouseDown={() => answer(false)}>
                        <Text wrapMode="none">
                            <Span fg="fgMuted">{"Cancel "}</Span>
                            <Span fg="fgMuted" bg="bgCursor">
                                {" N "}
                            </Span>
                        </Text>
                    </Box>
                </Box>
            </Box>
        </Overlay>
    )
}

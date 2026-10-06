import { useTerminalDimensions } from "@opentui/react"
import type { ReactNode } from "react"
import { useUi } from "../config/provider.tsx"

export type Anchor = "center" | "bottom-right" | "top-right"

/**
 * A floating panel with an explicit size, so it draws at its final height on the first frame (an
 * auto-sized overlay measured its text late and flashed one row too tall in Ghostty). A click
 * anywhere outside closes it, because dictation tools can swallow Escape.
 */
export function Overlay({
    width,
    height,
    anchor = "center",
    bottom = 0,
    onClose,
    children
}: {
    width: number
    height: number
    anchor?: Anchor
    /** Rows kept clear below a bottom-anchored panel (the status bar). */
    bottom?: number
    onClose: () => void
    children: ReactNode
}) {
    const { colors } = useUi()
    const screen = useTerminalDimensions()
    const w = Math.min(width, screen.width - 2)
    const h = Math.min(height, screen.height - 2 - bottom)
    const left = anchor === "center" ? Math.floor((screen.width - w) / 2) : screen.width - w - 1
    const top =
        anchor === "bottom-right"
            ? screen.height - bottom - h
            : anchor === "top-right"
              ? 1
              : Math.max(1, Math.floor((screen.height - h) / 3))
    return (
        <>
            <box
                position="absolute"
                zIndex={9}
                top={0}
                left={0}
                width={screen.width}
                height={screen.height}
                onMouseDown={onClose}
            />
            <box
                position="absolute"
                zIndex={10}
                top={top}
                left={left}
                width={w}
                height={h}
                border
                borderStyle="single"
                borderColor={colors.fgFaint}
                backgroundColor={colors.panel}
                flexDirection="column"
                onMouseDown={event => event.stopPropagation()}
            >
                {children}
            </box>
        </>
    )
}

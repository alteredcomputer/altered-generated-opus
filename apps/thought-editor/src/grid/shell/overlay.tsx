import type { ReactNode } from "react"
import { Box, useGridSize } from "../ui/index.ts"

export type Anchor = "center" | "bottom-right" | "top-right"

/**
 * A floating panel with an explicit size in cells, so it draws at its final height on the first
 * frame. A click anywhere outside closes it, because dictation tools can swallow Escape.
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
    const screen = useGridSize()
    const w = Math.min(width, screen.cols - 2)
    const h = Math.min(height, screen.rows - 2 - bottom)
    const left = anchor === "center" ? Math.floor((screen.cols - w) / 2) : screen.cols - w - 1
    const top =
        anchor === "bottom-right"
            ? screen.rows - bottom - h
            : anchor === "top-right"
              ? 1
              : Math.max(1, Math.floor((screen.rows - h) / 3))
    return (
        <>
            <Box
                position="absolute"
                zIndex={9}
                top={0}
                left={0}
                width={screen.cols}
                height={screen.rows}
                onMouseDown={onClose}
            />
            <Box
                position="absolute"
                zIndex={10}
                top={top}
                left={left}
                width={w}
                height={h}
                border
                borderStyle="single"
                borderColor="fgFaint"
                backgroundColor="panel"
                onMouseDown={event => event.stopPropagation()}
            >
                {children}
            </Box>
        </>
    )
}

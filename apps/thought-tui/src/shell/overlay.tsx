import { useTerminalDimensions } from "@opentui/react"
import type { ReactNode } from "react"
import { color } from "../ui/theme.ts"

/**
 * A floating panel drawn over the view: the same ground as everything else (D172, one background
 * for every panel), set apart by a hairline frame rather than a shadow.
 */
export function Overlay({
    width,
    top = 3,
    children
}: {
    width: number
    top?: number
    children: ReactNode
}) {
    const screen = useTerminalDimensions()
    const w = Math.min(width, screen.width - 4)
    return (
        <box
            position="absolute"
            zIndex={10}
            top={top}
            left={Math.floor((screen.width - w) / 2)}
            width={w}
            maxHeight={screen.height - top - 3}
            border
            borderStyle="single"
            borderColor={color.fgFaint}
            backgroundColor={color.bg}
            flexDirection="column"
        >
            {children}
        </box>
    )
}

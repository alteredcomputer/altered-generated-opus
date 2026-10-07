import { type CSSProperties, type ReactNode, useLayoutEffect, useRef, useState } from "react"
import { gridSize, type Metrics, MetricsContext, settleCell } from "./metrics.ts"
import { colorVariables, type Mode } from "./theme.ts"

/**
 * The grid's root: settles the cell once, sizes itself to whole cells of the window, and writes
 * the palette as CSS variables on the document, so the page around the grid matches its ground.
 * Children render only once the cell is known, so nothing is ever laid out on a guessed cell.
 */
export function GridRoot({ mode, children }: { mode: Mode; children: ReactNode }) {
    const ref = useRef<HTMLDivElement>(null)
    const [metrics, setMetrics] = useState<Metrics | null>(null)

    useLayoutEffect(() => {
        for (const [name, value] of Object.entries(colorVariables(mode)))
            document.documentElement.style.setProperty(name, value)
        document.documentElement.dataset.mode = mode
    }, [mode])

    useLayoutEffect(() => {
        const root = ref.current
        if (!root) return
        const cell = settleCell(root)
        const update = () =>
            setMetrics({ ...cell, ...gridSize(innerWidth, innerHeight, cell.cw, cell.lh) })
        update()
        addEventListener("resize", update)
        return () => removeEventListener("resize", update)
    }, [])

    return (
        <div
            ref={ref}
            className="g-root"
            data-cell-method={metrics?.method}
            style={
                {
                    "--cols": metrics?.cols ?? 0,
                    "--rows": metrics?.rows ?? 0
                } as CSSProperties
            }
        >
            {metrics && <MetricsContext value={metrics}>{children}</MetricsContext>}
        </div>
    )
}

import { type ReactNode, type TouchEvent, useLayoutEffect, useRef, type WheelEvent } from "react"
import { type BoxProps, boxStyle, cells, rows } from "./box.tsx"
import { useGridSize } from "./metrics.ts"

type ScrollBoxProps = Omit<BoxProps, "children" | "overflow" | "onMouseOver" | "onMouseOut"> & {
    /** The id of a child Box to keep in view (the list's cursor row): the sticky cursor. */
    follow?: string | null
    children?: ReactNode
}

/** `WheelEvent.deltaMode` when the wheel reports lines rather than pixels. */
const DOM_DELTA_LINE = 1

/** Scroll position as a whole number of rows, clamped to the content. */
export const snapRows = (top: number, lh: number, max: number) =>
    Math.max(0, Math.min(Math.floor(max / lh), Math.round(top / lh))) * lh

/**
 * OpenTUI's scrollbox on the grid: scrolls by whole rows only, from the wheel, a touch drag, or
 * `follow`, so every row always sits exactly on the grid. Padding and borders stay fixed around
 * the scrolled rows.
 */
export function ScrollBox({ follow, children, gap, ...props }: ScrollBoxProps) {
    const { lh } = useGridSize()
    const viewport = useRef<HTMLDivElement>(null)
    const wheel = useRef(0)
    const touch = useRef<number | null>(null)

    const scrollBy = (delta: number) => {
        const el = viewport.current
        if (!el || delta === 0) return
        el.scrollTop = snapRows(el.scrollTop + delta * lh, lh, el.scrollHeight - el.clientHeight)
    }

    useLayoutEffect(() => {
        const el = viewport.current
        if (!el || !follow) return
        const child = el.querySelector<HTMLElement>(`[data-id="${CSS.escape(follow)}"]`)
        if (!child) return
        const top =
            child.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop
        const bottom = top + child.offsetHeight
        const max = el.scrollHeight - el.clientHeight
        if (top < el.scrollTop) el.scrollTop = snapRows(top, lh, max)
        else if (bottom > el.scrollTop + el.clientHeight)
            el.scrollTop = snapRows(bottom - el.clientHeight, lh, max)
    })

    const onWheel = (event: WheelEvent) => {
        wheel.current += event.deltaMode === DOM_DELTA_LINE ? event.deltaY * lh : event.deltaY
        const steps = Math.trunc(wheel.current / lh)
        wheel.current -= steps * lh
        scrollBy(steps)
    }

    const onTouchMove = (event: TouchEvent) => {
        const y = event.touches[0]?.clientY
        if (y === undefined || touch.current === null) return
        const steps = Math.trunc((touch.current - y) / lh)
        if (!steps) return
        touch.current -= steps * lh
        scrollBy(steps)
    }

    return (
        <div className={`g-box${props.border ? " g-border" : ""}`} style={boxStyle(props)}>
            <div
                ref={viewport}
                className="g-viewport"
                style={{
                    flexDirection: props.flexDirection ?? "column",
                    ...(gap && { gap: props.flexDirection === "row" ? cells(gap) : rows(gap) })
                }}
                onWheel={onWheel}
                onTouchStart={event => {
                    touch.current = event.touches[0]?.clientY ?? null
                }}
                onTouchMove={onTouchMove}
                onTouchEnd={() => {
                    touch.current = null
                }}
            >
                {children}
            </div>
        </div>
    )
}

import type { CSSProperties, MouseEvent, ReactNode } from "react"
import { color, type Token } from "./theme.ts"

/** A horizontal length in cells, or a percentage of the parent ("40%"). */
export type Cells = number | `${number}%`

export const cells = (n: Cells) => (typeof n === "string" ? n : `calc(${n} * var(--cw))`)
export const rows = (n: Cells) => (typeof n === "string" ? n : `calc(${n} * var(--lh))`)

export type Side = "left" | "right" | "top" | "bottom"

/**
 * OpenTUI's box props as the TUI uses them (D176), in cells and rows. There is no `className` or
 * `style`: these props are the whole styling surface.
 */
export type BoxProps = {
    id?: string
    flexDirection?: "row" | "column"
    flexGrow?: number
    flexShrink?: number
    justifyContent?: "flex-start" | "center" | "flex-end" | "space-between"
    alignItems?: "flex-start" | "center" | "flex-end" | "stretch"
    /** Between children: cells in a row, rows in a column. */
    gap?: number
    padding?: number
    paddingX?: number
    paddingY?: number
    paddingTop?: number
    paddingBottom?: number
    paddingLeft?: number
    paddingRight?: number
    margin?: number
    marginX?: number
    marginY?: number
    marginTop?: number
    marginBottom?: number
    marginLeft?: number
    marginRight?: number
    width?: Cells
    height?: Cells
    /** A border takes exactly one cell on each side it is drawn on. */
    border?: boolean | Side[]
    borderStyle?: "single" | "rounded"
    borderColor?: Token
    backgroundColor?: Token
    position?: "relative" | "absolute"
    top?: number
    left?: number
    right?: number
    bottom?: number
    zIndex?: number
    overflow?: "visible" | "hidden"
    visible?: boolean
    onMouseDown?: (event: MouseEvent) => void
    onMouseOver?: (event: MouseEvent) => void
    onMouseOut?: (event: MouseEvent) => void
    children?: ReactNode
}

const sidesOf = (border: BoxProps["border"]): Side[] =>
    border === true ? ["left", "right", "top", "bottom"] : border || []

/** Lays out the box props as CSS; shared by `Box` and `ScrollBox`. */
export const boxStyle = (props: BoxProps): CSSProperties => {
    const sides = sidesOf(props.border)
    const has = (side: Side) => (sides.includes(side) ? 1 : 0)
    const pad = (side: Side, axis: number | undefined, own: number | undefined) =>
        (own ?? axis ?? props.padding ?? 0) + has(side)
    const margin = (axis: number | undefined, own: number | undefined) =>
        own ?? axis ?? props.margin ?? 0
    const column = (props.flexDirection ?? "column") === "column"

    const style: CSSProperties & Record<`--${string}`, string> = {
        flexDirection: props.flexDirection ?? "column",
        paddingLeft: cells(pad("left", props.paddingX, props.paddingLeft)),
        paddingRight: cells(pad("right", props.paddingX, props.paddingRight)),
        paddingTop: rows(pad("top", props.paddingY, props.paddingTop)),
        paddingBottom: rows(pad("bottom", props.paddingY, props.paddingBottom)),
        marginLeft: cells(margin(props.marginX, props.marginLeft)),
        marginRight: cells(margin(props.marginX, props.marginRight)),
        marginTop: rows(margin(props.marginY, props.marginTop)),
        marginBottom: rows(margin(props.marginY, props.marginBottom))
    }
    if (props.flexGrow !== undefined) style.flexGrow = props.flexGrow
    if (props.flexShrink !== undefined) style.flexShrink = props.flexShrink
    if (props.justifyContent) style.justifyContent = props.justifyContent
    if (props.alignItems) style.alignItems = props.alignItems
    if (props.gap) style.gap = column ? rows(props.gap) : cells(props.gap)
    if (props.width !== undefined) style.width = cells(props.width)
    if (props.height !== undefined) style.height = rows(props.height)
    if (props.backgroundColor) style.background = color(props.backgroundColor)
    if (props.overflow) style.overflow = props.overflow
    if (props.position) style.position = props.position
    if (props.top !== undefined) style.top = rows(props.top)
    if (props.bottom !== undefined) style.bottom = rows(props.bottom)
    if (props.left !== undefined) style.left = cells(props.left)
    if (props.right !== undefined) style.right = cells(props.right)
    if (props.zIndex !== undefined) style.zIndex = props.zIndex
    if (sides.length) {
        style["--b-c"] = color(props.borderColor ?? "rule")
        if (props.borderStyle === "rounded") style["--b-radius"] = "var(--cwh)"
        for (const side of sides) {
            const key = side[0] as "l" | "r" | "t" | "b"
            style[`--b-${key}`] = key === "l" || key === "r" ? "var(--cwh)" : "var(--lhh)"
            style[`--b-${key}w`] = "var(--bw)"
        }
    }
    return style
}

/**
 * Keeps focus where it is when chrome is clicked, so the always-focused search keeps the caret
 * (as in the TUI). Clicks into a field still place its caret natively.
 */
export const keepFocus = (event: MouseEvent) => {
    const target = event.target as HTMLElement
    if (!target.closest("input, textarea, .g-selectable")) event.preventDefault()
}

export function Box(props: BoxProps) {
    const { onMouseDown } = props
    return (
        // biome-ignore lint/a11y/noStaticElementInteractions: every click has a key (D174); the mouse is the second path, for when dictation takes Escape.
        <div
            data-id={props.id}
            className={[
                "g-box",
                props.border ? "g-border" : "",
                props.visible === false ? "g-hidden" : ""
            ].join(" ")}
            style={boxStyle(props)}
            onMouseDown={
                onMouseDown &&
                (event => {
                    keepFocus(event)
                    onMouseDown(event)
                })
            }
            onMouseEnter={props.onMouseOver}
            onMouseLeave={props.onMouseOut}
        >
            {props.children}
        </div>
    )
}

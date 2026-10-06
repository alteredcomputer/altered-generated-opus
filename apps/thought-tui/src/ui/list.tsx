import type { ScrollBoxRenderable } from "@opentui/core"
import { type ReactNode, useEffect, useId, useRef, useState } from "react"
import { color, inset } from "./theme.ts"

type ListProps<T> = {
    items: T[]
    getId: (item: T) => string
    cursor: string | null
    selected: string[]
    empty: string
    /** The list's width in cells, so rows can trim their text to fit (see ui/text.ts). */
    width: number
    renderRow: (item: T, active: boolean, cells: number) => ReactNode
    onCursor: (id: string) => void
    onActivate: (id: string) => void
}

const DOUBLE_CLICK_MS = 400

/**
 * Rows edge to edge on one ground: the cursor row takes the cursor gray, a hovered row the hover
 * gray, and a selected row a dot in the gutter. Scrolls to keep the cursor in view; the mouse can
 * click to move, double-click to open, and wheel to scroll.
 */
export function List<T>(props: ListProps<T>) {
    const { cursor, getId } = props
    const scroll = useRef<ScrollBoxRenderable>(null)
    const [hovered, setHovered] = useState<string | null>(null)
    const lastClick = useRef({ id: "", at: 0 })
    const prefix = useId()
    // Gutter cell, marker and its space, and the right inset.
    const cells = props.width - 3 - inset

    useEffect(() => {
        if (cursor) scroll.current?.scrollChildIntoView(`${prefix}${cursor}`)
    }, [cursor, prefix])

    if (props.items.length === 0)
        return (
            <box width={props.width} paddingX={inset} paddingY={1}>
                <text fg={color.fgFaint}>{props.empty}</text>
            </box>
        )

    return (
        <scrollbox
            ref={scroll}
            width={props.width}
            paddingY={1}
            verticalScrollbarOptions={{ visible: false }}
        >
            {props.items.map(item => {
                const id = getId(item)
                const active = id === cursor
                return (
                    <box
                        key={id}
                        id={`${prefix}${id}`}
                        flexDirection="row"
                        paddingLeft={1}
                        paddingRight={inset}
                        backgroundColor={
                            active ? color.bgCursor : id === hovered ? color.bgHover : color.bg
                        }
                        onMouseOver={() => setHovered(id)}
                        onMouseOut={() => setHovered(current => (current === id ? null : current))}
                        onMouseDown={() => {
                            const now = Date.now()
                            const again =
                                lastClick.current.id === id &&
                                now - lastClick.current.at < DOUBLE_CLICK_MS
                            lastClick.current = { id, at: now }
                            if (again) props.onActivate(id)
                            else props.onCursor(id)
                        }}
                    >
                        <text flexShrink={0} fg={color.accent}>
                            {props.selected.includes(id) ? "● " : "  "}
                        </text>
                        {props.renderRow(item, active, cells)}
                    </box>
                )
            })}
        </scrollbox>
    )
}

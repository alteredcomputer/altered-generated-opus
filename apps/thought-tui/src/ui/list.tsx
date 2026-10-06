import type { ScrollBoxRenderable } from "@opentui/core"
import { type ReactNode, useEffect, useId, useRef, useState } from "react"
import { useUi } from "../config/provider.tsx"
import { inset } from "./theme.ts"

type ListProps<T> = {
    items: T[]
    getId: (item: T) => string
    cursor: string | null
    selected: string[]
    empty: string
    /** The list's width in cells, so rows can trim their text to fit (see ui/text.ts). */
    width: number
    /** Show the selection boxes (only while something is selected). */
    selecting: boolean
    renderRow: (item: T, active: boolean, cells: number) => ReactNode
    onCursor: (id: string) => void
    onToggle: (id: string) => void
    onActivate: (id: string) => void
}

const DOUBLE_CLICK_MS = 400
/** "[×]" and two spaces. */
const BOX = 5

/**
 * Rows edge to edge on one ground: the cursor row takes the cursor gray, a hovered row the hover
 * gray. While anything is selected every row grows a `[×]` or `[ ]` box and shifts right; with
 * nothing selected the rows sit at the plain inset. `list.gap` puts blank rows between rows as
 * margins, so the cursor and the mouse never land on them. Click moves the cursor, a click on the
 * box toggles, a double-click opens, the wheel scrolls.
 */
export function List<T>(props: ListProps<T>) {
    const { cursor, getId, selecting } = props
    const { config, colors } = useUi()
    const scroll = useRef<ScrollBoxRenderable>(null)
    const [hovered, setHovered] = useState<string | null>(null)
    const lastClick = useRef({ id: "", at: 0 })
    const prefix = useId()
    const cells = props.width - 2 * inset - (selecting ? BOX : 0)

    useEffect(() => {
        if (cursor) scroll.current?.scrollChildIntoView(`${prefix}${cursor}`)
    }, [cursor, prefix])

    if (props.items.length === 0)
        return (
            <box width={props.width} paddingX={inset} paddingY={1}>
                <text fg={colors.fgFaint}>{props.empty}</text>
            </box>
        )

    return (
        <scrollbox
            ref={scroll}
            width={props.width}
            paddingY={1}
            verticalScrollbarOptions={{ visible: false }}
        >
            {props.items.map((item, i) => {
                const id = getId(item)
                const active = id === cursor
                const on = props.selected.includes(id)
                return (
                    <box
                        key={id}
                        id={`${prefix}${id}`}
                        flexDirection="row"
                        flexShrink={0}
                        paddingX={inset}
                        marginBottom={i < props.items.length - 1 ? config.list.gap : 0}
                        backgroundColor={
                            active ? colors.bgCursor : id === hovered ? colors.bgHover : colors.bg
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
                        {selecting && (
                            <box
                                flexShrink={0}
                                width={BOX}
                                onMouseDown={event => {
                                    event.stopPropagation()
                                    props.onToggle(id)
                                }}
                            >
                                <text>
                                    <span fg={colors.fgFaint}>[</span>
                                    <span fg={colors.fg}>{on ? config.selection.mark : " "}</span>
                                    <span fg={colors.fgFaint}>]</span>
                                </text>
                            </box>
                        )}
                        {props.renderRow(item, active, cells)}
                    </box>
                )
            })}
        </scrollbox>
    )
}

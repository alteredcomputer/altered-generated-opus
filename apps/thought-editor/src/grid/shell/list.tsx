import { type ReactNode, useId, useRef, useState } from "react"
import { useUi } from "../config/provider.tsx"
import { Box, inset, ScrollBox, Span, Text } from "../ui/index.ts"

type ListProps<T> = {
    items: T[]
    getId: (item: T) => string
    cursor: string | null
    selected: string[]
    empty: string
    /** The list's width in cells, so rows can fit their text (see ui/cells.ts). */
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
 * Rows edge to edge on one ground, as in the TUI: the cursor row takes the cursor gray, a hovered
 * row the hover gray. While anything is selected every row grows a `[×]` or `[ ]` box and shifts
 * right. `list.gap` puts blank rows between rows as margins, so the cursor and the mouse never land
 * on them. Click moves the cursor, a click on the box toggles, a double-click opens, the wheel
 * scrolls by rows, and the cursor row stays in view.
 */
export function List<T>(props: ListProps<T>) {
    const { cursor, getId, selecting } = props
    const { config } = useUi()
    const [hovered, setHovered] = useState<string | null>(null)
    const lastClick = useRef({ id: "", at: 0 })
    const prefix = useId()
    const cells = props.width - 2 * inset - (selecting ? BOX : 0)

    if (props.items.length === 0)
        return (
            <Box width={props.width} paddingX={inset} paddingY={1}>
                <Text fg="fgFaint">{props.empty}</Text>
            </Box>
        )

    return (
        <ScrollBox width={props.width} paddingY={1} follow={cursor && `${prefix}${cursor}`}>
            {props.items.map((item, i) => {
                const id = getId(item)
                const active = id === cursor
                const on = props.selected.includes(id)
                return (
                    <Box
                        key={id}
                        id={`${prefix}${id}`}
                        flexDirection="row"
                        paddingX={inset}
                        marginBottom={i < props.items.length - 1 ? config.list.gap : 0}
                        backgroundColor={active ? "bgCursor" : id === hovered ? "bgHover" : "bg"}
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
                            <Box
                                flexShrink={0}
                                width={BOX}
                                onMouseDown={event => {
                                    event.stopPropagation()
                                    props.onToggle(id)
                                }}
                            >
                                <Text wrapMode="none">
                                    <Span fg="fgFaint">[</Span>
                                    <Span fg="fg">{on ? config.selection.mark : " "}</Span>
                                    <Span fg="fgFaint">]</Span>
                                </Text>
                            </Box>
                        )}
                        {props.renderRow(item, active, cells)}
                    </Box>
                )
            })}
        </ScrollBox>
    )
}

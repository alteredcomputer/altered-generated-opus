import type { ScrollBoxRenderable } from "@opentui/core"
import { useTerminalDimensions } from "@opentui/react"
import { Fragment, useEffect, useRef, useState } from "react"
import { matches } from "../data/search.ts"
import { width as cellsOf, ellipsize } from "../ui/text.ts"
import { color } from "../ui/theme.ts"
import { useKeyLayer } from "./keyboard.ts"
import { Overlay } from "./overlay.tsx"

export type PaletteItem = {
    id: string
    title: string
    section?: string
    hint?: string
    checked?: boolean
    run: () => void
}

const pad = 2

/**
 * A type-to-search overlay: the action menu, the dataset filter, and the key help are all this.
 * Typing goes to the query; arrows (or Ctrl-N and Ctrl-P, or Tab) move; Enter runs and closes.
 */
export function Palette({
    placeholder,
    items,
    onClose,
    width = 64
}: {
    placeholder: string
    items: PaletteItem[]
    onClose: () => void
    width?: number
}) {
    const [query, setQuery] = useState("")
    const [index, setIndex] = useState(0)
    const scroll = useRef<ScrollBoxRenderable>(null)
    const screen = useTerminalDimensions()
    // Frame, padding, and the check column.
    const room = Math.min(width, screen.width - 4) - 2 - 2 * pad - 2

    const visible = items.filter(item => matches(query, item.title, item.section ?? ""))
    const active = visible[Math.min(index, visible.length - 1)]

    useEffect(() => {
        if (active) scroll.current?.scrollChildIntoView(`palette-${active.id}`)
    }, [active])

    const step = (delta: number) =>
        setIndex(current => Math.max(0, Math.min(visible.length - 1, current + delta)))

    useKeyLayer(event => {
        const { name, ctrl, shift } = event
        if (name === "escape") onClose()
        else if (name === "return") {
            onClose()
            active?.run()
        } else if (name === "down" || (ctrl && name === "n") || (name === "tab" && !shift)) step(1)
        else if (name === "up" || (ctrl && name === "p") || (name === "tab" && shift)) step(-1)
        else return false
        return true
    })

    return (
        <Overlay width={width}>
            <box paddingX={pad} height={1} flexDirection="row">
                <input
                    focused
                    flexGrow={1}
                    value={query}
                    placeholder={placeholder}
                    placeholderColor={color.fgFaint}
                    textColor={color.fg}
                    focusedTextColor={color.fg}
                    backgroundColor={color.bg}
                    focusedBackgroundColor={color.bg}
                    cursorColor={color.fg}
                    onInput={value => {
                        setQuery(value)
                        setIndex(0)
                    }}
                />
            </box>
            <box height={1} border={["top"]} borderColor={color.rule} />
            <scrollbox ref={scroll} flexShrink={1} verticalScrollbarOptions={{ visible: false }}>
                {visible.length === 0 && (
                    <box paddingX={pad}>
                        <text fg={color.fgFaint}>No matches.</text>
                    </box>
                )}
                {visible.map((item, i) => (
                    <Fragment key={item.id}>
                        {item.section && item.section !== visible[i - 1]?.section && (
                            <box paddingX={pad} paddingTop={i ? 1 : 0}>
                                <text fg={color.fgFaint}>{item.section}</text>
                            </box>
                        )}
                        <box
                            id={`palette-${item.id}`}
                            flexDirection="row"
                            paddingX={pad}
                            backgroundColor={item === active ? color.bgCursor : color.bg}
                            onMouseDown={() => {
                                onClose()
                                item.run()
                            }}
                        >
                            <text flexGrow={1} wrapMode="none">
                                <span fg={item.checked ? color.accent : color.fgFaint}>
                                    {item.checked === undefined ? "" : item.checked ? "✓ " : "  "}
                                </span>
                                <span fg={item === active ? color.fg : color.accent}>
                                    {ellipsize(
                                        item.title,
                                        room - (item.hint ? cellsOf(item.hint) + 1 : 0)
                                    )}
                                </span>
                            </text>
                            {item.hint && <text fg={color.fgMuted}>{item.hint}</text>}
                        </box>
                    </Fragment>
                ))}
            </scrollbox>
        </Overlay>
    )
}

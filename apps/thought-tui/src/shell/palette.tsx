import type { ScrollBoxRenderable } from "@opentui/core"
import { useTerminalDimensions } from "@opentui/react"
import { useEffect, useRef, useState } from "react"
import { useUi } from "../config/provider.tsx"
import { matches } from "../data/search.ts"
import { width as cellsOf, ellipsize } from "../ui/text.ts"
import { inset } from "../ui/theme.ts"
import { useKeyLayer } from "./keyboard.ts"
import { type Anchor, Overlay } from "./overlay.tsx"

export type PaletteItem = {
    id: string
    title: string
    section?: string
    hint?: string
    checked?: boolean
    /** Drawn in the attention colour (delete). */
    danger?: boolean
    run: () => void
}

type Line =
    | { kind: "section"; title: string }
    | { kind: "gap" }
    | { kind: "item"; item: PaletteItem; index: number }

/**
 * A type-to-search menu: the action menu, the view picker, and the account menu. Anchored at the
 * bottom (the action menu, just above the status bar) its input sits at the bottom and the best
 * match is nearest it, filtering from the bottom like Raycast. Arrows or Ctrl-N and Ctrl-P move,
 * Enter runs, hovering highlights, a click runs, a click outside closes.
 */
export function Palette({
    placeholder,
    items,
    onClose,
    anchor = "bottom-right",
    bottom = 0,
    width = 60
}: {
    placeholder: string
    items: PaletteItem[]
    onClose: () => void
    anchor?: Anchor
    bottom?: number
    width?: number
}) {
    const { colors, config } = useUi()
    const screen = useTerminalDimensions()
    const [query, setQuery] = useState("")
    const [index, setIndex] = useState(0)
    const scroll = useRef<ScrollBoxRenderable>(null)
    const fromBottom = anchor === "bottom-right"

    // Sections stay together even when a view lists its actions out of section order.
    const sectionOrder = [...new Set(items.map(item => item.section))]
    const visible = items
        .filter(item => matches(query, item.title, item.section ?? ""))
        .sort((x, y) => sectionOrder.indexOf(x.section) - sectionOrder.indexOf(y.section))
    const active = Math.min(index, visible.length - 1)

    // Group by section in match order; anchored at the bottom, groups and their items run upward
    // from the input, but each header still sits above its own rows.
    const groups: { section: string | undefined; items: { item: PaletteItem; index: number }[] }[] =
        []
    visible.forEach((item, index) => {
        const last = groups.at(-1)
        if (last && last.section === item.section) last.items.push({ item, index })
        else groups.push({ section: item.section, items: [{ item, index }] })
    })
    if (fromBottom) for (const group of groups.reverse()) group.items.reverse()
    const lines: Line[] = []
    groups.forEach((group, g) => {
        if (g > 0) lines.push({ kind: "gap" })
        if (group.section) lines.push({ kind: "section", title: group.section })
        group.items.forEach((entry, i) => {
            if (i > 0 && config.palette.gap) lines.push({ kind: "gap" })
            lines.push({ kind: "item", ...entry })
        })
    })
    if (lines.length === 0) lines.push({ kind: "section", title: "No matches." })

    const chrome = 4
    // Never taller than the space under the search bar, so the header stays visible.
    const height = Math.min(lines.length + chrome, screen.height - bottom - 6)
    const room = Math.min(width, screen.width - 2) - 2 - 2 * inset - 2

    useEffect(() => {
        if (visible[active]) scroll.current?.scrollChildIntoView(`palette-${visible[active].id}`)
    }, [active, visible])

    const step = (delta: number) =>
        setIndex(Math.max(0, Math.min(visible.length - 1, active + delta)))
    const run = (item: PaletteItem | undefined) => {
        onClose()
        item?.run()
    }

    useKeyLayer(event => {
        const { name, ctrl } = event
        // Visual direction: with the input at the bottom, Up walks away from the best match.
        const away = fromBottom ? 1 : -1
        if (name === "escape") onClose()
        else if (name === "return") run(visible[active])
        else if (name === "up" || (ctrl && name === "p")) step(away)
        else if (name === "down" || (ctrl && name === "n")) step(-away)
        else return false
        return true
    })

    const input = (
        <box paddingX={inset} height={1} flexShrink={0} flexDirection="row">
            <input
                focused
                flexGrow={1}
                value={query}
                placeholder={`${config.input.placeholderPrefix}${placeholder}`}
                placeholderColor={colors.fgFaint}
                textColor={colors.fg}
                focusedTextColor={colors.fg}
                backgroundColor={colors.panel}
                focusedBackgroundColor={colors.panel}
                cursorColor={colors.fg}
                onInput={value => {
                    setQuery(value)
                    setIndex(0)
                }}
            />
        </box>
    )
    const rule = (
        <box
            height={1}
            flexShrink={0}
            border={[fromBottom ? "bottom" : "top"]}
            borderColor={colors.rule}
        />
    )

    const body = (
        <scrollbox ref={scroll} flexGrow={1} verticalScrollbarOptions={{ visible: false }}>
            {lines.map((line, i) => {
                // biome-ignore lint/suspicious/noArrayIndexKey: a gap row is purely positional.
                if (line.kind === "gap") return <box key={`gap-${i}`} height={1} />
                if (line.kind === "section")
                    return (
                        <box key={`section-${line.title}`} paddingX={inset} height={1}>
                            <text fg={colors.fgFaint}>{line.title}</text>
                        </box>
                    )
                const { item } = line
                const on = line.index === active
                const check = item.checked === undefined ? "" : item.checked ? "✓ " : "  "
                return (
                    <box
                        key={item.id}
                        id={`palette-${item.id}`}
                        height={1}
                        flexDirection="row"
                        paddingX={inset}
                        backgroundColor={on ? colors.bgCursor : colors.panel}
                        onMouseOver={() => setIndex(line.index)}
                        onMouseDown={() => run(item)}
                    >
                        <text flexGrow={1} wrapMode="none">
                            <span fg={colors.accent}>{check}</span>
                            <span
                                fg={item.danger ? colors.attention : on ? colors.fg : colors.accent}
                            >
                                {ellipsize(
                                    item.title,
                                    room - cellsOf(check) - (item.hint ? cellsOf(item.hint) + 1 : 0)
                                )}
                            </span>
                        </text>
                        {item.hint && <text fg={colors.fgMuted}>{item.hint}</text>}
                    </box>
                )
            })}
        </scrollbox>
    )

    return (
        <Overlay width={width} height={height} anchor={anchor} bottom={bottom} onClose={onClose}>
            {fromBottom ? (
                <>
                    {body}
                    {rule}
                    {input}
                </>
            ) : (
                <>
                    {input}
                    {rule}
                    {body}
                </>
            )}
        </Overlay>
    )
}

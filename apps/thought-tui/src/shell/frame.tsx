import { useRenderer } from "@opentui/react"
import { type ReactNode, useState } from "react"
import { label, matches } from "../ui/keys.ts"
import { color, inset } from "../ui/theme.ts"
import type { Action } from "./action.ts"
import { Caps } from "./caps.tsx"
import { type KeyHandler, useKeyLayer } from "./keyboard.ts"
import { useNavigation } from "./navigation.tsx"
import { Palette, type PaletteItem } from "./palette.tsx"
import { useToast } from "./toast.ts"

export type HelpEntry = { title: string; hint: string }

export type Search = {
    value: string
    placeholder: string
    focused: boolean
    onChange: (value: string) => void
}

type FrameProps = {
    title: string
    /** Footer count, "25 Total" or "3 of 25 Total" while selecting. */
    count?: { total: number; selected: number }
    /** Footer text in place of a count, such as "unsaved changes". */
    status?: string
    search?: Search
    heading?: string
    accessory?: ReactNode
    /** The first action is the primary one, shown in the footer beside Actions. */
    actions: Action[]
    /** Keys the view's own navigation does not cover, listed in help. */
    help?: HelpEntry[]
    /** View keys, consulted first. */
    onKey?: KeyHandler
    /** An input has focus: plain keys type, and only Ctrl shortcuts still fire. */
    typing?: boolean
    /** Return true when Escape was used up (cleared something); otherwise it goes back. */
    onEscape?: () => boolean
    /** A view's own floating panel, positioned against the window like the action menu. */
    overlay?: ReactNode
    children: ReactNode
}

const MENU = { key: "space" }

/**
 * The window every view renders into, shaped like the web editor (D144, D172): a header line with
 * search and an accessory, the body, and a footer with the title, the count or a toast, the primary
 * action, and Actions. It owns the action menu and help, and binds every action's shortcut.
 */
export function Frame(props: FrameProps) {
    const { actions, typing = false } = props
    const { depth, pop } = useNavigation()
    const renderer = useRenderer()
    const toast = useToast()
    const [overlay, setOverlay] = useState<"menu" | "help" | null>(null)

    const back = () => {
        if (depth > 0) pop()
        else renderer.destroy()
    }

    useKeyLayer(event => {
        if (props.onKey?.(event)) return true
        const action = actions.find(
            a => a.shortcut && matches(event, a.shortcut) && (!typing || a.shortcut.ctrl)
        )
        if (action) action.run()
        else if (typing) return false
        else if (matches(event, MENU)) setOverlay("menu")
        else if (event.sequence === "?") setOverlay("help")
        else if (event.name === "escape") props.onEscape?.() || (depth > 0 && pop())
        else if (event.name === "q" && !event.ctrl) back()
        return true
    })

    const asItems = (list: Action[]): PaletteItem[] =>
        list.map(a => ({ ...a, ...(a.shortcut && { hint: label(a.shortcut) }) }))

    const help: PaletteItem[] = [
        ...(props.help ?? []).map(entry => ({
            id: `help-${entry.hint}`,
            ...entry,
            section: "Navigate",
            run: () => {}
        })),
        ...asItems(actions),
        { id: "help-menu", title: "Actions", hint: label(MENU), section: "Window", run: () => {} },
        { id: "help-help", title: "Keys", hint: "?", section: "Window", run: () => {} },
        { id: "help-back", title: depth ? "Back" : "Quit", hint: "q", section: "Window", run: back }
    ]

    const [primary] = actions
    const { count } = props

    return (
        <box flexGrow={1} flexDirection="column" backgroundColor={color.bg}>
            <box flexDirection="row" flexShrink={0} paddingX={inset} paddingY={1} gap={2}>
                {depth > 0 && <text fg={color.fgMuted}>←</text>}
                <box flexGrow={1} height={1} flexDirection="row">
                    {props.search ? (
                        <SearchInput search={props.search} />
                    ) : (
                        <text fg={color.fg}>{props.heading}</text>
                    )}
                </box>
                {props.accessory}
            </box>
            <Rule />

            <box flexGrow={1} flexDirection="row">
                {props.children}
            </box>

            <Rule />
            <box flexDirection="row" flexShrink={0} height={1}>
                <box flexGrow={1} paddingLeft={inset} overflow="hidden">
                    <text wrapMode="none">
                        <span fg={color.fgMuted}>{props.title}</span>
                        <span fg={toast ? color.accent : color.fgFaint}>
                            {`   ${toast ?? props.status ?? (count ? countLabel(count) : "")}`}
                        </span>
                    </text>
                </box>
                {primary?.shortcut && (
                    <Segment>
                        <Caps title={primary.title} keys={label(primary.shortcut)} strong />
                    </Segment>
                )}
                <Segment>
                    <Caps title="Actions" keys={label(MENU)} />
                </Segment>
            </box>

            {props.overlay}
            {overlay === "menu" && (
                <Palette
                    placeholder="Search actions..."
                    items={asItems(actions)}
                    onClose={() => setOverlay(null)}
                />
            )}
            {overlay === "help" && (
                <Palette
                    placeholder="Search keys..."
                    items={help}
                    onClose={() => setOverlay(null)}
                />
            )}
        </box>
    )
}

const countLabel = ({ total, selected }: { total: number; selected: number }) =>
    selected ? `${selected} of ${total} Total` : `${total} Total`

/** A full-width hairline. */
export const Rule = () => (
    <box height={1} flexShrink={0} border={["top"]} borderColor={color.rule} />
)

/** A footer action, set off by a hairline on its left. */
function Segment({ children }: { children: ReactNode }) {
    return (
        <box flexDirection="row" border={["left"]} borderColor={color.rule} paddingX={2}>
            {children}
        </box>
    )
}

function SearchInput({ search }: { search: Search }) {
    return (
        <input
            flexGrow={1}
            focused={search.focused}
            value={search.value}
            placeholder={search.placeholder}
            placeholderColor={color.fgFaint}
            textColor={color.fg}
            focusedTextColor={color.fg}
            backgroundColor={color.bg}
            focusedBackgroundColor={color.bg}
            cursorColor={color.fg}
            onInput={search.onChange}
        />
    )
}

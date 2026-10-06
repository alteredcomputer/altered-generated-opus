import { useRenderer } from "@opentui/react"
import { type ReactNode, useState } from "react"
import { configPath, useUi } from "../config/provider.tsx"
import { label, matches, type Shortcut } from "../ui/keys.ts"
import { inset } from "../ui/theme.ts"
import type { Action } from "./action.ts"
import { Caps } from "./caps.tsx"
import { KeyMap } from "./key-map.tsx"
import { type KeyHandler, useKeyLayer } from "./keyboard.ts"
import { useNavigation } from "./navigation.tsx"
import { Palette, type PaletteItem } from "./palette.tsx"
import {
    dismissToast,
    frameOf,
    IDLE,
    LOADING,
    showToast,
    toastTask,
    trackActivity,
    useFeedback
} from "./toast.ts"

export type HelpEntry = { title: string; hint: string; section?: string }

export type Search = { value: string; placeholder: string; onChange: (value: string) => void }

type FrameProps = {
    title: string
    /** Footer count, "25 Total" or "3 of 25 Total" while selecting. */
    count?: { total: number; selected: number }
    /** Footer text in place of a count, such as "Unsaved changes". */
    status?: string
    /** The always-focused search (Raycast style): letters type into it unless a menu is open. */
    search?: Search
    heading?: string
    /** The view selector at the right of the header. */
    view?: { title: string; shortcut: Shortcut; open: () => void }
    /** The first action with a shortcut is the primary one, shown in the footer. */
    actions: Action[]
    /** Keys outside the actions (movement), for the keyboard map. */
    help?: HelpEntry[]
    /** View keys, consulted first. */
    onKey?: KeyHandler
    /** Return true when Escape was used up (cleared something); otherwise it goes back. */
    onEscape?: () => boolean
    /** Going back, by Escape or the arrow; a form uses it to ask about unsaved changes. */
    onBack?: () => void
    /** A view's own floating panel. While it is open the search gives up focus. */
    overlay?: ReactNode
    children: ReactNode
}

export const MENU: Shortcut = { key: "k", ctrl: true }
const KEYS: Shortcut = { key: "/", ctrl: true }
const ACCOUNT: Shortcut = { key: ",", ctrl: true }
const THEME: Shortcut = { key: "d", ctrl: true, shift: true }

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * The window every view renders into (D144, D172, D174): a top bar with ALTERED and the account, a
 * header with the search and the view selector, the body, and a status bar with the activity glyph,
 * the title and count (or a toast), the primary action, and Actions. Everything in the chrome can
 * be clicked, because dictation tools can swallow Escape.
 */
export function Frame(props: FrameProps) {
    const { actions, search } = props
    const { config, colors, toggleMode } = useUi()
    const { depth, pop } = useNavigation()
    const renderer = useRenderer()
    const { toast, busy } = useFeedback()
    const [overlay, setOverlay] = useState<"menu" | "keys" | "account" | null>(null)
    const glyphs = config.glyphs

    const back = props.onBack ?? (() => (depth > 0 ? pop() : undefined))
    const quit = () => renderer.destroy()

    const development: Action[] = [
        {
            id: "dev-success",
            title: "Test Success Toast",
            section: "Development",
            run: () =>
                void toastTask(() => wait(1500), {
                    loading: "Saving thought",
                    success: "Thought saved",
                    failure: () => "Could not save"
                })
        },
        {
            id: "dev-failure",
            title: "Test Failure Toast",
            section: "Development",
            run: () =>
                void toastTask(
                    async () => {
                        await wait(1500)
                        throw new Error("The server did not answer.")
                    },
                    {
                        loading: "Saving thought",
                        success: "Thought saved",
                        failure: () => "Could not save thought"
                    }
                )
        },
        {
            id: "dev-activity",
            title: "Test Background Activity",
            section: "Development",
            run: () => void trackActivity(wait(3000))
        }
    ]

    const globals: Action[] = [
        {
            id: "keys",
            title: "Keyboard Shortcuts",
            section: "App",
            shortcut: KEYS,
            run: () => setOverlay("keys")
        },
        {
            id: "theme",
            title: "Toggle Light Mode",
            section: "App",
            shortcut: THEME,
            run: toggleMode
        },
        {
            id: "config",
            title: "Open Settings",
            section: "App",
            run: () =>
                showToast({ kind: "success", title: "Settings live in", subtitle: configPath })
        },
        {
            id: "web",
            title: "Open in Web",
            section: "App",
            run: () =>
                showToast({
                    kind: "failure",
                    title: "Not connected yet",
                    subtitle: "The web editor has no sync."
                })
        },
        {
            id: "docs",
            title: "Help and Docs",
            section: "App",
            run: () =>
                showToast({
                    kind: "success",
                    title: "Docs",
                    subtitle: "apps/thought-tui/README.md"
                })
        },
        {
            id: "logout",
            title: "Log Out",
            section: "Account",
            run: () =>
                showToast({
                    kind: "failure",
                    title: "Nothing to log out of",
                    subtitle: "Accounts are not built yet."
                })
        },
        { id: "quit", title: "Quit", section: "Account", run: quit }
    ]

    useKeyLayer(event => {
        if (props.onKey?.(event)) return true
        const action = [...actions, ...globals].find(a => a.shortcut && matches(event, a.shortcut))
        if (action) action.run()
        else if (matches(event, MENU)) setOverlay("menu")
        else if (matches(event, ACCOUNT)) setOverlay("account")
        else if (event.name === "f1") setOverlay("keys")
        else if (event.name === "escape") {
            if (props.onEscape?.()) return true
            if (search?.value) search.onChange("")
            else back()
        } else return false
        return true
    })

    const asItems = (list: Action[]): PaletteItem[] =>
        list.map(a => ({ ...a, ...(a.shortcut && { hint: label(a.shortcut, glyphs) }) }))

    const primary = actions.find(a => a.shortcut)
    const { count } = props
    const footerBottom = config.footer.paddingTop + config.footer.paddingBottom + 2

    return (
        <box flexGrow={1} flexDirection="column" backgroundColor={colors.bg}>
            <box
                flexDirection="row"
                flexShrink={0}
                paddingX={inset}
                paddingTop={config.topBar.paddingTop}
            >
                <text flexGrow={1}>
                    <strong fg={colors.fg}>ALTERED</strong>
                    <span fg={colors.fgFaint}> TUI</span>
                </text>
                <box onMouseDown={() => setOverlay("account")}>
                    <Caps title={config.account.name} keys={label(ACCOUNT, glyphs)} />
                </box>
            </box>

            <box
                flexDirection="row"
                flexShrink={0}
                paddingX={inset}
                paddingTop={config.header.paddingTop}
                paddingBottom={config.header.paddingBottom}
                gap={2}
            >
                {depth > 0 && (
                    <box onMouseDown={back}>
                        <text fg={colors.fgMuted}>←</text>
                    </box>
                )}
                <box flexGrow={1} height={1} flexDirection="row">
                    {search ? (
                        <input
                            flexGrow={1}
                            focused={!overlay && !props.overlay}
                            value={search.value}
                            placeholder={`${config.input.placeholderPrefix}${search.placeholder}`}
                            placeholderColor={colors.fgFaint}
                            textColor={colors.fg}
                            focusedTextColor={colors.fg}
                            backgroundColor={colors.bg}
                            focusedBackgroundColor={colors.bg}
                            cursorColor={colors.fg}
                            onInput={search.onChange}
                        />
                    ) : (
                        <text fg={colors.fg}>{props.heading}</text>
                    )}
                </box>
                {props.view && (
                    <box
                        flexDirection="row"
                        border={["left"]}
                        borderColor={colors.rule}
                        paddingLeft={2}
                        onMouseDown={props.view.open}
                    >
                        <text>
                            <span fg={colors.fg}>{props.view.title}</span>
                            <span fg={colors.fgFaint}>{` ${glyphs.chevron} `}</span>
                        </text>
                        <Caps keys={label(props.view.shortcut, glyphs)} />
                    </box>
                )}
            </box>
            <Rule />

            <box flexGrow={1} flexDirection="row">
                {props.children}
            </box>

            <Rule />
            <box
                flexDirection="row"
                flexShrink={0}
                paddingTop={config.footer.paddingTop}
                paddingBottom={config.footer.paddingBottom}
            >
                <box
                    flexGrow={1}
                    flexDirection="row"
                    paddingLeft={inset}
                    overflow="hidden"
                    onMouseDown={dismissToast}
                >
                    <text wrapMode="none">
                        {toast ? (
                            <>
                                <span fg={colors.attention}>{`${frameOf(toast)}  `}</span>
                                <span fg={colors.fg}>{toast.title}</span>
                                {toast.subtitle && (
                                    <span fg={colors.fgMuted}>{`  ${toast.subtitle}`}</span>
                                )}
                            </>
                        ) : (
                            <>
                                <span fg={colors.fg}>
                                    {busy
                                        ? (LOADING[Math.floor(Date.now() / 125) % LOADING.length] ??
                                          IDLE)
                                        : IDLE}
                                </span>
                                <span fg={colors.fgMuted}>{`  ${props.title}`}</span>
                                <span fg={colors.fgFaint}>
                                    {`   ${props.status ?? (count ? countLabel(count) : "")}`}
                                </span>
                            </>
                        )}
                    </text>
                </box>
                {primary?.shortcut && (
                    <Segment onClick={primary.run}>
                        <Caps title={primary.title} keys={label(primary.shortcut, glyphs)} strong />
                    </Segment>
                )}
                <Segment onClick={() => setOverlay("menu")}>
                    <Caps title="Actions" keys={label(MENU, glyphs)} />
                </Segment>
            </box>

            {props.overlay}
            {overlay === "menu" && (
                <Palette
                    placeholder="Search actions..."
                    items={asItems([...actions, ...development])}
                    bottom={footerBottom}
                    onClose={() => setOverlay(null)}
                />
            )}
            {overlay === "account" && (
                <Palette
                    placeholder="Search..."
                    anchor="top-right"
                    width={44}
                    items={asItems(globals)}
                    onClose={() => setOverlay(null)}
                />
            )}
            {overlay === "keys" && (
                <KeyMap
                    sections={[
                        ...(props.help ?? []),
                        ...[
                            ...actions,
                            ...globals,
                            {
                                id: "menu",
                                title: "Actions",
                                section: "App",
                                shortcut: MENU,
                                run: () => {}
                            },
                            {
                                id: "account",
                                title: "Account Menu",
                                section: "App",
                                shortcut: ACCOUNT,
                                run: () => {}
                            }
                        ]
                            .filter(a => a.shortcut)
                            .map(a => ({
                                title: a.title,
                                hint: label(a.shortcut as Shortcut, glyphs),
                                section: a.section
                            }))
                    ]}
                    onClose={() => setOverlay(null)}
                />
            )}
        </box>
    )
}

const countLabel = ({ total, selected }: { total: number; selected: number }) =>
    selected ? `${selected} of ${total} Total` : `${total} Total`

/** A full-width hairline. */
export function Rule() {
    const { colors } = useUi()
    return <box height={1} flexShrink={0} border={["top"]} borderColor={colors.rule} />
}

/** A clickable status bar action, set off by a hairline on its left. */
function Segment({ children, onClick }: { children: ReactNode; onClick: () => void }) {
    const { colors } = useUi()
    return (
        <box
            flexDirection="row"
            border={["left"]}
            borderColor={colors.rule}
            paddingX={2}
            onMouseDown={onClick}
        >
            {children}
        </box>
    )
}

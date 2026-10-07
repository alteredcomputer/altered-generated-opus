import { type ReactNode, useState } from "react"
import { useUi } from "../config/provider.tsx"
import { Box, Input, inset, Span, Strong, Text } from "../ui/index.ts"
import type { Action } from "./action.ts"
import { Caps } from "./caps.tsx"
import { KeyMap } from "./key-map.tsx"
import { type KeyHandler, useKeyLayer } from "./keyboard.ts"
import { host, label, matches, type Shortcut } from "./keys.ts"
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

export const MENU: Shortcut = { key: "k", mod: true }
const KEYS: Shortcut = { key: "/", mod: true }
const ACCOUNT: Shortcut = { key: ",", mod: true }
const THEME: Shortcut = { key: "d", mod: true, shift: true }

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/** The other editor, sharing the same data (D176). */
const CLASSIC = "/"

/**
 * The window every view renders into (D144, D172, D174), as in the TUI: a top bar with ALTERED
 * and the account, a header with the search and the view selector, the body, and a status bar
 * with the activity glyph, the title and count (or a toast), the primary action, and Actions.
 * Everything in the chrome can be clicked, because dictation tools can swallow Escape.
 */
export function Frame(props: FrameProps) {
    const { actions, search } = props
    const { config, toggleMode } = useUi()
    const { depth, pop } = useNavigation()
    const { toast, busy } = useFeedback()
    const [overlay, setOverlay] = useState<"menu" | "keys" | "account" | null>(null)
    const glyphs = config.glyphs
    const keys = (shortcut: Shortcut) => label(shortcut, glyphs, host)

    const back = props.onBack ?? (() => (depth > 0 ? pop() : undefined))

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
                showToast({
                    kind: "success",
                    title: "Settings live in",
                    subtitle: "apps/thought-editor/src/grid/config/grid.config.ts"
                })
        },
        {
            id: "classic",
            title: "Open Classic Editor",
            section: "App",
            run: () => location.assign(CLASSIC)
        },
        {
            id: "docs",
            title: "Help and Docs",
            section: "App",
            run: () =>
                showToast({
                    kind: "success",
                    title: "Docs",
                    subtitle: "apps/thought-editor/src/grid/README.md"
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
        }
    ]

    useKeyLayer(key => {
        if (props.onKey?.(key)) return true
        const action = [...actions, ...globals].find(
            a => a.shortcut && matches(key, a.shortcut, host)
        )
        if (action) action.run()
        else if (matches(key, MENU, host)) setOverlay("menu")
        else if (matches(key, ACCOUNT, host)) setOverlay("account")
        else if (key.name === "f1") setOverlay("keys")
        else if (key.name === "escape") {
            if (props.onEscape?.()) return true
            if (search?.value) search.onChange("")
            else back()
        } else return false
        return true
    })

    const asItems = (list: Action[]): PaletteItem[] =>
        list.map(a => ({ ...a, ...(a.shortcut && { hint: keys(a.shortcut) }) }))

    const primary = actions.find(a => a.shortcut)
    const { count } = props
    const footerBottom = config.footer.paddingTop + config.footer.paddingBottom + 2

    return (
        <Box flexGrow={1} backgroundColor="bg">
            <Box
                flexDirection="row"
                flexShrink={0}
                paddingX={inset}
                paddingTop={config.topBar.paddingTop}
            >
                <Text flexGrow={1} wrapMode="none">
                    <Strong fg="fg">ALTERED</Strong>
                    <Span fg="fgFaint"> GRID</Span>
                </Text>
                <Box onMouseDown={() => setOverlay("account")}>
                    <Caps title={config.account.name} keys={keys(ACCOUNT)} />
                </Box>
            </Box>

            <Box
                flexDirection="row"
                flexShrink={0}
                paddingX={inset}
                paddingTop={config.header.paddingTop}
                paddingBottom={config.header.paddingBottom}
                gap={2}
            >
                {depth > 0 && (
                    <Box onMouseDown={back}>
                        <Text fg="fgMuted">←</Text>
                    </Box>
                )}
                <Box flexGrow={1} height={1} flexDirection="row">
                    {search ? (
                        <Input
                            label={search.placeholder}
                            flexGrow={1}
                            focused={!overlay && !props.overlay}
                            value={search.value}
                            placeholder={`${config.input.placeholderPrefix}${search.placeholder}`}
                            onInput={search.onChange}
                        />
                    ) : (
                        <Text fg="fg" wrapMode="none">
                            {props.heading}
                        </Text>
                    )}
                </Box>
                {props.view && (
                    <Box
                        flexDirection="row"
                        flexShrink={0}
                        border={["left"]}
                        borderColor="rule"
                        paddingLeft={2}
                        onMouseDown={props.view.open}
                    >
                        <Text wrapMode="none">
                            <Span fg="fg">{props.view.title}</Span>
                            <Span fg="fgFaint">{` ${glyphs.chevron} `}</Span>
                        </Text>
                        <Caps keys={keys(props.view.shortcut)} />
                    </Box>
                )}
            </Box>
            <Rule />

            <Box flexGrow={1} flexDirection="row">
                {props.children}
            </Box>

            <Rule />
            <Box
                flexDirection="row"
                flexShrink={0}
                paddingTop={config.footer.paddingTop}
                paddingBottom={config.footer.paddingBottom}
            >
                <Box
                    flexGrow={1}
                    flexDirection="row"
                    paddingLeft={inset}
                    overflow="hidden"
                    onMouseDown={dismissToast}
                >
                    <Text wrapMode="none">
                        {toast ? (
                            <>
                                <Span fg="attention">{frameOf(toast)}</Span>
                                <Span fg="fg">{`  ${toast.title}`}</Span>
                                {toast.subtitle && (
                                    <Span fg="fgMuted">{`  ${toast.subtitle}`}</Span>
                                )}
                            </>
                        ) : (
                            <>
                                <Span fg="fg">
                                    {busy
                                        ? (LOADING[Math.floor(Date.now() / 125) % LOADING.length] ??
                                          IDLE)
                                        : IDLE}
                                </Span>
                                <Span fg="fgMuted">{`  ${props.title}`}</Span>
                                <Span fg="fgFaint">
                                    {`   ${props.status ?? (count ? countLabel(count) : "")}`}
                                </Span>
                            </>
                        )}
                    </Text>
                </Box>
                {primary?.shortcut && (
                    <Segment onClick={primary.run}>
                        <Caps title={primary.title} keys={keys(primary.shortcut)} strong />
                    </Segment>
                )}
                <Segment onClick={() => setOverlay("menu")}>
                    <Caps title="Actions" keys={keys(MENU)} />
                </Segment>
            </Box>

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
                            { id: "menu", title: "Actions", section: "App", shortcut: MENU },
                            {
                                id: "account",
                                title: "Account Menu",
                                section: "App",
                                shortcut: ACCOUNT
                            }
                        ].flatMap(a =>
                            a.shortcut
                                ? [{ title: a.title, hint: keys(a.shortcut), section: a.section }]
                                : []
                        )
                    ]}
                    onClose={() => setOverlay(null)}
                />
            )}
        </Box>
    )
}

const countLabel = ({ total, selected }: { total: number; selected: number }) =>
    selected ? `${selected} of ${total} Total` : `${total} Total`

/** A full-width hairline through the middle of its row. */
export function Rule() {
    return <Box height={1} flexShrink={0} border={["top"]} borderColor="rule" />
}

/** A clickable status bar action, set off by a hairline on its left. */
function Segment({ children, onClick }: { children: ReactNode; onClick: () => void }) {
    return (
        <Box
            flexDirection="row"
            flexShrink={0}
            border={["left"]}
            borderColor="rule"
            paddingX={2}
            onMouseDown={onClick}
        >
            {children}
        </Box>
    )
}

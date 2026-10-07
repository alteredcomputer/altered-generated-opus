/**
 * Every tunable value of the grid editor with its default: the TUI's `tui.config.ts` settings
 * (D174) under the same names, as a typed module (D176). `grid.config.ts` beside this file
 * overrides any subset; Vite reloads the page when it is saved. A key that is not here, or a value
 * of the wrong type or outside its choices, throws and names every bad key.
 */
export const defaults = {
    /** The ALTERED and account bar. */
    topBar: { paddingTop: 1 },
    header: { paddingTop: 1, paddingBottom: 0 },
    /** The status bar keeps at least one row below it, as in the TUI. */
    footer: { paddingTop: 0, paddingBottom: 1 },
    list: { gap: 0, date: "added" as "added" | "modified" | "created" },
    /**
     * `hideBelow`: grids narrower than this many cells (a phone) open with the inspector hidden;
     * the inspector key still shows it. Not in the TUI, whose terminal is always wide.
     */
    inspector: { gap: 0, width: 0.4, hideBelow: 100 },
    palette: { gap: 0 },
    selection: {
        /** The character inside the brackets of a selected row: ×, x, X, or anything. */
        mark: "×",
        /**
         * drag: Shift-arrows repeat the last select or deselect on the row left and the row
         * entered (the Raycast extension). range: a Finder-style range from an anchor.
         */
        extend: "drag" as "drag" | "range"
    },
    /** The TUI's `terminal` palette has no web equivalent, so only the mode remains. */
    theme: { mode: "dark" as "dark" | "light" },
    input: { placeholderPrefix: "› " },
    form: { datasets: "text" as "text" | "picker" },
    glyphs: {
        enter: "↵",
        shift: "⇧",
        ctrl: "^",
        /** The Command key, on Apple platforms (D176). */
        cmd: "⌘",
        tab: "⇥",
        escape: "esc",
        up: "↑",
        down: "↓",
        backspace: "⌫",
        /** Marks built-in attributes (alias, content). Geist Mono has no lock glyph. */
        lock: "•",
        chevron: "⌄"
    },
    account: { name: "Riley Barabash" }
}

export type Config = typeof defaults

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] }
export type ConfigOverrides = DeepPartial<Config>

const choices: Record<string, readonly string[]> = {
    "list.date": ["added", "modified", "created"],
    "selection.extend": ["drag", "range"],
    "theme.mode": ["dark", "light"],
    "form.datasets": ["text", "picker"]
}

/** Merges overrides onto the defaults, or throws naming every bad key. */
export const resolve = (overrides: unknown): Config => {
    const problems: string[] = []
    const merge = (base: object, patch: unknown, path: string): object => {
        if (patch === undefined) return base
        if (typeof patch !== "object" || patch === null || Array.isArray(patch)) {
            problems.push(`${path || "config"} must be an object`)
            return base
        }
        const out: Record<string, unknown> = { ...base }
        for (const [key, value] of Object.entries(patch)) {
            const at = path ? `${path}.${key}` : key
            const current = (base as Record<string, unknown>)[key]
            if (current === undefined) problems.push(`${at} is not a setting`)
            else if (typeof current === "object") out[key] = merge(current as object, value, at)
            else if (typeof value !== typeof current)
                problems.push(`${at} must be a ${typeof current}`)
            else if (choices[at] && !choices[at].includes(value as string))
                problems.push(`${at} must be one of ${choices[at].join(", ")}`)
            else out[key] = value
        }
        return out
    }
    const config = merge(defaults, overrides, "") as Config
    if (problems.length) throw new Error(`Bad grid config: ${problems.join("; ")}`)
    return config
}

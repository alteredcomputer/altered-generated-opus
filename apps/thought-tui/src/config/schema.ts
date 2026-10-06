/**
 * Every tunable value with its default. `tui.config.ts` in the app root overrides any subset and
 * is hot-reloaded. A key that is not here, or a value of the wrong type or outside its choices,
 * is rejected loudly and the previous config stays in force.
 */
export const defaults = {
    /** The ALTERED and account bar; its top row keeps transparent terminals from looking cut off. */
    topBar: { paddingTop: 1 },
    header: { paddingTop: 1, paddingBottom: 0 },
    /** The status bar always keeps at least one row below it, for transparent terminals. */
    footer: { paddingTop: 0, paddingBottom: 1 },
    list: { gap: 0, date: "added" as "added" | "modified" | "created" },
    inspector: { gap: 0, width: 0.4 },
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
    theme: {
        /** altered: the D172 ramp. terminal: the terminal's own colours and transparent ground. */
        palette: "altered" as "altered" | "terminal",
        mode: "dark" as "dark" | "light"
    },
    input: { placeholderPrefix: "› " },
    form: { datasets: "text" as "text" | "picker" },
    glyphs: {
        enter: "↵",
        shift: "⇧",
        ctrl: "^",
        tab: "⇥",
        escape: "esc",
        up: "↑",
        down: "↓",
        backspace: "⌫",
        /** Marks built-in attributes (alias, content). Try ⚿, ⚙, or * (Geist Mono has none of them). */
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
    "theme.palette": ["altered", "terminal"],
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
    if (problems.length) throw new Error(problems.join("; "))
    return config
}

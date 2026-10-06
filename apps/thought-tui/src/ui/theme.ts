import type { TerminalColors } from "@opentui/core"

/**
 * Colour roles (D172): a monochrome ramp stepped by lightness, one ground for every panel, and one
 * attention colour, #ff8000, used sparingly (toasts, the spinner, delete, validation errors; D174).
 */
export type Colors = {
    /** The ground. "transparent" in the terminal palette, so the terminal's own background shows. */
    bg: string
    /** An opaque ground for overlays, which must hide what they cover. */
    panel: string
    bgHover: string
    bgCursor: string
    fg: string
    fgMuted: string
    fgFaint: string
    accent: string
    rule: string
    attention: string
}

const attention = "#ff8000"

export const dark: Colors = {
    bg: "#101010",
    panel: "#101010",
    bgHover: "#181818",
    bgCursor: "#202020",
    fg: "#ffffff",
    fgMuted: "#808080",
    fgFaint: "#404040",
    accent: "#bfbfbf",
    rule: "#202020",
    attention
}

/** The same ramp mirrored: pure white ground, grays stepped toward black. */
export const light: Colors = {
    bg: "#ffffff",
    panel: "#ffffff",
    bgHover: "#f7f7f7",
    bgCursor: "#efefef",
    fg: "#000000",
    fgMuted: "#808080",
    fgFaint: "#bfbfbf",
    accent: "#404040",
    rule: "#efefef",
    attention
}

const channels = (hex: string) => [1, 3, 5].map(i => Number.parseInt(hex.slice(i, i + 2), 16))

/** Mixes `amount` of `to` into `from`, both #rrggbb. */
export const mix = (from: string, to: string, amount: number) => {
    const a = channels(from)
    const b = channels(to)
    return `#${a
        .map((v, i) =>
            Math.round(v + ((b[i] ?? v) - v) * amount)
                .toString(16)
                .padStart(2, "0")
        )
        .join("")}`
}

/**
 * The terminal's own theme: its foreground, a transparent ground, and the in-between grays mixed
 * from its foreground and background, so custom themes and transparency come through. Its yellow
 * stands in for the attention colour.
 */
export const fromTerminal = (terminal: TerminalColors): Colors => {
    const fg = terminal.defaultForeground ?? dark.fg
    const bg = terminal.defaultBackground ?? dark.bg
    return {
        bg: "transparent",
        panel: bg,
        bgHover: mix(bg, fg, 0.06),
        bgCursor: mix(bg, fg, 0.12),
        fg,
        fgMuted: mix(bg, fg, 0.5),
        fgFaint: mix(bg, fg, 0.25),
        accent: mix(bg, fg, 0.75),
        rule: mix(bg, fg, 0.12),
        attention: terminal.palette[3] ?? attention
    }
}

/** Horizontal padding of rows and panels, in cells (the web's 3ch). */
export const inset = 3

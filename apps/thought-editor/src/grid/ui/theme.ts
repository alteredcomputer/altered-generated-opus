/**
 * Colour roles (D172): a monochrome ramp stepped by lightness, one ground for every panel, and one
 * attention colour, #ff8000, used sparingly (toasts, the spinner, delete, validation errors; D174).
 * The TUI's `terminal` palette is dropped: there is no terminal theme to borrow on the web (D176).
 * These objects are the only source of the colours; `GridRoot` writes them as CSS variables.
 */
export type Colors = {
    bg: string
    /** The ground of overlays, which must hide what they cover. */
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

/** A colour role. Primitives take these names, never raw colours. */
export type Token = keyof Colors

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

export type Mode = "dark" | "light"

export const palettes: Record<Mode, Colors> = { dark, light }

/** The CSS variable a token resolves to. */
export const color = (token: Token) => `var(--c-${token})`

export const colorVariables = (mode: Mode) =>
    Object.fromEntries(Object.entries(palettes[mode]).map(([key, value]) => [`--c-${key}`, value]))

/** Horizontal padding of rows and panels, in cells (the web editor's 3ch). */
export const inset = 3

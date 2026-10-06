import type { ConfigOverrides } from "./src/config/schema.ts"

/**
 * Live settings for the thought editor TUI. Save this file while the TUI runs and it re-renders.
 * Every key and its default is in src/config/schema.ts; set only what you want to change.
 */
export default {
    header: { paddingTop: 1, paddingBottom: 0 },
    footer: { paddingTop: 0, paddingBottom: 1 },
    list: { gap: 0 },
    inspector: { gap: 0 },
    palette: { gap: 0 },
    selection: { mark: "×", extend: "drag" },
    theme: { palette: "altered", mode: "dark" }
} satisfies ConfigOverrides

import type { ConfigOverrides } from "./schema.ts"

/**
 * Live settings for the grid editor. Save this file while `pnpm dev` runs and the page reloads
 * with them. Every key and its default is in schema.ts; set only what you want to change.
 */
export default {
    header: { paddingTop: 1, paddingBottom: 0 },
    footer: { paddingTop: 0, paddingBottom: 1 },
    list: { gap: 0 },
    inspector: { gap: 0 },
    palette: { gap: 0 },
    selection: { mark: "×", extend: "drag" },
    theme: { mode: "dark" }
} satisfies ConfigOverrides

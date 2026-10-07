import "@fontsource-variable/geist-mono"
import "./ui/grid.css"
import { registerSW } from "virtual:pwa-register"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { seedOnce } from "../data/writes.ts"
import { log } from "../observability/log.ts"
import { PrimitivesPage } from "./demo/primitives.tsx"

const root = document.getElementById("root")
if (!root) throw new Error("grid.html is missing #root.")

registerSW({
    immediate: true,
    onRegisterError: cause => log("error", "service worker registration failed", { cause })
})

/** The cell is measured from this exact face, so nothing renders until it has loaded (D176). */
const FONT = '500 12px "Geist Mono Variable"'

const fail = (message: string, cause: unknown) => {
    log("error", message, { cause })
    root.textContent = `${message} ${cause instanceof Error ? cause.message : String(cause)}`
}

/**
 * The grid editor at /grid (D176): the TUI's screens on a strict character grid, over the same
 * IndexedDB data as the classic editor at /. `?primitives` opens the primitives test page.
 */
Promise.all([
    document.fonts.load(FONT),
    // As in the classic editor: a failed seed is already logged, and the grid opens on what is stored.
    seedOnce().catch(() => undefined)
])
    .then(([faces]) => {
        if (faces.length === 0) throw new Error("Geist Mono did not load.")
        createRoot(root, {
            onUncaughtError: cause => fail("The grid stopped.", cause)
        }).render(
            <StrictMode>
                <PrimitivesPage />
            </StrictMode>
        )
    })
    .catch(cause => fail("The grid could not start.", cause))

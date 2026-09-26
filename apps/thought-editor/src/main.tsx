import "@fontsource-variable/geist-mono"
import "./theme.css"
import { registerSW } from "virtual:pwa-register"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./app.tsx"
import { seedOnce } from "./data/writes.ts"
import { log } from "./observability/log.ts"

const root = document.getElementById("root")
if (!root) throw new Error("index.html is missing #root.")

registerSW({
    immediate: true,
    onRegisterError: cause => log("error", "service worker registration failed", { cause })
})

/**
 * The seed runs before the first render so the list never flashes empty on a first visit. A
 * failed seed is logged and the app still opens on whatever is stored.
 */
seedOnce()
    .catch(() => undefined)
    .finally(() => {
        createRoot(root).render(
            <StrictMode>
                <App />
            </StrictMode>
        )
    })

import { createCliRenderer } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { App } from "./app.tsx"
import { loadConfig } from "./config/provider.tsx"
import { log, logPath } from "./observability/log.ts"

/**
 * ALTERED thought editor, terminal edition: an in-memory demo seeded with the same thoughts as the
 * web editor (D173, D174). Nothing is written to disk except the log. A bad tui.config.ts at
 * startup is a loud failure, not a silent default.
 */
const config = await loadConfig()

const renderer = await createCliRenderer({
    exitOnCtrlC: true,
    useMouse: true,
    // Focus follows the app's own state, not the last click, so one field owns the caret.
    autoFocus: false,
    // Ghostty speaks the kitty protocol, which tells Ctrl-I from Tab and Ctrl-Shift-D from Ctrl-D.
    useKittyKeyboard: {},
    onDestroy: () => {
        log("info", "exit")
        process.stdout.write(`Log: ${logPath}\n`)
        process.exit(0)
    }
})

log("info", "start", { width: renderer.width, height: renderer.height })
createRoot(renderer).render(<App config={config} />)

import { createCliRenderer } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { App } from "./app.tsx"
import { log, logPath } from "./observability/log.ts"

/**
 * ALTERED thought editor, terminal edition: an in-memory demo seeded with the same 25 thoughts as
 * the web editor (D173). Nothing is written to disk except the log.
 */
const renderer = await createCliRenderer({
    exitOnCtrlC: true,
    useMouse: true,
    backgroundColor: "#101010",
    onDestroy: () => {
        log("info", "exit")
        process.stdout.write(`Log: ${logPath}\n`)
        process.exit(0)
    }
})

log("info", "start", { width: renderer.width, height: renderer.height })
createRoot(renderer).render(<App />)

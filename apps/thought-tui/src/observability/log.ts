import { appendFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

/**
 * The terminal belongs to the UI, so logs go to a JSON-lines file instead of stdout. Follow it with
 * `tail -f` on the path printed at exit.
 */
export const logPath = join(tmpdir(), "thought-tui.log")

export const log = (level: "info" | "error", message: string, data: object = {}) =>
    appendFileSync(
        logPath,
        `${JSON.stringify({ at: new Date().toISOString(), level, message, ...data })}\n`
    )

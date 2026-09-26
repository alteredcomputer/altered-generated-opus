type Level = "info" | "error"

/**
 * @remarks
 * The prototype has no server to ship logs to, so structured entries go to the browser console,
 * where every write and failure can be traced from DevTools.
 */
export const log = (level: Level, event: string, data?: Record<string, unknown>) => {
    const entry = { at: new Date().toISOString(), event, ...data }
    // biome-ignore lint/suspicious/noConsole: the console is this client-only app's log sink.
    level === "error" ? console.error(entry) : console.info(entry)
}

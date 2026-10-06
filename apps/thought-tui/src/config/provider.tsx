import { readFileSync, watch } from "node:fs"
import { dirname, join } from "node:path"
import type { TerminalColors } from "@opentui/core"
import { useRenderer } from "@opentui/react"
import { createContext, type ReactNode, useContext, useEffect, useState } from "react"
import { log } from "../observability/log.ts"
import { showToast } from "../shell/toast.ts"
import { type Colors, dark, fromTerminal, light } from "../ui/theme.ts"
import { type Config, resolve } from "./schema.ts"

export const configPath = join(import.meta.dir, "../../tui.config.ts")

type Ui = { config: Config; colors: Colors; toggleMode: () => void }

const UiContext = createContext<Ui | null>(null)

let version = 0
const load = async () => resolve((await import(`${configPath}?v=${version++}`)).default)

/**
 * Loads `tui.config.ts`, re-reads it whenever it is saved, and derives the colours. A bad save
 * keeps the previous config and says why in an error toast.
 */
export function UiProvider({ initial, children }: { initial: Config; children: ReactNode }) {
    const renderer = useRenderer()
    const [config, setConfig] = useState(initial)
    const [mode, setMode] = useState(initial.theme.mode)
    const [terminal, setTerminal] = useState<TerminalColors | null>(null)

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | undefined
        // Watch the folder, not the file: editors and sed save by replacing the file, which would
        // orphan a watcher on the old one, and a rename reports the temporary name. So any event
        // re-reads the file and reloads only when its text changed.
        let text = readFileSync(configPath, "utf8")
        const watcher = watch(dirname(configPath), () => {
            let next: string
            try {
                next = readFileSync(configPath, "utf8")
            } catch {
                return // Mid-replace: the file is briefly absent; the next event finds it.
            }
            if (next === text) return
            text = next
            clearTimeout(timer)
            timer = setTimeout(async () => {
                try {
                    const next = await load()
                    setConfig(next)
                    setMode(next.theme.mode)
                    log("info", "config reloaded")
                } catch (cause) {
                    const message = cause instanceof Error ? cause.message : String(cause)
                    log("error", "config rejected", { message })
                    showToast({ kind: "failure", title: "Config not applied", subtitle: message })
                }
            }, 60)
        })
        return () => watcher.close()
    }, [])

    useEffect(() => {
        if (config.theme.palette !== "terminal" || terminal) return
        renderer
            .getPalette()
            .then(setTerminal)
            .catch((cause: unknown) => {
                log("error", "terminal palette unavailable", { cause: String(cause) })
                showToast({
                    kind: "failure",
                    title: "Terminal colours unavailable",
                    subtitle: "Using the ALTERED palette."
                })
            })
    }, [config.theme.palette, terminal, renderer])

    const colors =
        config.theme.palette === "terminal" && terminal
            ? fromTerminal(terminal)
            : mode === "light"
              ? light
              : dark

    return (
        <UiContext.Provider
            value={{
                config,
                colors,
                toggleMode: () => setMode(current => (current === "dark" ? "light" : "dark"))
            }}
        >
            {children}
        </UiContext.Provider>
    )
}

export const loadConfig = load

export const useUi = () => {
    const ui = useContext(UiContext)
    if (!ui) throw new Error("useUi must be used inside UiProvider.")
    return ui
}

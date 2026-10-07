import { createContext, type ReactNode, useContext, useState } from "react"
import { log } from "../../observability/log.ts"
import { GridRoot, type Mode } from "../ui/index.ts"
import overrides from "./grid.config.ts"
import { type Config, resolve } from "./schema.ts"

type Ui = { config: Config; mode: Mode; toggleMode: () => void }

const UiContext = createContext<Ui | null>(null)

/**
 * Resolved once per page load: a bad value in grid.config.ts throws here, so the page fails
 * loudly instead of quietly using a default (the test suite resolves the committed file too).
 */
const config = resolve(overrides)
log("info", "grid config", { mode: config.theme.mode, extend: config.selection.extend })

/** The settings and light or dark mode, around the grid root. */
export function UiProvider({ children }: { children: ReactNode }) {
    const [mode, setMode] = useState<Mode>(config.theme.mode)
    const toggleMode = () => setMode(current => (current === "dark" ? "light" : "dark"))
    return (
        <UiContext value={{ config, mode, toggleMode }}>
            <GridRoot mode={mode}>{children}</GridRoot>
        </UiContext>
    )
}

export const useUi = () => {
    const ui = useContext(UiContext)
    if (!ui) throw new Error("useUi must be used inside UiProvider.")
    return ui
}

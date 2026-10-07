import { createContext, useContext } from "react"
import { log } from "../../observability/log.ts"

/** The cell in whole pixels, and the window's size in cells: the terminal's columns and rows. */
export type Metrics = {
    cw: number
    lh: number
    cols: number
    rows: number
    /** How the cell width was found: CSS `round(1ch, 1px)`, or measured in JS at boot. */
    method: "css" | "js"
}

export const gridSize = (width: number, height: number, cw: number, lh: number) => ({
    cols: Math.max(1, Math.floor(width / cw)),
    rows: Math.max(1, Math.floor(height / lh))
})

const PROBE = 100

const probe = (root: HTMLElement, letterSpacing?: string) => {
    const span = document.createElement("span")
    span.textContent = "0".repeat(PROBE)
    span.style.position = "absolute"
    span.style.visibility = "hidden"
    span.style.whiteSpace = "pre"
    if (letterSpacing) span.style.letterSpacing = letterSpacing
    root.append(span)
    const width = span.getBoundingClientRect().width
    span.remove()
    return width
}

const pixels = (root: HTMLElement, name: string) =>
    Number.parseFloat(getComputedStyle(root).getPropertyValue(name))

/**
 * Settles the cell size once, after the font has loaded (D176). The stylesheet asks for
 * `--cw: round(1ch, 1px)` with letter spacing that makes every glyph advance exactly one cell; a
 * run of 100 characters proves it. If the browser computed something else, the font's advance is
 * measured here, rounded, and written as `--cw` in pixels, and the run is checked again. A grid
 * that still does not line up is a loud error, never a quiet guess.
 */
export const settleCell = (root: HTMLElement): Pick<Metrics, "cw" | "lh" | "method"> => {
    const lh = pixels(root, "--lh")
    if (!(lh > 0) || !Number.isInteger(lh)) throw new Error(`--lh must be whole pixels, got ${lh}.`)

    const css = pixels(root, "--cw")
    if (css > 0 && Number.isInteger(css) && probe(root) === PROBE * css) {
        log("info", "grid metrics", { cw: css, lh, method: "css" })
        return { cw: css, lh, method: "css" }
    }

    const cw = Math.round(probe(root, "0") / PROBE)
    root.style.setProperty("--cw", `${cw}px`)
    const run = probe(root)
    if (!(cw > 0) || run !== PROBE * cw) {
        log("error", "grid metrics do not line up", { cw, lh, css, run })
        throw new Error(`The cell grid does not line up: ${PROBE} cells measured ${run}px.`)
    }
    log("info", "grid metrics", { cw, lh, css, method: "js" })
    return { cw, lh, method: "js" }
}

export const MetricsContext = createContext<Metrics | null>(null)

/** The grid's size in cells and rows, the web equivalent of the terminal's dimensions. */
export const useGridSize = () => {
    const metrics = useContext(MetricsContext)
    if (!metrics) throw new Error("useGridSize must be used inside GridRoot.")
    return metrics
}

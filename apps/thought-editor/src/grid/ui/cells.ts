/**
 * Text measured in grid cells, the web stand-in for a terminal's string width. Geist Mono is
 * a subset font, so characters it lacks are drawn from a fallback font at that font's own advance,
 * which would knock every later glyph off the grid. `segments` marks them so `Text` can pin each to
 * a fixed number of cells; `width`, `ellipsize`, and `fitRow` count cells the same way.
 */

/** The code point ranges the bundled Geist Mono files carry (its fontsource `unicode.json`). */
const covered: [number, number][] = [
    [0x0020, 0x007e],
    [0x00a0, 0x02ff],
    [0x0300, 0x036f],
    [0x0400, 0x052f],
    [0x1c80, 0x1c8a],
    [0x1d00, 0x1dbf],
    [0x1e00, 0x1eff],
    [0x2000, 0x2001],
    [0x2004, 0x2008],
    [0x200a, 0x200a],
    [0x2010, 0x206f],
    [0x20a0, 0x20c0],
    [0x2113, 0x2113],
    [0x2116, 0x2116],
    [0x2122, 0x2122],
    [0x2191, 0x2191],
    [0x2193, 0x2193],
    [0x2212, 0x2212],
    [0x2215, 0x2215],
    [0x23b8, 0x23bd],
    [0x2500, 0x259f],
    [0x2c60, 0x2c7f],
    [0x2de0, 0x2dff],
    [0xa640, 0xa69f],
    [0xa720, 0xa7ff],
    [0xfe2e, 0xfe2f]
]

/** East Asian wide and emoji ranges, two cells each, as a terminal draws them. */
const wide: [number, number][] = [
    [0x1100, 0x115f],
    [0x2e80, 0x303e],
    [0x3041, 0x33ff],
    [0x3400, 0x4dbf],
    [0x4e00, 0x9fff],
    [0xa000, 0xa4cf],
    [0xac00, 0xd7a3],
    [0xf900, 0xfaff],
    [0xfe30, 0xfe4f],
    [0xff00, 0xff60],
    [0xffe0, 0xffe6],
    [0x1f300, 0x1f64f],
    [0x1f900, 0x1f9ff],
    [0x20000, 0x3fffd]
]

const within = (ranges: [number, number][], code: number) =>
    ranges.some(([from, to]) => code >= from && code <= to)

/** Combining marks and zero-width characters take no cell of their own. */
const zeroWidth = (code: number) =>
    (code >= 0x0300 && code <= 0x036f) ||
    (code >= 0x200b && code <= 0x200f) ||
    code === 0x2060 ||
    code === 0xfeff ||
    (code >= 0xfe00 && code <= 0xfe0f)

export const charCells = (char: string) => {
    const code = char.codePointAt(0) ?? 0
    if (zeroWidth(code)) return 0
    return within(wide, code) ? 2 : 1
}

export const width = (text: string) => {
    let cells = 0
    for (const char of text) cells += charCells(char)
    return cells
}

/** A run of text the font draws on the grid, or one character pinned to `cells` cells. */
export type Segment = { text: string; cells?: number }

const onGrid = (char: string) => {
    const code = char.codePointAt(0) ?? 0
    return zeroWidth(code) || (within(covered, code) && !within(wide, code))
}

export const segments = (text: string): Segment[] => {
    const out: Segment[] = []
    let run = ""
    for (const char of text) {
        if (onGrid(char)) {
            run += char
            continue
        }
        if (run) out.push({ text: run })
        run = ""
        out.push({ text: char, cells: charCells(char) })
    }
    if (run) out.push({ text: run })
    return out
}

/** End ellipsis for single-line previews; whitespace runs fold to one space first. */
export const ellipsize = (text: string, cells: number) => {
    const line = text.replace(/\s+/g, " ")
    if (width(line) <= cells) return line
    if (cells <= 0) return ""
    let out = ""
    let used = 0
    for (const char of line) {
        const next = charCells(char)
        if (used + next > cells - 1) break
        out += char
        used += next
    }
    return `${out.trimEnd()}…`
}

/** Middle ellipsis, for paths and names whose end matters (OpenTUI's `truncate`). */
export const ellipsizeMiddle = (text: string, cells: number) => {
    const line = text.replace(/\s+/g, " ")
    if (width(line) <= cells) return line
    if (cells <= 1) return cells === 1 ? "…" : ""
    const chars = [...line]
    const keep = cells - 1
    const head = chars.slice(0, Math.ceil(keep / 2)).join("")
    const tail = chars.slice(chars.length - Math.floor(keep / 2)).join("")
    return `${head}…${tail}`
}

/** A title and its dimmed subtitle on one row: the title takes at most 60%, like the TUI row. */
export const fitRow = (title: string, subtitle: string, cells: number, gap = 2) => {
    const fittedTitle = ellipsize(
        title,
        Math.max(Math.floor(cells * 0.6), cells - gap - width(subtitle))
    )
    const room = cells - width(fittedTitle) - gap
    return { title: fittedTitle, subtitle: room > 1 ? ellipsize(subtitle, room) : "" }
}

/** Pads with spaces to `cells` cells, counting wide characters as two. */
export const padEnd = (text: string, cells: number) =>
    text + " ".repeat(Math.max(0, cells - width(text)))

export const padStart = (text: string, cells: number) =>
    " ".repeat(Math.max(0, cells - width(text))) + text

/**
 * The rows `text` takes when word-wrapped to `cells`, as `wrapMode="word"` lays it out: lines
 * break at newlines and between words, spaces hang at a line's end, and a word longer than a row
 * breaks anywhere.
 */
export const wrappedRows = (text: string, cells: number): number => {
    if (cells <= 0) return 0
    return text.split("\n").reduce((total, line) => {
        let rows = 1
        let used = 0
        for (const token of line.split(/(\s+)/).filter(Boolean)) {
            const size = width(token)
            if (/^\s+$/.test(token)) {
                used = Math.min(cells, used + size)
                continue
            }
            if (used > 0 && used + size > cells) {
                rows++
                used = 0
            }
            rows += Math.floor((used + size - 1) / cells)
            used = ((used + size - 1) % cells) + 1
        }
        return total + rows
    }, 0)
}

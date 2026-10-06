/**
 * End ellipsis for single-line previews. OpenTUI's own `truncate` elides the middle and has no
 * option for the end, so rows measure their width and trim here instead. Widths are terminal cells,
 * so wide characters count double.
 */
export const width = (text: string) => Bun.stringWidth(text)

export const ellipsize = (text: string, cells: number) => {
    const line = text.replace(/\s+/g, " ")
    if (width(line) <= cells) return line
    if (cells <= 0) return ""
    let out = ""
    for (const char of line) {
        if (width(out + char) > cells - 1) break
        out += char
    }
    return `${out.trimEnd()}…`
}

/** A title and its dimmed subtitle on one row: the title takes at most 60%, like the web row. */
export const fitRow = (title: string, subtitle: string, cells: number, gap = 2) => {
    const fittedTitle = ellipsize(
        title,
        Math.max(Math.floor(cells * 0.6), cells - gap - width(subtitle))
    )
    const room = cells - width(fittedTitle) - gap
    return { title: fittedTitle, subtitle: room > 1 ? ellipsize(subtitle, room) : "" }
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** Compact age for list accessories: now, 5m, 3h, 2d, then a date. */
export const formatAge = (at: number, now = Date.now()) => {
    const age = now - at
    if (age < MINUTE) return "now"
    if (age < HOUR) return `${Math.floor(age / MINUTE)}m`
    if (age < DAY) return `${Math.floor(age / HOUR)}h`
    if (age < 30 * DAY) return `${Math.floor(age / DAY)}d`
    return new Date(at).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

const dateTime = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
})

/**
 * "Oct 7, 2026, 03:57 PM", assembled from the parts so every engine shows the same text: Safari
 * and Chrome join the locale's parts differently ("at" against a comma), which would change the
 * inspector's widths between them (D176).
 */
export const formatDateTime = (at: number) => {
    const part = Object.fromEntries(dateTime.formatToParts(at).map(p => [p.type, p.value]))
    const time = `${part.hour}:${part.minute}${part.dayPeriod ? ` ${part.dayPeriod}` : ""}`
    return `${part.month} ${part.day}, ${part.year}, ${time}`
}

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

export const formatDateTime = (at: number) =>
    new Date(at).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    })

/**
 * Cursor and multi-selection over an ordered list of ids, as pure state transitions.
 *
 * Two ways to extend with Shift-arrows (config `selection.extend`):
 * - drag (the Raycast extension's): repeat the last action, select or deselect, on the row you
 *   leave and the row you enter, so you paint as you move.
 * - range (Finder's): select from an anchor to the cursor, on top of what was selected before.
 * And one fill: select or deselect everything between the last row you toggled and the cursor
 * (the extension's "Select Gap").
 */
export type ListState = {
    cursor: string | null
    /** range mode: where the shift-extend began, and the selection as it stood then. */
    anchor: string | null
    base: string[]
    selected: string[]
    /** The last row toggled or dragged over, and whether that selected or deselected it. */
    last: string | null
    action: "select" | "deselect"
}

export const emptyList: ListState = {
    cursor: null,
    anchor: null,
    base: [],
    selected: [],
    last: null,
    action: "select"
}

const clamp = (value: number, max: number) => Math.max(0, Math.min(max, value))
const ordered = (ids: string[], set: Set<string>) => ids.filter(id => set.has(id))

/** Keeps the cursor on the same id, or on the same index when its id disappeared. */
export const sync = (state: ListState, ids: string[], previousIndex: number): ListState => {
    const selected = state.selected.filter(id => ids.includes(id))
    const kept = state.cursor !== null && ids.includes(state.cursor)
    const cursor = kept ? state.cursor : (ids[clamp(previousIndex, ids.length - 1)] ?? null)
    if (cursor === state.cursor && selected.length === state.selected.length) return state
    return { ...state, cursor, anchor: kept ? state.anchor : null, base: [], selected }
}

export const moveTo = (state: ListState, ids: string[], index: number): ListState => ({
    ...state,
    cursor: ids[clamp(index, ids.length - 1)] ?? null,
    anchor: null
})

export const move = (state: ListState, ids: string[], delta: number) =>
    moveTo(state, ids, indexOf(state, ids) + delta)

export const toggle = (state: ListState, ids: string[]): ListState => {
    const { cursor } = state
    if (cursor === null) return state
    const on = state.selected.includes(cursor)
    const selected = ids.filter(id => (id === cursor ? !on : state.selected.includes(id)))
    return {
        ...state,
        anchor: null,
        base: [],
        selected,
        last: cursor,
        action: on ? "deselect" : "select"
    }
}

export const extend = (
    state: ListState,
    ids: string[],
    delta: number,
    mode: "drag" | "range"
): ListState => {
    const from = indexOf(state, ids)
    if (from < 0) return state
    const to = clamp(from + delta, ids.length - 1)
    const target = ids[to] ?? null
    if (mode === "drag") {
        const set = new Set(state.selected)
        for (const id of [state.cursor, target])
            if (id) state.action === "select" ? set.add(id) : set.delete(id)
        return { ...state, cursor: target, anchor: null, selected: ordered(ids, set), last: target }
    }
    const anchor = state.anchor ?? state.cursor
    const base = state.anchor ? state.base : state.selected
    const start = ids.indexOf(anchor ?? "")
    const range = ids.slice(Math.min(start, to), Math.max(start, to) + 1)
    return {
        ...state,
        cursor: target,
        anchor,
        base,
        selected: ids.filter(id => base.includes(id) || range.includes(id))
    }
}

/**
 * Everything between the last toggled row (or the first row) and the cursor: selected when none
 * were, deselected when all were, otherwise made consistent with the last action.
 */
export const fillGap = (state: ListState, ids: string[]): ListState => {
    const from = ids.indexOf(state.last ?? ids[0] ?? "")
    const to = indexOf(state, ids)
    if (from < 0 || to < 0) return state
    const range = ids.slice(Math.min(from, to), Math.max(from, to) + 1)
    const set = new Set(state.selected)
    const all = range.every(id => set.has(id))
    const none = range.every(id => !set.has(id))
    const action = all ? "deselect" : none ? "select" : state.action
    for (const id of range) action === "select" ? set.add(id) : set.delete(id)
    return { ...state, anchor: null, base: [], selected: ordered(ids, set), action }
}

export const selectAll = (state: ListState, ids: string[]): ListState => ({
    ...state,
    anchor: null,
    base: [],
    selected: [...ids],
    action: "select"
})

export const clear = (state: ListState): ListState => ({
    ...state,
    anchor: null,
    base: [],
    selected: [],
    action: "select"
})

/** What an action applies to: the selection when there is one, otherwise the cursor row. */
export const targets = (state: ListState) =>
    state.selected.length ? state.selected : state.cursor ? [state.cursor] : []

export const indexOf = (state: ListState, ids: string[]) =>
    state.cursor === null ? -1 : ids.indexOf(state.cursor)

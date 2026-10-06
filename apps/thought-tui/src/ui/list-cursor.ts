/**
 * Cursor and multi-selection over an ordered list of ids, as pure state transitions. `base` is the
 * selection as it stood when a shift-extend began, so extending adds a range to it rather than
 * replacing it, the way Shift-arrows work in Finder and Raycast.
 */
export type ListState = {
    cursor: string | null
    anchor: string | null
    base: string[]
    selected: string[]
}

export const emptyList: ListState = { cursor: null, anchor: null, base: [], selected: [] }

const clamp = (value: number, max: number) => Math.max(0, Math.min(max, value))

/** Keeps the cursor on the same id, or on the same index when its id disappeared. */
export const sync = (state: ListState, ids: string[], previousIndex: number): ListState => {
    const selected = state.selected.filter(id => ids.includes(id))
    const kept = state.cursor !== null && ids.includes(state.cursor)
    const cursor = kept ? state.cursor : (ids[clamp(previousIndex, ids.length - 1)] ?? null)
    if (cursor === state.cursor && selected.length === state.selected.length) return state
    return { cursor, anchor: kept ? state.anchor : null, base: [], selected }
}

export const moveTo = (state: ListState, ids: string[], index: number): ListState => ({
    ...state,
    cursor: ids[clamp(index, ids.length - 1)] ?? null,
    anchor: null
})

export const move = (state: ListState, ids: string[], delta: number) =>
    moveTo(state, ids, indexOf(state, ids) + delta)

export const extend = (state: ListState, ids: string[], delta: number): ListState => {
    const from = indexOf(state, ids)
    if (from < 0) return state
    const anchor = state.anchor ?? state.cursor
    const base = state.anchor ? state.base : state.selected
    const to = clamp(from + delta, ids.length - 1)
    const start = ids.indexOf(anchor ?? "")
    const range = ids.slice(Math.min(start, to), Math.max(start, to) + 1)
    return {
        cursor: ids[to] ?? null,
        anchor,
        base,
        selected: ids.filter(id => base.includes(id) || range.includes(id))
    }
}

export const toggle = (state: ListState, ids: string[]): ListState => {
    const { cursor } = state
    if (cursor === null) return state
    const on = state.selected.includes(cursor)
    const selected = ids.filter(id => (id === cursor ? !on : state.selected.includes(id)))
    return { ...state, anchor: null, base: [], selected }
}

export const selectAll = (state: ListState, ids: string[]): ListState => ({
    ...state,
    anchor: null,
    base: [],
    selected: [...ids]
})

export const clear = (state: ListState): ListState => ({
    ...state,
    anchor: null,
    base: [],
    selected: []
})

/** What an action applies to: the selection when there is one, otherwise the cursor row. */
export const targets = (state: ListState) =>
    state.selected.length ? state.selected : state.cursor ? [state.cursor] : []

export const indexOf = (state: ListState, ids: string[]) =>
    state.cursor === null ? -1 : ids.indexOf(state.cursor)

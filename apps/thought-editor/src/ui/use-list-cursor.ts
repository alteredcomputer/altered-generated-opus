import { useState } from "react"

/**
 * Cursor and multi-selection for a keyboard list. Arrows and Tab move, Shift-arrows extend a
 * range from an anchor (as in Finder), Cmd-arrows jump to the ends. Ids that leave the list (a
 * delete, a filter) simply stop counting, with no effect to keep in sync.
 */
export const useListCursor = (ids: string[]) => {
    const [cursorId, setCursorId] = useState<string | null>(null)
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [anchorId, setAnchorId] = useState<string | null>(null)

    const cursor = cursorId && ids.includes(cursorId) ? cursorId : (ids[0] ?? null)
    const selected = selectedIds.filter(id => ids.includes(id))

    const clearSelection = () => {
        setSelectedIds([])
        setAnchorId(null)
    }

    const selectRange = (fromId: string, toId: string) => {
        const [a, b] = [ids.indexOf(fromId), ids.indexOf(toId)].sort((x, y) => x - y)
        setSelectedIds(ids.slice(a, (b ?? 0) + 1))
    }

    const moveTo = (index: number, extend: boolean) => {
        const next = ids[Math.max(0, Math.min(ids.length - 1, index))]
        if (!next) return

        if (extend && cursor) {
            const anchor = anchorId && ids.includes(anchorId) ? anchorId : cursor
            setAnchorId(anchor)
            selectRange(anchor, next)
        } else if (!extend) clearSelection()

        setCursorId(next)
    }

    const handleKey = (event: KeyboardEvent) => {
        const index = cursor ? ids.indexOf(cursor) : -1
        const arrow = event.key === "ArrowDown" || event.key === "ArrowUp"
        const down = event.key === "ArrowDown" || (event.key === "Tab" && !event.shiftKey)
        const up = event.key === "ArrowUp" || (event.key === "Tab" && event.shiftKey)
        if ((!down && !up) || event.ctrlKey || event.altKey) return false

        if (arrow && event.metaKey) moveTo(down ? ids.length - 1 : 0, false)
        else moveTo(index + (down ? 1 : -1), arrow && event.shiftKey)
        return true
    }

    const click = (
        id: string,
        event: { shiftKey: boolean; metaKey: boolean; ctrlKey: boolean }
    ) => {
        if (event.shiftKey && cursor) {
            setAnchorId(anchorId ?? cursor)
            selectRange(anchorId ?? cursor, id)
        } else if (event.metaKey || event.ctrlKey) {
            const base = selected.length ? selected : cursor ? [cursor] : []
            setSelectedIds(base.includes(id) ? base.filter(x => x !== id) : [...base, id])
        } else clearSelection()
        setCursorId(id)
    }

    return {
        cursor,
        selected,
        /** What an action applies to: the selection if there is one, otherwise the cursor row. */
        targets: selected.length ? selected : cursor ? [cursor] : [],
        setCursor: setCursorId,
        step: (delta: number) => moveTo((cursor ? ids.indexOf(cursor) : -1) + delta, false),
        selectAll: () => setSelectedIds(ids),
        clearSelection,
        handleKey,
        click
    }
}

import { describe, expect, test } from "bun:test"
import {
    clear,
    emptyList,
    extend,
    type ListState,
    move,
    selectAll,
    sync,
    targets,
    toggle
} from "./list-cursor.ts"

const ids = ["a", "b", "c", "d", "e"]
const at = (cursor: string): ListState => ({ ...emptyList, cursor })

describe("list cursor", () => {
    test("moves and clamps at both ends", () => {
        expect(move(at("a"), ids, -1).cursor).toBe("a")
        expect(move(at("a"), ids, 2).cursor).toBe("c")
        expect(move(at("d"), ids, 10).cursor).toBe("e")
    })

    test("sync keeps the cursor id, or falls back to the same index", () => {
        expect(sync(at("c"), ["c", "a"], 2).cursor).toBe("c")
        expect(sync(at("c"), ["a", "b", "d"], 2).cursor).toBe("d")
        expect(sync(at("e"), ["a", "b"], 4).cursor).toBe("b")
        expect(sync(emptyList, ids, 0).cursor).toBe("a")
        expect(sync(at("a"), [], 0).cursor).toBeNull()
    })

    test("sync drops selected ids that left the list", () => {
        const state = { ...at("a"), selected: ["a", "c"] }
        expect(sync(state, ["a", "b"], 0).selected).toEqual(["a"])
    })

    test("extend selects a range from the anchor, in both directions", () => {
        const down = extend(extend(at("b"), ids, 1), ids, 1)
        expect(down.selected).toEqual(["b", "c", "d"])
        expect(down.cursor).toBe("d")
        expect(extend(down, ids, -3).selected).toEqual(["a", "b"])
    })

    test("extend adds to an earlier selection instead of replacing it", () => {
        const toggled = toggle(at("a"), ids)
        const moved = move(move(toggled, ids, 1), ids, 1)
        expect(extend(moved, ids, 1).selected).toEqual(["a", "c", "d"])
    })

    test("toggle, select all, and clear", () => {
        const one = toggle(at("b"), ids)
        expect(one.selected).toEqual(["b"])
        expect(toggle(one, ids).selected).toEqual([])
        expect(selectAll(one, ids).selected).toEqual(ids)
        expect(clear(selectAll(one, ids)).selected).toEqual([])
    })

    test("targets are the selection, or the cursor row", () => {
        expect(targets(at("c"))).toEqual(["c"])
        expect(targets({ ...at("c"), selected: ["a", "b"] })).toEqual(["a", "b"])
        expect(targets(emptyList)).toEqual([])
    })
})

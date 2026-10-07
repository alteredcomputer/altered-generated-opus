import { describe, expect, test } from "vitest"
import {
    clear,
    emptyList,
    extend,
    fillGap,
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
        expect(move(at("d"), ids, 10).cursor).toBe("e")
    })

    test("sync keeps the cursor id, or falls back to the same index", () => {
        expect(sync(at("c"), ["c", "a"], 2).cursor).toBe("c")
        expect(sync(at("c"), ["a", "b", "d"], 2).cursor).toBe("d")
        expect(sync(emptyList, ids, 0).cursor).toBe("a")
        expect(sync(at("a"), [], 0).cursor).toBeNull()
    })

    test("toggle, select all, and clear", () => {
        const one = toggle(at("b"), ids)
        expect(one.selected).toEqual(["b"])
        expect(toggle(one, ids)).toMatchObject({ selected: [], action: "deselect" })
        expect(clear(selectAll(one, ids)).selected).toEqual([])
    })

    test("targets are the selection, or the cursor row", () => {
        expect(targets(at("c"))).toEqual(["c"])
        expect(targets({ ...at("c"), selected: ["a", "b"] })).toEqual(["a", "b"])
    })
})

describe("range extend", () => {
    test("selects from the anchor, shrinking when reversed", () => {
        const down = extend(extend(at("b"), ids, 1, "range"), ids, 1, "range")
        expect(down.selected).toEqual(["b", "c", "d"])
        expect(extend(down, ids, -3, "range").selected).toEqual(["a", "b"])
    })

    test("adds to an earlier selection", () => {
        const moved = move(move(toggle(at("a"), ids), ids, 1), ids, 1)
        expect(extend(moved, ids, 1, "range").selected).toEqual(["a", "c", "d"])
    })
})

describe("drag extend", () => {
    test("paints the last action onto the rows it passes", () => {
        const start = toggle(at("b"), ids)
        expect(extend(extend(start, ids, 1, "drag"), ids, 1, "drag").selected).toEqual([
            "b",
            "c",
            "d"
        ])
    })

    test("after a deselect it erases instead", () => {
        const all = toggle(selectAll(at("b"), ids), ids)
        expect(extend(all, ids, 1, "drag").selected).toEqual(["a", "d", "e"])
    })

    test("does not shrink when reversed: it keeps painting", () => {
        const down = extend(toggle(at("b"), ids), ids, 1, "drag")
        expect(extend(down, ids, -1, "drag").selected).toEqual(["b", "c"])
    })
})

describe("fill gap", () => {
    test("selects everything between the last toggle and the cursor", () => {
        const state = move(move(toggle(at("a"), ids), ids, 1), ids, 2)
        expect(fillGap(state, ids).selected).toEqual(["a", "b", "c", "d"])
    })

    test("deselects the range when all of it was selected", () => {
        const state = { ...selectAll(at("d"), ids), last: "b" }
        expect(fillGap(state, ids).selected).toEqual(["a", "e"])
    })

    test("with nothing toggled it fills from the first row", () => {
        expect(fillGap(at("c"), ids).selected).toEqual(["a", "b", "c"])
    })
})

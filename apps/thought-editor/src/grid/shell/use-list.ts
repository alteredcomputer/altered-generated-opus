import { useRef, useState } from "react"
import type { Config } from "../config/schema.ts"
import type { HelpEntry } from "./frame.tsx"
import type { KeyHandler } from "./keyboard.ts"
import { host, label, matches, type Shortcut } from "./keys.ts"
import {
    clear,
    emptyList,
    extend,
    fillGap,
    indexOf,
    type ListState,
    move,
    moveTo,
    selectAll,
    sync,
    targets,
    toggle
} from "./list-cursor.ts"

const PAGE = 10

type Binding = {
    title: string
    keys: Shortcut[]
    apply: (state: ListState, ids: string[], mode: Config["selection"]["extend"]) => ListState
}

const bindings: Binding[] = [
    {
        title: "Move Down",
        keys: [{ key: "down" }, { key: "tab" }],
        apply: (s, ids) => move(s, ids, 1)
    },
    {
        title: "Move Up",
        keys: [{ key: "up" }, { key: "tab", shift: true }],
        apply: (s, ids) => move(s, ids, -1)
    },
    { title: "Page Down", keys: [{ key: "pagedown" }], apply: (s, ids) => move(s, ids, PAGE) },
    { title: "Page Up", keys: [{ key: "pageup" }], apply: (s, ids) => move(s, ids, -PAGE) },
    { title: "Jump to Top", keys: [{ key: "home" }], apply: (s, ids) => moveTo(s, ids, 0) },
    {
        title: "Jump to Bottom",
        keys: [{ key: "end" }],
        apply: (s, ids) => moveTo(s, ids, ids.length - 1)
    },
    {
        title: "Extend Selection Down",
        keys: [{ key: "down", shift: true }],
        apply: (s, ids, mode) => extend(s, ids, 1, mode)
    },
    {
        title: "Extend Selection Up",
        keys: [{ key: "up", shift: true }],
        apply: (s, ids, mode) => extend(s, ids, -1, mode)
    }
]

export const listHelp = (glyphs: Config["glyphs"]): HelpEntry[] =>
    bindings.map(b => ({
        title: b.title,
        hint: b.keys.map(key => label(key, glyphs, host)).join(" "),
        section: "Navigate"
    }))

/** Cursor and selection keys over a list of ids, on the pure transitions in list-cursor.ts. */
export function useList(ids: string[], mode: Config["selection"]["extend"]) {
    const [stored, setState] = useState(emptyList)
    const lastIndex = useRef(0)
    const state = sync(stored, ids, lastIndex.current)
    if (state !== stored) setState(state)
    lastIndex.current = Math.max(0, indexOf(state, ids))

    const handleKey: KeyHandler = key => {
        const binding = bindings.find(b => b.keys.some(shortcut => matches(key, shortcut, host)))
        if (binding) setState(binding.apply(state, ids, mode))
        return binding !== undefined
    }

    return {
        cursor: state.cursor,
        selected: state.selected,
        targets: targets(state),
        handleKey,
        // By id, not index: a caller may name a row that appears only on the next render (a thought
        // just created), and sync places it then.
        setCursor: (id: string) => setState(current => ({ ...current, cursor: id, anchor: null })),
        toggle: (id?: string) =>
            setState(current => toggle(id ? { ...current, cursor: id } : current, ids)),
        fillGap: () => setState(fillGap(state, ids)),
        selectAll: () => setState(selectAll(state, ids)),
        clearSelection: () => setState(clear(state))
    }
}

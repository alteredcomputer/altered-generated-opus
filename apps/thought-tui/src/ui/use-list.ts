import { useRef, useState } from "react"
import type { HelpEntry } from "../shell/frame.tsx"
import type { KeyHandler } from "../shell/keyboard.ts"
import { label, matches, type Shortcut } from "./keys.ts"
import {
    clear,
    emptyList,
    extend,
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
    apply: (state: ListState, ids: string[]) => ListState
}

const bindings: Binding[] = [
    {
        title: "Move Down",
        keys: [{ key: "j" }, { key: "down" }],
        apply: (s, ids) => move(s, ids, 1)
    },
    { title: "Move Up", keys: [{ key: "k" }, { key: "up" }], apply: (s, ids) => move(s, ids, -1) },
    { title: "Jump to Top", keys: [{ key: "g" }], apply: (s, ids) => moveTo(s, ids, 0) },
    {
        title: "Jump to Bottom",
        keys: [{ key: "G" }],
        apply: (s, ids) => moveTo(s, ids, ids.length - 1)
    },
    {
        title: "Half Page Down",
        keys: [{ key: "d", ctrl: true }],
        apply: (s, ids) => move(s, ids, PAGE)
    },
    {
        title: "Half Page Up",
        keys: [{ key: "u", ctrl: true }],
        apply: (s, ids) => move(s, ids, -PAGE)
    },
    { title: "Toggle Selection", keys: [{ key: "v" }], apply: toggle },
    {
        title: "Extend Selection Down",
        keys: [{ key: "J" }, { key: "down", shift: true }],
        apply: (s, ids) => extend(s, ids, 1)
    },
    {
        title: "Extend Selection Up",
        keys: [{ key: "K" }, { key: "up", shift: true }],
        apply: (s, ids) => extend(s, ids, -1)
    }
]

export const listHelp: HelpEntry[] = bindings.map(b => ({
    title: b.title,
    hint: b.keys.map(label).join(" ")
}))

/** Vim-style cursor and selection keys over a list of ids, on the pure transitions. */
export function useList(ids: string[]) {
    const [stored, setState] = useState(emptyList)
    const lastIndex = useRef(0)
    const state = sync(stored, ids, lastIndex.current)
    if (state !== stored) setState(state)
    lastIndex.current = Math.max(0, indexOf(state, ids))

    const handleKey: KeyHandler = event => {
        const binding = bindings.find(b => b.keys.some(key => matches(event, key)))
        if (binding) setState(binding.apply(state, ids))
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
        selectAll: () => setState(selectAll(state, ids)),
        clearSelection: () => setState(clear(state))
    }
}

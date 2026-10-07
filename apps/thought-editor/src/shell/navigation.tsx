import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react"
import { type Route, type SavedEntry, saveStack } from "./restore.ts"

type Navigation = {
    /** A route makes the view restorable after a relaunch; leave it out for views with callbacks. */
    push: (view: ReactNode, route?: Route) => void
    pop: () => void
    depth: number
}

/** What one stack entry remembers across relaunches (cursor, selection, scroll, search). */
type ViewMemory = {
    recall: <T>(name: string, valid: (value: unknown) => value is T) => T | undefined
    remember: (name: string, value: unknown) => void
}

type Entry = { key: number; view: ReactNode; route?: Route; state: Record<string, unknown> }

export type InitialEntry = { view: ReactNode; route?: Route; state?: Record<string, unknown> }

const NavigationContext = createContext<Navigation | null>(null)
const ActiveContext = createContext(false)
const MemoryContext = createContext<ViewMemory | null>(null)

/** The saved stack is the run of entries from the bottom that all have a route. */
const restorable = (stack: Entry[]): SavedEntry[] => {
    const end = stack.findIndex(entry => !entry.route)
    return stack
        .slice(0, end === -1 ? stack.length : end)
        .map(entry => ({ route: entry.route as Route, state: entry.state }))
}

/**
 * A Raycast-style view stack. Every entry stays mounted and only the top one is shown, so popping
 * back to a list restores its search, cursor, and scroll position instantly. The stack and each
 * entry's remembered state are also saved, so a relaunch lands on the same screen.
 */
export function NavigationStack({ initial }: { initial: InitialEntry[] }) {
    const nextKey = useRef(initial.length)
    const [stack, setStack] = useState<Entry[]>(() =>
        initial.map((entry, key) => ({ ...entry, key, state: entry.state ?? {} }))
    )
    const stackRef = useRef(stack)
    stackRef.current = stack

    //  Many entries remember at once on mount; one write per tick covers them all.
    const pending = useRef(false)
    const save = useCallback(() => {
        if (pending.current) return
        pending.current = true
        queueMicrotask(() => {
            pending.current = false
            saveStack(restorable(stackRef.current))
        })
    }, [])

    useEffect(() => saveStack(restorable(stack)), [stack])

    const navigation = useMemo<Navigation>(
        () => ({
            push: (view, route) =>
                setStack(current => [
                    ...current,
                    { key: nextKey.current++, view, ...(route && { route }), state: {} }
                ]),
            pop: () => setStack(current => (current.length > 1 ? current.slice(0, -1) : current)),
            depth: stack.length
        }),
        [stack.length]
    )

    return (
        <NavigationContext value={navigation}>
            {stack.map((entry, index) => (
                <EntryScope
                    key={entry.key}
                    entry={entry}
                    active={index === stack.length - 1}
                    save={save}
                />
            ))}
        </NavigationContext>
    )
}

function EntryScope({ entry, active, save }: { entry: Entry; active: boolean; save: () => void }) {
    const { state } = entry
    const memory = useMemo<ViewMemory>(
        () => ({
            recall: (name, valid) => {
                const value = state[name]
                return valid(value) ? value : undefined
            },
            remember: (name, value) => {
                state[name] = value
                save()
            }
        }),
        [state, save]
    )

    return (
        <MemoryContext value={memory}>
            <ActiveContext value={active}>
                <div className="view" hidden={!active}>
                    {entry.view}
                </div>
            </ActiveContext>
        </MemoryContext>
    )
}

export const useNavigation = () => {
    const navigation = useContext(NavigationContext)
    if (!navigation) throw new Error("useNavigation must be used inside NavigationStack.")
    return navigation
}

export const useIsActiveView = () => useContext(ActiveContext)

/** The current entry's memory, for values that change too often for React state (scroll). */
export const useViewMemory = () => useContext(MemoryContext)

/**
 * `useState` that the current stack entry remembers across relaunches. A saved value that fails
 * `valid` (an older shape) is ignored in favour of `fallback`.
 */
export const useViewState = <T,>(
    name: string,
    fallback: T,
    valid: (value: unknown) => value is T
) => {
    const memory = useViewMemory()
    const [value, setValue] = useState<T>(() => {
        const saved = memory?.recall(name, valid)
        return saved === undefined ? fallback : saved
    })

    useEffect(() => {
        memory?.remember(name, value)
    }, [memory, name, value])

    return [value, setValue] as const
}

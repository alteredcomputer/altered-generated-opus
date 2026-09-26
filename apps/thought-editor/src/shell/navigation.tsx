import { createContext, type ReactNode, useContext, useMemo, useRef, useState } from "react"

type Navigation = {
    push: (view: ReactNode) => void
    pop: () => void
    depth: number
}

const NavigationContext = createContext<Navigation | null>(null)
const ActiveContext = createContext(false)

/**
 * A Raycast-style view stack. Every entry stays mounted and only the top one is shown, so popping
 * back to a list restores its search, cursor, and scroll position instantly.
 */
export function NavigationStack({ initial }: { initial: ReactNode[] }) {
    const nextKey = useRef(initial.length)
    const [stack, setStack] = useState(() => initial.map((view, key) => ({ key, view })))

    const navigation = useMemo<Navigation>(
        () => ({
            push: view => setStack(current => [...current, { key: nextKey.current++, view }]),
            pop: () => setStack(current => (current.length > 1 ? current.slice(0, -1) : current)),
            depth: stack.length
        }),
        [stack.length]
    )

    return (
        <NavigationContext value={navigation}>
            {stack.map((entry, index) => {
                const active = index === stack.length - 1
                return (
                    <ActiveContext key={entry.key} value={active}>
                        <div className="view" hidden={!active}>
                            {entry.view}
                        </div>
                    </ActiveContext>
                )
            })}
        </NavigationContext>
    )
}

export const useNavigation = () => {
    const navigation = useContext(NavigationContext)
    if (!navigation) throw new Error("useNavigation must be used inside NavigationStack.")
    return navigation
}

export const useIsActiveView = () => useContext(ActiveContext)

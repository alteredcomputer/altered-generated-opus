import { createContext, type ReactNode, useContext, useMemo, useState } from "react"
import { Box } from "../ui/index.ts"

type Navigation = { push: (view: ReactNode) => void; pop: () => void; depth: number }

const NavigationContext = createContext<Navigation | null>(null)

/**
 * A Raycast-style view stack. Covered views stay mounted but hidden, so popping back restores
 * their cursor, query, and selection exactly.
 */
export function Navigator({ root }: { root: ReactNode }) {
    const [stack, setStack] = useState<ReactNode[]>([root])

    const actions = useMemo(
        () => ({
            push: (view: ReactNode) => setStack(current => [...current, view]),
            pop: () => setStack(current => (current.length > 1 ? current.slice(0, -1) : current))
        }),
        []
    )

    return stack.map((view, depth) => (
        <NavigationContext
            // biome-ignore lint/suspicious/noArrayIndexKey: a stack entry's depth is its identity.
            key={depth}
            value={{ ...actions, depth }}
        >
            <Box flexGrow={1} visible={depth === stack.length - 1}>
                {view}
            </Box>
        </NavigationContext>
    ))
}

export const useNavigation = () => {
    const navigation = useContext(NavigationContext)
    if (!navigation) throw new Error("useNavigation must be used inside Navigator.")
    return navigation
}

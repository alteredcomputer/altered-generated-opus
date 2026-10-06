import { createContext, type ReactNode, useContext, useMemo, useRef, useState } from "react"
import { log } from "../observability/log.ts"
import type { Dataset, Schema, Snapshot } from "./model.ts"
import { seed } from "./seed.ts"

type Store = Snapshot & {
    datasetById: Map<string, Dataset>
    schemaById: Map<string, Schema>
    /** Applies a pure write. Throws its error back to the caller, which reports it. */
    write: (name: string, change: (snapshot: Snapshot) => Snapshot) => void
    reset: () => void
}

const StoreContext = createContext<Store | null>(null)

/** The demo's whole database: one snapshot in React state, seeded fresh on every launch. */
export function StoreProvider({ children }: { children: ReactNode }) {
    const [snapshot, setSnapshot] = useState(() => seed())
    // Writes read the latest snapshot, not the render's, so two writes in one tick both land.
    const latest = useRef(snapshot)

    const store = useMemo<Store>(() => {
        const commit = (next: Snapshot) => {
            latest.current = next
            setSnapshot(next)
        }
        return {
            ...snapshot,
            datasetById: new Map(snapshot.datasets.map(d => [d.id, d])),
            schemaById: new Map(snapshot.schemas.map(s => [s.id, s])),
            write: (name, change) => {
                const next = change(latest.current)
                log("info", "write", { name, thoughts: next.thoughts.length })
                commit(next)
            },
            reset: () => {
                log("info", "write", { name: "reset" })
                commit(seed())
            }
        }
    }, [snapshot])

    return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export const useStore = () => {
    const store = useContext(StoreContext)
    if (!store) throw new Error("useStore must be used inside StoreProvider.")
    return store
}

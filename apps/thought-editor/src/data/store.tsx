import { useLiveQuery } from "dexie-react-hooks"
import { createContext, type ReactNode, useContext, useMemo } from "react"
import { db } from "./db.ts"
import type { Dataset, Schema, Snapshot } from "./model.ts"

export type Store = Snapshot & {
    datasetById: Map<string, Dataset>
    schemaById: Map<string, Schema>
}

const StoreContext = createContext<Store | null>(null)

const readSnapshot = async (): Promise<Snapshot> => {
    const [thoughts, datasets, schemas] = await Promise.all([
        db.thoughts.orderBy("createdAt").reverse().toArray(),
        db.datasets.orderBy("alias").toArray(),
        db.schemas.orderBy("datasetId").toArray()
    ])
    return { thoughts, datasets, schemas }
}

/**
 * @remarks
 * One live query over every table. Dexie re-runs it after any write, so views never refetch or
 * patch caches by hand. Nothing renders until the first read from disk, which takes milliseconds,
 * so the first paint is already the real data.
 */
export function StoreProvider({ children }: { children: ReactNode }) {
    const snapshot = useLiveQuery(readSnapshot)

    const store = useMemo<Store | null>(
        () =>
            snapshot
                ? {
                      ...snapshot,
                      datasetById: new Map(snapshot.datasets.map(d => [d.id, d])),
                      schemaById: new Map(snapshot.schemas.map(s => [s.id, s]))
                  }
                : null,
        [snapshot]
    )

    if (!store) return null
    return <StoreContext value={store}>{children}</StoreContext>
}

export const useStore = () => {
    const store = useContext(StoreContext)
    if (!store) throw new Error("useStore must be used inside StoreProvider.")
    return store
}

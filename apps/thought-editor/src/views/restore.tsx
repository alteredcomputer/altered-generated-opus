import { type ReactNode, useState } from "react"
import { type Store, useStore } from "../data/store.tsx"
import { log } from "../observability/log.ts"
import { type InitialEntry, NavigationStack } from "../shell/navigation.tsx"
import { isString, isStringArray, isStringOrNull, loadStack, type Route } from "../shell/restore.ts"
import { DatasetForm } from "./datasets/form.tsx"
import { DatasetsList } from "./datasets/list.tsx"
import { Root } from "./root.tsx"
import { route } from "./route.ts"
import { ThoughtForm } from "./thoughts/form.tsx"
import { ThoughtsList } from "./thoughts/list.tsx"

/** Opens straight into the thoughts list; Escape goes back to the command root. */
const defaultStack = (): InitialEntry[] => [
    { view: <Root />, route: route.root() },
    { view: <ThoughtsList />, route: route.thoughts(null) }
]

/** Rebuilds a saved screen, or null when it no longer can be (its thought was deleted). */
const viewFor = (saved: Route, store: Store): ReactNode | null => {
    switch (saved.view) {
        case "root":
            return <Root />
        case "thoughts":
            return isStringOrNull(saved.datasetId) ? (
                <ThoughtsList datasetId={saved.datasetId} />
            ) : null
        case "thought-form": {
            if (saved.thoughtId === null)
                return isStringArray(saved.datasetIds) ? (
                    <ThoughtForm datasetIds={saved.datasetIds} />
                ) : null
            const thought = store.thoughts.find(t => t.id === saved.thoughtId)
            return thought ? <ThoughtForm thought={thought} /> : null
        }
        case "datasets":
            return <DatasetsList />
        case "dataset-form": {
            if (saved.datasetId === null) return <DatasetForm />
            const dataset = isString(saved.datasetId) && store.datasetById.get(saved.datasetId)
            return dataset ? <DatasetForm dataset={dataset} /> : null
        }
        default:
            return null
    }
}

const restoreStack = (store: Store): InitialEntry[] => {
    const saved = loadStack()
    const entries: InitialEntry[] = []
    for (const { route: savedRoute, state } of saved) {
        const view = viewFor(savedRoute, store)
        if (!view) break
        entries.push({ view, route: savedRoute, state })
    }
    if (entries.length < saved.length)
        log("info", "restored part of the saved view stack", {
            saved: saved.length,
            restored: entries.length
        })
    return entries.length ? entries : defaultStack()
}

/**
 * The navigation stack as it was when the app last ran, so a relaunch after iOS reclaimed the
 * web view lands on the same screen with the same cursor, selection, search, and scroll.
 */
export function RestoredStack() {
    const store = useStore()
    const [initial] = useState(() => restoreStack(store))
    return <NavigationStack initial={initial} />
}

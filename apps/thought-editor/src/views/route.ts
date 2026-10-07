import type { Route } from "../shell/restore.ts"

/**
 * The restorable screens, as data (D175). A view passes its route when it pushes, and
 * `restore.tsx` turns a saved route back into the view after a relaunch.
 */
export const route = {
    root: (): Route => ({ view: "root" }),
    thoughts: (datasetId: string | null): Route => ({ view: "thoughts", datasetId }),
    thoughtForm: (thoughtId: string | null, datasetIds: string[] = []): Route => ({
        view: "thought-form",
        thoughtId,
        datasetIds
    }),
    datasets: (): Route => ({ view: "datasets" }),
    datasetForm: (datasetId: string | null): Route => ({ view: "dataset-form", datasetId })
}

import type { Dataset } from "../../data/model.ts"
import { deleteDataset } from "../../data/writes.ts"
import { confirm } from "../../shell/confirm.tsx"
import { runWrite } from "../../shell/feedback.ts"

/** Confirms, then deletes. Thoughts stay; they leave the dataset and its schemas detach. */
export const removeDataset = async (dataset: Dataset) => {
    const confirmed = await confirm({
        title: "Delete dataset",
        message: `Delete "${dataset.alias}"? Its thoughts are kept; attributes using its schemas keep their values without a schema.`,
        confirmLabel: "Delete"
    })
    if (!confirmed) return false
    return (await runWrite(deleteDataset(dataset.id), "Dataset deleted")) !== undefined
}

/**
 * @remarks
 * New types extend this union and `validateValue` together. The schema itself never shows in the
 * UI except through a validation error (D174).
 */
export const schemaTypes = ["text", "date"] as const
export type SchemaType = (typeof schemaTypes)[number]

export type Schema = {
    id: string
    datasetId: string
    name: string
    /** What the value means; the form shows it as the empty field's placeholder. */
    description: string
    type: SchemaType
    createdAt: number
}

export type Dataset = {
    id: string
    alias: string
    description: string
    createdAt: number
    updatedAt: number
}

/**
 * @remarks
 * Attributes are embedded in their thought, so a thought and its attributes save in one write.
 * A schema belongs to a dataset, so assigning one implies the thought is in that dataset.
 */
export type Attribute = {
    id: string
    name: string
    value: string
    schemaId: string | null
}

export type Thought = {
    id: string
    alias: string | null
    content: string
    datasetIds: string[]
    attributes: Attribute[]
    createdAt: number
    /** Shown as Modified, like Finder. */
    updatedAt: number
    /** When it entered ALTERED, which can be later than its creation (an imported file). */
    addedAt: number
}

export type Snapshot = {
    thoughts: Thought[]
    datasets: Dataset[]
    schemas: Schema[]
}

export const validateValue = (type: SchemaType, value: string): string | null => {
    switch (type) {
        case "text":
            return null
        case "date":
            return !value || (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)))
                ? null
                : "Must be a date, like 2026-10-06."
    }
}

export const thoughtTitle = (thought: Thought) => thought.alias ?? thought.content

export const newId = () => crypto.randomUUID()

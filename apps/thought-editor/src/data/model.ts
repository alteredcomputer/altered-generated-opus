/**
 * @remarks
 * Text is the only schema type for now. New types (number, date, enum) extend this union and
 * `validateValue` together.
 */
export const schemaTypes = ["text"] as const
export type SchemaType = (typeof schemaTypes)[number]

export type Schema = {
    id: string
    datasetId: string
    name: string
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
    updatedAt: number
    /** When it entered ALTERED, which can be later than its creation (an imported note). */
    addedAt: number
}

export type Snapshot = {
    thoughts: Thought[]
    datasets: Dataset[]
    schemas: Schema[]
}

export const validateValue = (type: SchemaType, value: unknown): string | null => {
    switch (type) {
        case "text":
            return typeof value === "string" ? null : "Must be text."
    }
}

export const thoughtTitle = (thought: Thought) => thought.alias ?? thought.content

export const newId = () => crypto.randomUUID()

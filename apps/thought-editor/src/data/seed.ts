import { type Dataset, newId, type Schema, type Snapshot, type Thought } from "./model.ts"

type SeedThought = {
    alias?: string
    content: string
    datasets: string[]
    attributes?: Record<string, string>
}

const datasetSeeds = [
    { alias: "tenets", description: "Principles to reread daily.", schemas: ["source"] },
    { alias: "decisions", description: "Locked calls and why.", schemas: ["status", "decided"] },
    { alias: "koa", description: "The iMessage agent.", schemas: ["phase"] },
    { alias: "marketing", description: "Offer, copy, and channels.", schemas: [] },
    { alias: "questions", description: "Open questions still unanswered.", schemas: [] },
    { alias: "ideas", description: "Unfiled sparks.", schemas: [] }
]

const thoughtSeeds: SeedThought[] = [
    {
        alias: "Time is the only enemy",
        content: "Money, reputation, and relationships can be rebuilt. Time cannot.",
        datasets: ["tenets"],
        attributes: { source: "notes" }
    },
    {
        alias: "Minimal lowers the cost of perfect",
        content: "Keep surfaces so plain that getting them exactly right is cheap.",
        datasets: ["tenets"],
        attributes: { source: "pierre.computer" }
    },
    {
        alias: "Prevent, do not repair",
        content: "Ask before building anything that might look wrong.",
        datasets: ["tenets"]
    },
    {
        alias: "Ship the draft",
        content: "One wrong word in a headline does not stop a sale. Iterate in public.",
        datasets: ["tenets", "marketing"]
    },
    {
        alias: "Freeze the definition of complete",
        content:
            "Editor with datasets, attributes, versioning. Nothing enters without something leaving.",
        datasets: ["decisions"],
        attributes: { status: "locked", decided: "2026-08-16" }
    },
    {
        alias: "Datasets are tags, not folders",
        content: "A thought belongs to many narrow datasets instead of one broad folder.",
        datasets: ["decisions", "ideas"],
        attributes: { status: "locked" }
    },
    {
        alias: "Local first",
        content: "Open instantly from disk. Show stale data, sync quietly, never a spinner.",
        datasets: ["decisions"],
        attributes: { status: "prototype" }
    },
    {
        alias: "Keyboard before mouse",
        content: "Every action reachable from Cmd-K, and the common ones from a single chord.",
        datasets: ["decisions", "tenets"],
        attributes: { status: "prototype" }
    },
    {
        alias: "Koa remembers decisions",
        content: "Structured, queryable thought rows with real references, not just vector recall.",
        datasets: ["koa"],
        attributes: { phase: "memory" }
    },
    {
        alias: "Reach out when it matters",
        content: "Koa decides when to text first, based on what you said you would do.",
        datasets: ["koa"],
        attributes: { phase: "scheduling" }
    },
    {
        alias: "Voice notes are source data",
        content: "Save the audio, transcribe it, keep the backlink to the exact span.",
        datasets: ["koa"],
        attributes: { phase: "loop" }
    },
    {
        alias: "Event ledger first",
        content: "Concurrency bugs are observability bugs first. Log every step.",
        datasets: ["koa", "decisions"],
        attributes: { phase: "concurrency", status: "locked" }
    },
    {
        alias: "Outreach is the primary channel",
        content: "Daily outreach before any paid ads. Ads only after a proven funnel.",
        datasets: ["marketing"]
    },
    {
        alias: "Massive promise, inevitable explanation",
        content: "A confident price with proof beats a feature dump.",
        datasets: ["marketing"]
    },
    {
        alias: "Markdown page",
        content: "Literal headings, literal dividers, one link. The page reads like a file.",
        datasets: ["marketing", "ideas"]
    },
    {
        alias: "What should the editor be called?",
        content: "Control plane, access panel, or something else entirely.",
        datasets: ["questions"]
    },
    {
        alias: "Sync across devices?",
        content: "The prototype keeps data in the browser. When does it need a server?",
        datasets: ["questions"]
    },
    {
        alias: "Which schema types come next?",
        content: "Text is enough to start. Number, date, and choice are the obvious next three.",
        datasets: ["questions", "ideas"]
    },
    {
        alias: "Relations between thoughts",
        content: "Parent, child, similar, preceding, subsequent, equivalent.",
        datasets: ["ideas"]
    },
    {
        alias: "Versioned thoughts",
        content: "Every edit keeps the previous version, so a thought has a history.",
        datasets: ["ideas"]
    },
    {
        content: "Distillation indexes and compresses. Deciding what matters stays human.",
        datasets: ["tenets", "koa"]
    },
    {
        content: "Clean the house to clean the mind.",
        datasets: ["tenets"]
    },
    {
        content:
            "Raycast feels fast because it is native, focused, and centred. Match that on the web.",
        datasets: ["ideas"]
    },
    {
        content: "Compare value propositions side by side, as rows with attributes.",
        datasets: ["ideas", "marketing"]
    },
    {
        content: "Draft: a thought with content and no alias yet.",
        datasets: []
    }
]

const DAY = 86_400_000

/** Builds the demo data with fresh ids, spread over the last month, newest first. */
export const seed = (now = Date.now()): Snapshot => {
    const datasets: Dataset[] = []
    const schemas: Schema[] = []

    for (const [index, entry] of datasetSeeds.entries()) {
        const createdAt = now - 40 * DAY + index * DAY
        const dataset = {
            id: newId(),
            alias: entry.alias,
            description: entry.description,
            createdAt,
            updatedAt: createdAt
        }
        datasets.push(dataset)
        for (const name of entry.schemas)
            schemas.push({ id: newId(), datasetId: dataset.id, name, type: "text", createdAt })
    }

    const datasetId = (alias: string) => {
        const id = datasets.find(d => d.alias === alias)?.id
        if (!id) throw new Error(`Seed thought names an unknown dataset: ${alias}`)
        return id
    }

    const thoughts = thoughtSeeds.map((entry, index): Thought => {
        const createdAt = now - index * 1.2 * DAY - (index % 5) * 3_600_000
        const ids = entry.datasets.map(datasetId)

        return {
            id: newId(),
            alias: entry.alias ?? null,
            content: entry.content,
            datasetIds: ids,
            attributes: Object.entries(entry.attributes ?? {}).map(([name, value]) => ({
                id: newId(),
                name,
                value,
                schemaId:
                    schemas.find(s => s.name === name && ids.includes(s.datasetId))?.id ?? null
            })),
            createdAt,
            updatedAt: createdAt,
            addedAt: createdAt
        }
    })

    return { thoughts, datasets, schemas }
}

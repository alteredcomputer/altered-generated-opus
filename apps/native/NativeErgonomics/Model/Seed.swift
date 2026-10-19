import Foundation
import SwiftData

/// The web editor's demo data (`apps/thought-editor/src/data/seed.ts`), ported as written so the
/// two editors start from the same library. The stores stay separate (D198).
nonisolated enum Seed {
    nonisolated struct DatasetSeed: Sendable {
        let alias: String
        let summary: String
        let schemas: [String]
    }

    nonisolated struct ThoughtSeed: Sendable {
        var alias: String?
        let content: String
        let datasets: [String]
        var attributes: KeyValuePairs<String, String> = [:]
    }

    static let datasets: [DatasetSeed] = [
        .init(alias: "tenets", summary: "Principles to reread daily.", schemas: ["source"]),
        .init(alias: "decisions", summary: "Locked calls and why.", schemas: ["status", "decided"]),
        .init(alias: "koa", summary: "The iMessage agent.", schemas: ["phase"]),
        .init(alias: "marketing", summary: "Offer, copy, and channels.", schemas: []),
        .init(alias: "questions", summary: "Open questions still unanswered.", schemas: []),
        .init(alias: "ideas", summary: "Unfiled sparks.", schemas: []),
    ]

    static let thoughts: [ThoughtSeed] = [
        .init(
            alias: "Time is the only enemy",
            content: "Money, reputation, and relationships can be rebuilt. Time cannot.",
            datasets: ["tenets"], attributes: ["source": "notes"]
        ),
        .init(
            alias: "Minimal lowers the cost of perfect",
            content: "Keep surfaces so plain that getting them exactly right is cheap.",
            datasets: ["tenets"], attributes: ["source": "pierre.computer"]
        ),
        .init(
            alias: "Prevent, do not repair",
            content: "Ask before building anything that might look wrong.",
            datasets: ["tenets"]
        ),
        .init(
            alias: "Ship the draft",
            content: "One wrong word in a headline does not stop a sale. Iterate in public.",
            datasets: ["tenets", "marketing"]
        ),
        .init(
            alias: "Freeze the definition of complete",
            content: "Editor with datasets, attributes, versioning. Nothing enters without something leaving.",
            datasets: ["decisions"], attributes: ["status": "locked", "decided": "2026-08-16"]
        ),
        .init(
            alias: "Datasets are tags, not folders",
            content: "A thought belongs to many narrow datasets instead of one broad folder.",
            datasets: ["decisions", "ideas"], attributes: ["status": "locked"]
        ),
        .init(
            alias: "Local first",
            content: "Open instantly from disk. Show stale data, sync quietly, never a spinner.",
            datasets: ["decisions"], attributes: ["status": "prototype"]
        ),
        .init(
            alias: "Keyboard before mouse",
            content: "Every action reachable from Cmd-K, and the common ones from a single chord.",
            datasets: ["decisions", "tenets"], attributes: ["status": "prototype"]
        ),
        .init(
            alias: "Koa remembers decisions",
            content: "Structured, queryable thought rows with real references, not just vector recall.",
            datasets: ["koa"], attributes: ["phase": "memory"]
        ),
        .init(
            alias: "Reach out when it matters",
            content: "Koa decides when to text first, based on what you said you would do.",
            datasets: ["koa"], attributes: ["phase": "scheduling"]
        ),
        .init(
            alias: "Voice notes are source data",
            content: "Save the audio, transcribe it, keep the backlink to the exact span.",
            datasets: ["koa"], attributes: ["phase": "loop"]
        ),
        .init(
            alias: "Event ledger first",
            content: "Concurrency bugs are observability bugs first. Log every step.",
            datasets: ["koa", "decisions"], attributes: ["phase": "concurrency", "status": "locked"]
        ),
        .init(
            alias: "Outreach is the primary channel",
            content: "Daily outreach before any paid ads. Ads only after a proven funnel.",
            datasets: ["marketing"]
        ),
        .init(
            alias: "Massive promise, inevitable explanation",
            content: "A confident price with proof beats a feature dump.",
            datasets: ["marketing"]
        ),
        .init(
            alias: "Markdown page",
            content: "Literal headings, literal dividers, one link. The page reads like a file.",
            datasets: ["marketing", "ideas"]
        ),
        .init(
            alias: "What should the editor be called?",
            content: "Control plane, access panel, or something else entirely.",
            datasets: ["questions"]
        ),
        .init(
            alias: "Sync across devices?",
            content: "The prototype keeps data in the browser. When does it need a server?",
            datasets: ["questions"]
        ),
        .init(
            alias: "Which schema types come next?",
            content: "Text is enough to start. Number, date, and choice are the obvious next three.",
            datasets: ["questions", "ideas"]
        ),
        .init(
            alias: "Relations between thoughts",
            content: "Parent, child, similar, preceding, subsequent, equivalent.",
            datasets: ["ideas"]
        ),
        .init(
            alias: "Versioned thoughts",
            content: "Every edit keeps the previous version, so a thought has a history.",
            datasets: ["ideas"]
        ),
        .init(
            content: "Distillation indexes and compresses. Deciding what matters stays human.",
            datasets: ["tenets", "koa"]
        ),
        .init(content: "Clean the house to clean the mind.", datasets: ["tenets"]),
        .init(
            content: "Raycast feels fast because it is native, focused, and centred. Match that on the web.",
            datasets: ["ideas"]
        ),
        .init(
            content: "Compare value propositions side by side, as rows with attributes.",
            datasets: ["ideas", "marketing"]
        ),
        .init(content: "Draft: a thought with content and no alias yet.", datasets: []),
    ]

    private static let day: TimeInterval = 86_400

    /// Inserts the demo data with fresh ids, spread over the last month, newest first. A seed
    /// thought naming an unknown dataset is a programming error, so it stops the app loudly.
    @MainActor
    static func insert(into context: ModelContext, now: Date = .now) {
        var byAlias: [String: Dataset] = [:]
        for (index, entry) in datasets.enumerated() {
            let createdAt = now.addingTimeInterval(-40 * day + Double(index) * day)
            let dataset = Dataset(alias: entry.alias, summary: entry.summary, createdAt: createdAt)
            context.insert(dataset)
            for name in entry.schemas {
                let schema = FieldSchema(name: name, createdAt: createdAt)
                context.insert(schema)
                schema.dataset = dataset
            }
            byAlias[entry.alias] = dataset
        }

        for (index, entry) in thoughts.enumerated() {
            let createdAt = now.addingTimeInterval(
                -Double(index) * 1.2 * day - Double(index % 5) * 3_600
            )
            let members = entry.datasets.map { alias in
                guard let dataset = byAlias[alias] else {
                    preconditionFailure("Seed thought names an unknown dataset: \(alias)")
                }
                return dataset
            }
            let fields = members.flatMap(\.schemas)
            let thought = Thought(
                alias: entry.alias,
                content: entry.content,
                attributes: entry.attributes.map { name, value in
                    ThoughtAttribute(
                        name: name, value: value,
                        schemaId: fields.first { $0.name == name }?.id
                    )
                },
                createdAt: createdAt
            )
            context.insert(thought)
            thought.datasets = members
            thought.reindex()
        }
    }
}

import Foundation

/// The demo library: product thinking about ALTERED itself, shaped to exercise every feature.
/// Some thoughts have history, some are drafts, a few are missing required values, and Koa has
/// left proposals to review.
public enum Seed {
    private struct Step {
        var alias: String?
        var content: String
        var author: Author
        var note: String
        var hoursAgo: Double
    }

    public static func library(now: Date) -> Library {
        func ago(_ hours: Double) -> Date {
            Date(timeIntervalSince1970: floor(now.timeIntervalSince1970 - hours * 3600))
        }

        let datasets: [Dataset] = [
            Dataset(id: "ds-tenets", alias: "tenets", description: "Principles to reread daily.",
                    fields: [Field(id: "f-source", name: "source", type: .text, required: false,
                                   description: "Where the principle came from.")],
                    createdAt: ago(720), updatedAt: ago(720)),
            Dataset(id: "ds-decisions", alias: "decisions", description: "Locked calls and why.",
                    fields: [
                        Field(id: "f-status", name: "status", type: .choice, options: ["open", "locked", "reversed"],
                              description: "Whether the call still stands."),
                        Field(id: "f-decided", name: "decided", type: .date, description: "The day it was made.")
                    ],
                    createdAt: ago(700), updatedAt: ago(90)),
            Dataset(id: "ds-koa", alias: "koa", description: "The iMessage agent.",
                    fields: [Field(id: "f-phase", name: "phase", type: .choice,
                                   options: ["loop", "memory", "scheduling", "concurrency", "reach-outs"],
                                   description: "The build phase this belongs to.")],
                    createdAt: ago(600), updatedAt: ago(600)),
            Dataset(id: "ds-marketing", alias: "marketing", description: "Offer, copy, and channels.",
                    fields: [Field(id: "f-channel", name: "channel", type: .choice, required: false,
                                   options: ["page", "outreach", "content", "ads"])],
                    createdAt: ago(580), updatedAt: ago(580)),
            Dataset(id: "ds-questions", alias: "questions", description: "Open questions still unanswered.",
                    fields: [Field(id: "f-answered", name: "answered", type: .toggle,
                                   description: "Set to yes once a decision answers it.")],
                    createdAt: ago(500), updatedAt: ago(30)),
            Dataset(id: "ds-ideas", alias: "ideas", description: "Unfiled sparks.",
                    createdAt: ago(480), updatedAt: ago(480)),
            Dataset(id: "ds-references", alias: "references", description: "Work worth studying.",
                    fields: [
                        Field(id: "f-url", name: "url", type: .link),
                        Field(id: "f-kind", name: "kind", type: .choice, options: ["site", "app", "article"])
                    ],
                    createdAt: ago(400), updatedAt: ago(400))
        ]

        var thoughts: [Thought] = []

        func add(
            _ id: ID, _ alias: String?, _ content: String, _ sets: [String], _ values: [String: String] = [:],
            hours: Double, pinned: Bool = false, locked: Bool = false, validated: Bool = true, history: [Step] = []
        ) {
            let datasetIds = sets.map { "ds-\($0)" }
            let fieldValues = Dictionary(uniqueKeysWithValues: values.map { ("f-\($0.key)", $0.value) })
            var revisions = history.map { step in
                Revision(alias: step.alias, content: step.content, datasetIds: datasetIds, values: fieldValues,
                         author: step.author, note: step.note, at: ago(step.hoursAgo))
            }
            let lastAuthor: Author = validated ? .you : .koa
            let createdHours = history.first?.hoursAgo ?? hours
            revisions.append(Revision(
                alias: alias, content: content, datasetIds: datasetIds, values: fieldValues, author: lastAuthor,
                note: history.isEmpty ? "created" : (validated ? "edited" : "tightened wording"), at: ago(hours)
            ))
            thoughts.append(Thought(
                id: id, alias: alias, content: content, datasetIds: datasetIds, values: fieldValues,
                pinned: pinned, locked: locked, validated: validated, revisions: revisions,
                createdAt: ago(createdHours), updatedAt: ago(hours)
            ))
        }

        add("t-enemy", "Time is the only enemy", "Money, reputation, and relationships can be rebuilt. Time cannot.",
            ["tenets"], ["source": "notes"], hours: 700, pinned: true, locked: true)
        add("t-minimal", "Minimal lowers the cost of perfect",
            "Keep surfaces so plain that getting them exactly right is cheap.",
            ["tenets"], ["source": "pierre.computer"], hours: 650, pinned: true)
        add("t-prevent", "Prevent, do not repair", "Ask before building anything that might look wrong.",
            ["tenets"], hours: 640)
        add("t-draft", "Ship the draft", "One wrong word in a headline does not stop a sale. Iterate in public.",
            ["tenets", "marketing"], ["channel": "content"], hours: 610)
        add("t-freeze", "Freeze the definition of complete",
            "Editor with datasets, attributes, versioning. Nothing enters without something leaving.",
            ["decisions"], ["status": "locked", "decided": "2026-08-16"], hours: 300, pinned: true,
            history: [Step(alias: "Define complete", content: "Editor with datasets and attributes.",
                           author: .you, note: "created", hoursAgo: 900)])
        add("t-tags", "Datasets are tags, not folders",
            "A thought belongs to many narrow datasets instead of one broad folder.",
            ["decisions", "ideas"], ["status": "locked", "decided": "2026-07-02"], hours: 420)
        add("t-local", "Local first",
            "Open instantly from disk. Show stale data, sync quietly, never a blocking spinner.",
            ["decisions"], ["status": "open", "decided": "2026-09-26"], hours: 5, validated: false,
            history: [
                Step(alias: "Offline", content: "It should work offline.", author: .you, note: "created", hoursAgo: 200),
                Step(alias: "Local first", content: "Open instantly from disk. Show stale data, sync quietly, never a spinner.",
                     author: .you, note: "edited", hoursAgo: 80)
            ])
        add("t-closed", "Default closed",
            "A new field is required unless you opt out. Structure is enforced, not suggested.",
            ["decisions"], ["status": "locked"], hours: 40)
        add("t-thumbs", "Thumbs before keyboards",
            "Every common action within one swipe or one hold, from the bottom half of the screen.",
            ["decisions", "ideas"], ["status": "open", "decided": "2026-09-29"], hours: 2)
        add("t-remembers", "Koa remembers decisions",
            "Structured, queryable thought rows with real references, not just vector recall.",
            ["koa"], ["phase": "memory"], hours: 260)
        add("t-reach", "Reach out when it matters", "Koa decides when to text first, based on what you said you would do.",
            ["koa"], ["phase": "reach-outs"], hours: 250)
        add("t-voice", "Voice notes are source data", "Save the audio, transcribe it, keep the backlink to the exact span.",
            ["koa"], ["phase": "loop"], hours: 240)
        add("t-ledger", "Event ledger first", "Concurrency bugs are observability bugs first. Log every step.",
            ["koa", "decisions"], ["phase": "concurrency", "status": "locked", "decided": "2026-09-07"], hours: 230)
        add("t-outreach", "Outreach is the primary channel", "Daily outreach before any paid ads. Ads only after a proven funnel.",
            ["marketing"], ["channel": "outreach"], hours: 200)
        add("t-promise", "Massive promise, inevitable explanation", "A confident price with proof beats a feature dump.",
            ["marketing"], hours: 190)
        add("t-markdown", "Markdown page", "Literal headings, literal dividers, one link. The page reads like a file.",
            ["marketing", "ideas"], ["channel": "page"], hours: 180)
        add("t-name", "What should the editor be called?", "Control plane, access panel, or something else entirely.",
            ["questions"], ["answered": "no"], hours: 170)
        add("t-sync", "Sync across devices?",
            "The prototype keeps data on the phone. When does it need a server, and which one?",
            ["questions"], ["answered": "no"], hours: 160)
        add("t-types", "Which schema types come next?",
            "Text is enough to start. Number, date, and choice are the obvious next three.",
            ["questions", "ideas"], ["answered": "yes"], hours: 150,
            history: [Step(alias: "Schema types", content: "Text is enough to start.",
                           author: .you, note: "created", hoursAgo: 400)])
        add("t-validate", "Validate, do not approve",
            "Validate and invalidate are opposites. Approve and decline are not, and decline sounds like delete.",
            ["decisions"], ["status": "locked", "decided": "2026-04-11"], hours: 140)
        add("t-authored", "Everything is authored",
            "Every change records who made it. Agent changes stay marked until a human validates them.",
            ["ideas"], hours: 130)
        add("t-relations", "Relations between thoughts", "Parent, child, similar, precedes, follows, equivalent.",
            ["ideas"], hours: 120)
        add("t-versioned", "Versioned thoughts", "Every edit keeps the previous version, so a thought has a history.",
            ["ideas"], hours: 110)
        add("t-interfaces", "Interfaces are queries with a layout",
            "A saved view is a query plus list, grid, or board. Stored as data, so it can ship without an app update.",
            ["ideas"], hours: 100)
        add("t-pierre", "pierre.computer", "A dark gray page with a font and some padding. Nothing else, and it is enough.",
            ["references"], ["url": "https://pierre.computer", "kind": "site"], hours: 90)
        add("t-zernio", "zernio.com", "Amazingly simple, monospaced.",
            ["references"], ["url": "https://zernio.com", "kind": "site"], hours: 89)
        add("t-langfuse", "langfuse.com", "Balanced and quiet. Inspiration for the product surfaces.",
            ["references"], ["url": "https://langfuse.com", "kind": "site"], hours: 88)
        add("t-costar", "Co-Star", "Flat tab bar, monospaced type, no transitions. Brutal and calm at once.",
            ["references"], ["kind": "app"], hours: 87)
        add("t-draft-distill", nil, "Distillation indexes and compresses. Deciding what matters stays human.",
            ["tenets", "koa"], hours: 20)
        add("t-draft-house", nil, "Clean the house to clean the mind.", ["tenets"], hours: 12)
        add("t-draft-compare", nil,
            "I basically want to compare value propositions side by side, really just as rows with attributes.",
            [], hours: 3)
        add("t-draft-backlinks", nil, "Backlinks point at the exact span a thought was distilled from.", [], hours: 1)

        func link(_ a: ID, _ kind: RelationKind, _ b: ID) {
            if let i = thoughts.firstIndex(where: { $0.id == a }) { thoughts[i].relations.append(Relation(kind, to: b)) }
            if let j = thoughts.firstIndex(where: { $0.id == b }) { thoughts[j].relations.append(Relation(kind.inverse, to: a)) }
        }
        link("t-freeze", .child, "t-versioned")
        link("t-freeze", .child, "t-relations")
        link("t-versioned", .similar, "t-authored")
        link("t-validate", .follows, "t-authored")
        link("t-remembers", .similar, "t-ledger")
        link("t-minimal", .equivalent, "t-pierre")
        link("t-interfaces", .precedes, "t-tags")
        link("t-sync", .similar, "t-local")

        let proposals = [
            Proposal(id: "p-house", thoughtId: "t-draft-house", author: .koa,
                     rationale: "Drafts need an alias to be used anywhere. Taken from the first words.",
                     edit: ThoughtEdit(alias: "Clean house, clean mind", content: "Clean the house to clean the mind.",
                                       datasetIds: ["ds-tenets"]),
                     createdAt: ago(0.5)),
            Proposal(id: "p-name", thoughtId: "t-name", author: .koa,
                     rationale: "Two of your recent notes call it the control plane. Narrowing the question.",
                     edit: ThoughtEdit(alias: "Is it the control plane?",
                                       content: "Control plane is the working name. Keep it unless something better lands this week.",
                                       datasetIds: ["ds-questions"], values: ["f-answered": "no"]),
                     createdAt: ago(0.4))
        ]

        let views = [
            SavedView(id: "v-open", alias: "Open questions", query: "#questions answered:no", layout: .list, createdAt: ago(100)),
            SavedView(id: "v-decisions", alias: "Decision board", query: "#decisions", layout: .board(field: "status"), createdAt: ago(99)),
            SavedView(id: "v-koa", alias: "Koa roadmap", query: "#koa", layout: .board(field: "phase"), createdAt: ago(98)),
            SavedView(id: "v-references", alias: "References", query: "#references sort:alias", layout: .grid, createdAt: ago(97)),
            SavedView(id: "v-attention", alias: "Needs attention", query: "is:unvalidated", layout: .list, createdAt: ago(96)),
            SavedView(id: "v-recent", alias: "Recently edited", query: "sort:updated", layout: .list, createdAt: ago(95))
        ]

        return Library(thoughts: thoughts, datasets: datasets, proposals: proposals, views: views)
    }
}

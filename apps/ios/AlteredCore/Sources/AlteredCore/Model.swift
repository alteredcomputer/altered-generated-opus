import Foundation

/// Stable identifier for every stored record. Short, random, and never reused.
public typealias ID = String

public enum IDs {
    private static let alphabet = Array("0123456789abcdefghijklmnopqrstuvwxyz")

    public static func make(length: Int = 10) -> ID {
        var generator = SystemRandomNumberGenerator()
        return String((0..<length).map { _ in alphabet.randomElement(using: &generator)! })
    }
}

/// Who wrote a change. Agent and import authorship stays visible until a human validates it.
public struct Author: Codable, Hashable, Sendable {
    public enum Kind: String, Codable, Sendable { case human, agent, source }

    public var kind: Kind
    public var name: String

    public init(_ kind: Kind, _ name: String) {
        self.kind = kind
        self.name = name
    }

    public static let you = Author(.human, "you")
    public static let koa = Author(.agent, "koa")

    public var isHuman: Bool { kind == .human }
}

/// One saved state of a thought. The newest revision always equals the thought's live fields.
public struct Revision: Codable, Hashable, Sendable {
    public var alias: String?
    public var content: String
    public var datasetIds: [ID]
    public var values: [ID: String]
    public var author: Author
    public var note: String
    public var at: Date

    public init(
        alias: String?, content: String, datasetIds: [ID], values: [ID: String], author: Author,
        note: String, at: Date
    ) {
        self.alias = alias
        self.content = content
        self.datasetIds = datasetIds
        self.values = values
        self.author = author
        self.note = note
        self.at = at
    }
}

public enum RelationKind: String, Codable, CaseIterable, Sendable {
    case parent, child, similar, precedes, follows, equivalent

    /// How a row reads: "child  Versioned thoughts".
    public var label: String {
        switch self {
        case .parent: "parent"
        case .child: "child"
        case .similar: "similar"
        case .precedes: "before"
        case .follows: "after"
        case .equivalent: "same as"
        }
    }

    /// "X is <phrase> Y", for confirmations.
    public var phrase: String {
        switch self {
        case .parent: "the parent of"
        case .child: "a child of"
        case .similar: "similar to"
        case .precedes: "before"
        case .follows: "after"
        case .equivalent: "the same as"
        }
    }

    /// The kind stored on the other thought, so every link reads correctly from both ends.
    public var inverse: RelationKind {
        switch self {
        case .parent: .child
        case .child: .parent
        case .similar: .similar
        case .precedes: .follows
        case .follows: .precedes
        case .equivalent: .equivalent
        }
    }
}

/// A link as seen from the thought that stores it: `Relation(.child, to: x)` on a thought means
/// x is its child. The other thought stores the inverse.
public struct Relation: Codable, Hashable, Sendable {
    public var kind: RelationKind
    public var to: ID

    public init(_ kind: RelationKind, to: ID) {
        self.kind = kind
        self.to = to
    }
}

/// The atom. Content is required; a thought without an alias is a draft.
public struct Thought: Codable, Hashable, Identifiable, Sendable {
    public var id: ID
    public var alias: String?
    public var content: String
    public var datasetIds: [ID]
    /// Attribute values keyed by field id. Only fields of the thought's datasets may hold a value.
    public var values: [ID: String]
    public var relations: [Relation]
    public var pinned: Bool
    /// Locked thoughts refuse edits and agent proposals until unlocked.
    public var locked: Bool
    /// A human has reviewed the latest revision. Any agent-authored change clears it.
    public var validated: Bool
    public var revisions: [Revision]
    public var createdAt: Date
    public var updatedAt: Date

    public init(
        id: ID, alias: String?, content: String, datasetIds: [ID] = [], values: [ID: String] = [:],
        relations: [Relation] = [], pinned: Bool = false, locked: Bool = false,
        validated: Bool = true, revisions: [Revision] = [], createdAt: Date, updatedAt: Date
    ) {
        self.id = id
        self.alias = alias
        self.content = content
        self.datasetIds = datasetIds
        self.values = values
        self.relations = relations
        self.pinned = pinned
        self.locked = locked
        self.validated = validated
        self.revisions = revisions
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }

    public var isDraft: Bool { (alias ?? "").trimmingCharacters(in: .whitespaces).isEmpty }

    /// What a list shows as the name: the alias, or the start of the content for a draft.
    public var title: String {
        if let alias, !isDraft { return alias }
        return content
    }

    public var version: Int { revisions.count }
    public var lastAuthor: Author { revisions.last?.author ?? .you }

    public var editable: ThoughtEdit {
        ThoughtEdit(alias: alias ?? "", content: content, datasetIds: datasetIds, values: values)
    }
}

/// The fields a person or agent can change in one edit. Everything else has its own mutation.
public struct ThoughtEdit: Codable, Hashable, Sendable {
    public var alias: String
    public var content: String
    public var datasetIds: [ID]
    public var values: [ID: String]

    public init(alias: String = "", content: String = "", datasetIds: [ID] = [], values: [ID: String] = [:]) {
        self.alias = alias
        self.content = content
        self.datasetIds = datasetIds
        self.values = values
    }

    /// Trimmed alias, or nil when the edit leaves the thought a draft.
    public var cleanAlias: String? {
        let trimmed = alias.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }

    public var cleanContent: String { content.trimmingCharacters(in: .whitespacesAndNewlines) }
}

/// A tag, not a folder. Its fields define which attributes its thoughts must carry.
public struct Dataset: Codable, Hashable, Identifiable, Sendable {
    public var id: ID
    public var alias: String
    public var description: String
    public var fields: [Field]
    public var createdAt: Date
    public var updatedAt: Date

    public init(
        id: ID, alias: String, description: String = "", fields: [Field] = [], createdAt: Date,
        updatedAt: Date
    ) {
        self.id = id
        self.alias = alias
        self.description = description
        self.fields = fields
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}

/// A change an agent suggests. Nothing an agent writes lands without a human accepting it.
public struct Proposal: Codable, Hashable, Identifiable, Sendable {
    public var id: ID
    public var thoughtId: ID
    public var author: Author
    public var rationale: String
    public var edit: ThoughtEdit
    public var createdAt: Date

    public init(id: ID, thoughtId: ID, author: Author, rationale: String, edit: ThoughtEdit, createdAt: Date) {
        self.id = id
        self.thoughtId = thoughtId
        self.author = author
        self.rationale = rationale
        self.edit = edit
        self.createdAt = createdAt
    }
}

/// Everything the editor stores. Views read it; only mutations change it.
public struct Library: Codable, Hashable, Sendable {
    public var thoughts: [Thought]
    public var datasets: [Dataset]
    public var proposals: [Proposal]
    public var views: [SavedView]

    public init(thoughts: [Thought] = [], datasets: [Dataset] = [], proposals: [Proposal] = [], views: [SavedView] = []) {
        self.thoughts = thoughts
        self.datasets = datasets
        self.proposals = proposals
        self.views = views
    }

    public func thought(_ id: ID) -> Thought? { thoughts.first { $0.id == id } }
    public func dataset(_ id: ID) -> Dataset? { datasets.first { $0.id == id } }
    public func view(_ id: ID) -> SavedView? { views.first { $0.id == id } }
    public func proposal(_ id: ID) -> Proposal? { proposals.first { $0.id == id } }

    public func datasets(of thought: Thought) -> [Dataset] {
        thought.datasetIds.compactMap(dataset)
    }

    /// Every field that applies to a thought, in dataset order, each paired with its dataset.
    public func fields(for datasetIds: [ID]) -> [(dataset: Dataset, field: Field)] {
        datasetIds.compactMap(dataset).flatMap { dataset in dataset.fields.map { (dataset, $0) } }
    }

    public func thoughts(in datasetId: ID) -> [Thought] {
        thoughts.filter { $0.datasetIds.contains(datasetId) }
    }

    public func proposals(for thoughtId: ID) -> [Proposal] {
        proposals.filter { $0.thoughtId == thoughtId }
    }
}

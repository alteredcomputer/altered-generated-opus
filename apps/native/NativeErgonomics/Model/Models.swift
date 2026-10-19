import Foundation
import SwiftData

/// The one schema type for now, as on the web (`apps/thought-editor/src/data/model.ts`). New types
/// extend this enum and `Rules.validate(_:as:)` together.
nonisolated enum SchemaKind: String, Codable, CaseIterable, Sendable {
    case text
}

/// One attribute on a thought. Attributes live inside their thought, so a thought and its
/// attributes save in one write (as on the web). `schemaId` ties one to a field of one of the
/// thought's datasets; `nil` means a free attribute.
nonisolated struct ThoughtAttribute: Codable, Hashable, Identifiable, Sendable {
    var id: UUID
    var name: String
    var value: String
    var schemaId: UUID?

    init(id: UUID = UUID(), name: String, value: String, schemaId: UUID? = nil) {
        self.id = id
        self.name = name
        self.value = value
        self.schemaId = schemaId
    }
}

@Model
final class Thought {
    @Attribute(.unique) var id: UUID
    var alias: String?
    var content: String
    var datasets: [Dataset] = []
    var attributes: [ThoughtAttribute]
    var createdAt: Date
    var updatedAt: Date
    /// When it entered ALTERED, which can be later than its creation (an imported note).
    var addedAt: Date

    //  Derived from the fields above by `reindex()`, so a list row or a search never parses
    //  content or walks relationships while scrolling or typing.
    var title: String = ""
    var snippet: String = ""
    var datasetLine: String = ""
    var searchText: String = ""

    init(
        id: UUID = UUID(),
        alias: String? = nil,
        content: String = "",
        attributes: [ThoughtAttribute] = [],
        createdAt: Date = .now,
        updatedAt: Date? = nil,
        addedAt: Date? = nil
    ) {
        self.id = id
        self.alias = alias
        self.content = content
        self.attributes = attributes
        self.createdAt = createdAt
        self.updatedAt = updatedAt ?? createdAt
        self.addedAt = addedAt ?? createdAt
    }

    /// Recomputes the derived fields. Call after any change to alias, content, attributes, or
    /// datasets, and after a member dataset is renamed.
    func reindex() {
        let aliases = datasets.map(\.alias).sorted { $0.localizedStandardCompare($1) == .orderedAscending }
        title = Derive.title(alias: alias, content: content)
        snippet = Derive.snippet(alias: alias, content: content)
        datasetLine = aliases.joined(separator: ", ")
        searchText = Derive.searchText(
            alias: alias, content: content, datasetAliases: aliases, attributes: attributes
        )
    }

    var datasetIDs: Set<UUID> { Set(datasets.map(\.id)) }

    var isEmpty: Bool { Rules.isEmpty(alias: alias, content: content, attributes: attributes) }
}

@Model
final class Dataset {
    @Attribute(.unique) var id: UUID
    var alias: String
    var summary: String
    var createdAt: Date
    var updatedAt: Date
    @Relationship(deleteRule: .nullify, inverse: \Thought.datasets) var thoughts: [Thought] = []
    @Relationship(deleteRule: .cascade, inverse: \FieldSchema.dataset) var schemas: [FieldSchema] = []

    init(id: UUID = UUID(), alias: String, summary: String = "", createdAt: Date = .now) {
        self.id = id
        self.alias = alias
        self.summary = summary
        self.createdAt = createdAt
        self.updatedAt = createdAt
    }

    /// Fields in the order they were added, for forms.
    var orderedSchemas: [FieldSchema] {
        schemas.sorted { ($0.createdAt, $0.name) < ($1.createdAt, $1.name) }
    }
}

/// A field a dataset asks its thoughts to fill. Named `FieldSchema` because SwiftData already
/// has a `Schema` type.
@Model
final class FieldSchema {
    @Attribute(.unique) var id: UUID
    var name: String
    var kind: SchemaKind
    var createdAt: Date
    var dataset: Dataset?

    init(id: UUID = UUID(), name: String, kind: SchemaKind = .text, createdAt: Date = .now) {
        self.id = id
        self.name = name
        self.kind = kind
        self.createdAt = createdAt
    }
}

/// Every model type, for building a container in the app and in tests.
let storeModels: [any PersistentModel.Type] = [Thought.self, Dataset.self, FieldSchema.self]

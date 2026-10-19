import Foundation

/// A change the person can fix by changing their input. The message is shown to them as written.
nonisolated struct ValidationError: LocalizedError, Equatable, Sendable {
    let message: String
    init(_ message: String) { self.message = message }
    var errorDescription: String? { message }
}

/// The derived row and search fields. Pure, so tests cover them without a store.
nonisolated enum Derive {
    /// Non-empty lines, trimmed.
    static func lines(_ content: String) -> [String] {
        content.split(whereSeparator: \.isNewline)
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty }
    }

    /// The alias when there is one, else the first line of content (as on the web, where the
    /// title is `alias ?? content`). Empty for an empty thought.
    static func title(alias: String?, content: String) -> String {
        if let alias = alias?.trimmingCharacters(in: .whitespacesAndNewlines), !alias.isEmpty {
            return alias
        }
        return lines(content).first ?? ""
    }

    /// The line under the title: the first line of content under an alias, else the second.
    static func snippet(alias: String?, content: String) -> String {
        let hasAlias = !(alias ?? "").trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        let rest = lines(content).dropFirst(hasAlias ? 0 : 1)
        return rest.first ?? ""
    }

    /// Everything a search matches against, lowercased once: alias, content, dataset aliases,
    /// attribute names and values (the same fields as the web's `filterThoughts`).
    static func searchText(
        alias: String?, content: String, datasetAliases: [String], attributes: [ThoughtAttribute]
    ) -> String {
        ([alias ?? "", content] + datasetAliases + attributes.flatMap { [$0.name, $0.value] })
            .joined(separator: " ")
            .lowercased()
    }
}

nonisolated enum Search {
    static func words(_ query: String) -> [String] {
        query.lowercased().split(whereSeparator: \.isWhitespace).map(String.init)
    }

    /// Case-insensitive: every word of the query must appear somewhere in the haystack, which is
    /// already lowercased.
    static func matches(_ words: [String], in haystack: String) -> Bool {
        words.allSatisfy { haystack.contains($0) }
    }

    /// Keeps the items that match the query and, when `allowed` is set, are in it. Order is kept,
    /// so the result is the list as shown.
    static func filter<Item>(
        _ items: [Item],
        query: String,
        allowed: Set<UUID>?,
        id: (Item) -> UUID,
        haystack: (Item) -> String
    ) -> [Item] {
        let terms = words(query)
        if terms.isEmpty, allowed == nil { return items }
        return items.filter { item in
            (allowed?.contains(id(item)) ?? true) && matches(terms, in: haystack(item))
        }
    }
}

/// Previous and next through the list the person came from.
nonisolated enum Stepper {
    /// The id `offset` places away from `id` in `order`, or nil at either end or when `id` is not
    /// in the list.
    static func neighbor(of id: UUID, in order: [UUID], by offset: Int) -> UUID? {
        guard let index = order.firstIndex(of: id) else { return nil }
        let target = index + offset
        return order.indices.contains(target) ? order[target] : nil
    }
}

/// What a schema says about a field, as plain values so the rules run without a store.
nonisolated struct SchemaInfo: Sendable {
    let datasetId: UUID
    let name: String
    let kind: SchemaKind
}

nonisolated enum Rules {
    /// A thought with nothing in it: no alias, no content, and no attribute value. Discarded when
    /// the person leaves it, as Notes does.
    static func isEmpty(alias: String?, content: String, attributes: [ThoughtAttribute]) -> Bool {
        (alias ?? "").trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && content.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && attributes.allSatisfy { $0.value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
    }

    static func validate(_ value: String, as kind: SchemaKind) -> String? {
        switch kind {
        case .text: return nil
        }
    }

    /// The web's `checkAttributes`: names are trimmed, blank rows dropped, a value needs a name,
    /// and a schema field must still exist and accept its value.
    static func clean(
        _ attributes: [ThoughtAttribute], schemas: [UUID: SchemaInfo]
    ) throws(ValidationError) -> [ThoughtAttribute] {
        let kept = attributes
            .map { attribute in
                var attribute = attribute
                attribute.name = attribute.name.trimmingCharacters(in: .whitespacesAndNewlines)
                return attribute
            }
            .filter { !$0.name.isEmpty || !$0.value.trimmingCharacters(in: .whitespaces).isEmpty }

        for attribute in kept {
            if attribute.name.isEmpty {
                throw ValidationError("Every attribute with a value needs a name.")
            }
            guard let schemaId = attribute.schemaId else { continue }
            guard let schema = schemas[schemaId] else {
                throw ValidationError("The field for \"\(attribute.name)\" no longer exists.")
            }
            if let problem = validate(attribute.value, as: schema.kind) {
                throw ValidationError("\(attribute.name): \(problem)")
            }
        }
        return kept
    }

    /// Attributes whose field belongs to a dataset the thought is leaving keep their name and
    /// value and lose the field, as on the web's `setThoughtDatasets`.
    static func detach(
        _ attributes: [ThoughtAttribute], keeping datasets: Set<UUID>, schemas: [UUID: SchemaInfo]
    ) -> [ThoughtAttribute] {
        attributes.map { attribute in
            guard let schemaId = attribute.schemaId,
                  let schema = schemas[schemaId],
                  !datasets.contains(schema.datasetId)
            else { return attribute }
            var detached = attribute
            detached.schemaId = nil
            return detached
        }
    }

    /// A field implies its dataset, so a thought with a field's value is in that dataset.
    static func datasets(
        _ chosen: Set<UUID>, implied attributes: [ThoughtAttribute], schemas: [UUID: SchemaInfo]
    ) -> Set<UUID> {
        chosen.union(attributes.compactMap { $0.schemaId.flatMap { schemas[$0]?.datasetId } })
    }

    /// Dataset aliases are required and unique, ignoring case.
    static func checkAlias(
        _ alias: String, existing: [(id: UUID, alias: String)], excluding id: UUID?
    ) throws(ValidationError) -> String {
        let alias = alias.trimmingCharacters(in: .whitespacesAndNewlines)
        if alias.isEmpty { throw ValidationError("A dataset needs a name.") }
        if existing.contains(where: { $0.id != id && $0.alias.lowercased() == alias.lowercased() }) {
            throw ValidationError("A dataset called \"\(alias)\" already exists.")
        }
        return alias
    }

    /// What Copy puts on the clipboard: each thought's content, a blank line between them.
    static func clipboardText(_ contents: [String]) -> String {
        contents.joined(separator: "\n\n")
    }
}

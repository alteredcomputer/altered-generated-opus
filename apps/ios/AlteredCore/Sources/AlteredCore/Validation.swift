import Foundation

/// A reason a thought cannot be saved as it is. The message is shown to the person as written.
public struct Issue: Hashable, Sendable {
    public enum Kind: String, Sendable { case content, alias, missing, invalid }

    public var kind: Kind
    public var fieldId: ID?
    public var message: String

    public init(_ kind: Kind, fieldId: ID? = nil, _ message: String) {
        self.kind = kind
        self.fieldId = fieldId
        self.message = message
    }
}

public enum Validation {
    public static let aliasLimit = 80

    /// Every problem with an edit. Drafts may leave required values empty, since a draft is where
    /// unfinished work lives; a thought with an alias must be complete.
    public static func issues(for edit: ThoughtEdit, id: ID?, in library: Library) -> [Issue] {
        var issues: [Issue] = []

        if edit.cleanContent.isEmpty {
            issues.append(Issue(.content, "Content is required."))
        }

        if let alias = edit.cleanAlias {
            if alias.count > aliasLimit {
                issues.append(Issue(.alias, "Alias is \(alias.count) characters; the limit is \(aliasLimit)."))
            }
            let taken = library.thoughts.contains { other in
                other.id != id && other.alias?.caseInsensitiveCompare(alias) == .orderedSame
            }
            if taken { issues.append(Issue(.alias, "Another thought already uses the alias \"\(alias)\".")) }
        }

        let isDraft = edit.cleanAlias == nil
        for (dataset, field) in library.fields(for: edit.datasetIds) {
            let raw = edit.values[field.id] ?? ""
            if let problem = field.problem(with: raw) {
                issues.append(Issue(.invalid, fieldId: field.id, "\(dataset.alias).\(field.name) \(problem)."))
            } else if field.required, !isDraft, raw.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                issues.append(Issue(.missing, fieldId: field.id, "\(dataset.alias).\(field.name) is required."))
            }
        }

        return issues
    }

    public static func issues(for thought: Thought, in library: Library) -> [Issue] {
        issues(for: thought.editable, id: thought.id, in: library)
    }

    /// Values that an edit would drop because their field no longer applies to the thought.
    public static func strayValues(in edit: ThoughtEdit, library: Library) -> [ID] {
        let allowed = Set(library.fields(for: edit.datasetIds).map(\.field.id))
        return edit.values.keys.filter { !allowed.contains($0) }.sorted()
    }

    /// The edit as it will be stored: trimmed, only known datasets, only values their fields allow.
    public static func normalized(_ edit: ThoughtEdit, library: Library) -> ThoughtEdit {
        var seen = Set<ID>()
        let datasetIds = edit.datasetIds.filter { library.dataset($0) != nil && seen.insert($0).inserted }
        let allowed = Set(library.fields(for: datasetIds).map(\.field.id))
        var values: [ID: String] = [:]
        for (key, raw) in edit.values where allowed.contains(key) {
            let value = raw.trimmingCharacters(in: .whitespacesAndNewlines)
            if !value.isEmpty { values[key] = value }
        }
        return ThoughtEdit(
            alias: edit.cleanAlias ?? "", content: edit.cleanContent, datasetIds: datasetIds, values: values
        )
    }
}

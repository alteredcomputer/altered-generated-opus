import Foundation

public enum MutationError: Error, Equatable, Sendable, CustomStringConvertible {
    case notFound(String)
    case locked(String)
    case invalid([Issue])
    case rejected(String)

    public var description: String {
        switch self {
        case let .notFound(what): "\(what) no longer exists."
        case let .locked(title): "\"\(title)\" is locked. Unlock it first."
        case let .invalid(issues): issues.map(\.message).joined(separator: " ")
        case let .rejected(reason): reason
        }
    }
}

/// Every change to the library. A mutation carries its own ids and timestamps, so replaying it
/// over a newer confirmed state gives the same result: that is what makes optimistic updates safe.
public enum Mutation: Codable, Hashable, Sendable {
    case createThought(id: ID, edit: ThoughtEdit, author: Author, at: Date)
    case editThought(id: ID, edit: ThoughtEdit, author: Author, note: String, at: Date)
    case deleteThought(id: ID)
    case setPinned(id: ID, Bool)
    case setLocked(id: ID, Bool)
    case setValidated(id: ID, Bool)
    case restore(id: ID, version: Int, at: Date)
    case link(from: ID, kind: RelationKind, to: ID)
    case unlink(from: ID, to: ID)

    case createDataset(Dataset)
    case editDataset(id: ID, alias: String, description: String, at: Date)
    case deleteDataset(id: ID, at: Date)
    case addField(datasetId: ID, field: Field, fill: String?, at: Date)
    case editField(datasetId: ID, field: Field, at: Date)
    case removeField(datasetId: ID, fieldId: ID, at: Date)

    case addProposals([Proposal])
    case acceptProposal(id: ID, at: Date)
    case rejectProposal(id: ID)

    case saveView(SavedView)
    case deleteView(id: ID)

    /// Short, human line for the outbox and the event log.
    public var summary: String {
        switch self {
        case .createThought: "create thought"
        case .editThought: "edit thought"
        case .deleteThought: "delete thought"
        case let .setPinned(_, on): on ? "pin" : "unpin"
        case let .setLocked(_, on): on ? "lock" : "unlock"
        case let .setValidated(_, on): on ? "validate" : "invalidate"
        case let .restore(_, version, _): "restore v\(version)"
        case let .link(_, kind, _): "link \(kind.rawValue)"
        case .unlink: "unlink"
        case .createDataset: "create dataset"
        case .editDataset: "edit dataset"
        case .deleteDataset: "delete dataset"
        case .addField: "add field"
        case .editField: "edit field"
        case .removeField: "remove field"
        case let .addProposals(list): "\(list.count) proposals"
        case .acceptProposal: "accept proposal"
        case .rejectProposal: "reject proposal"
        case .saveView: "save view"
        case .deleteView: "delete view"
        }
    }

    /// Records the UI marks as syncing while this mutation is in flight.
    public var affected: Set<ID> {
        switch self {
        case let .createThought(id, _, _, _), let .editThought(id, _, _, _, _), let .deleteThought(id),
             let .setPinned(id, _), let .setLocked(id, _), let .setValidated(id, _), let .restore(id, _, _):
            [id]
        case let .link(from, _, to), let .unlink(from, to): [from, to]
        case let .createDataset(dataset): [dataset.id]
        case let .editDataset(id, _, _, _), let .deleteDataset(id, _): [id]
        case let .addField(id, _, _, _), let .editField(id, _, _), let .removeField(id, _, _): [id]
        case let .addProposals(list): Set(list.flatMap { [$0.id, $0.thoughtId] })
        case let .acceptProposal(id, _), let .rejectProposal(id): [id]
        case let .saveView(view): [view.id]
        case let .deleteView(id): [id]
        }
    }

    public func apply(to library: inout Library) throws(MutationError) {
        switch self {
        case let .createThought(id, edit, author, at):
            let clean = Validation.normalized(edit, library: library)
            let issues = Validation.issues(for: clean, id: id, in: library)
            if !issues.isEmpty { throw .invalid(issues) }
            let revision = Revision(
                alias: clean.cleanAlias, content: clean.content, datasetIds: clean.datasetIds,
                values: clean.values, author: author, note: "created", at: at
            )
            library.thoughts.append(Thought(
                id: id, alias: clean.cleanAlias, content: clean.content, datasetIds: clean.datasetIds,
                values: clean.values, validated: author.isHuman, revisions: [revision], createdAt: at, updatedAt: at
            ))

        case let .editThought(id, edit, author, note, at):
            try Self.edit(id, edit, author: author, note: note, at: at, in: &library)

        case let .deleteThought(id):
            guard let thought = library.thought(id) else { throw .notFound("That thought") }
            if thought.locked { throw .locked(thought.title) }
            library.thoughts.removeAll { $0.id == id }
            for index in library.thoughts.indices {
                library.thoughts[index].relations.removeAll { $0.to == id }
            }
            library.proposals.removeAll { $0.thoughtId == id }

        case let .setPinned(id, on):
            try Self.update(id, in: &library) { $0.pinned = on }

        case let .setLocked(id, on):
            try Self.update(id, in: &library) { $0.locked = on }

        case let .setValidated(id, on):
            try Self.update(id, in: &library) { $0.validated = on }

        case let .restore(id, version, at):
            guard let thought = library.thought(id) else { throw .notFound("That thought") }
            guard version >= 1, version <= thought.revisions.count else { throw .notFound("Version \(version)") }
            let old = thought.revisions[version - 1]
            let edit = ThoughtEdit(alias: old.alias ?? "", content: old.content, datasetIds: old.datasetIds, values: old.values)
            try Self.edit(id, edit, author: .you, note: "restored v\(version)", at: at, in: &library)

        case let .link(from, kind, to):
            guard from != to else { throw .rejected("A thought cannot link to itself.") }
            guard let source = library.thought(from), let target = library.thought(to) else {
                throw .notFound("That thought")
            }
            if source.locked { throw .locked(source.title) }
            if target.locked { throw .locked(target.title) }
            try Self.update(from, in: &library) { thought in
                thought.relations.removeAll { $0.to == to }
                thought.relations.append(Relation(kind, to: to))
            }
            try Self.update(to, in: &library) { thought in
                thought.relations.removeAll { $0.to == from }
                thought.relations.append(Relation(kind.inverse, to: from))
            }

        case let .unlink(from, to):
            for id in [from, to] {
                if let thought = library.thought(id), thought.locked { throw .locked(thought.title) }
            }
            try Self.update(from, in: &library) { $0.relations.removeAll { $0.to == to } }
            try Self.update(to, in: &library) { $0.relations.removeAll { $0.to == from } }

        case let .createDataset(dataset):
            if let problem = Self.datasetAliasProblem(dataset.alias, id: dataset.id, in: library) {
                throw .rejected(problem)
            }
            library.datasets.append(dataset)

        case let .editDataset(id, alias, description, at):
            if let problem = Self.datasetAliasProblem(alias, id: id, in: library) { throw .rejected(problem) }
            try Self.updateDataset(id, in: &library) { dataset in
                dataset.alias = alias
                dataset.description = description.trimmingCharacters(in: .whitespacesAndNewlines)
                dataset.updatedAt = at
            }

        case let .deleteDataset(id, at):
            guard let dataset = library.dataset(id) else { throw .notFound("That dataset") }
            let fieldIds = Set(dataset.fields.map(\.id))
            for thought in library.thoughts(in: id) {
                if thought.locked { throw .locked(thought.title) }
                var edit = thought.editable
                edit.datasetIds.removeAll { $0 == id }
                edit.values = edit.values.filter { !fieldIds.contains($0.key) }
                try Self.write(thought.id, edit, author: .you, note: "removed from #\(dataset.alias)", at: at, check: false, in: &library)
            }
            library.datasets.removeAll { $0.id == id }

        case let .addField(datasetId, field, fill, at):
            guard let dataset = library.dataset(datasetId) else { throw .notFound("That dataset") }
            if let problem = Self.fieldProblem(field, in: dataset) { throw .rejected(problem) }
            if let fill, let problem = field.problem(with: fill) { throw .rejected("Fill value \(problem).") }
            try Self.updateDataset(datasetId, in: &library) { dataset in
                dataset.fields.append(field)
                dataset.updatedAt = at
            }
            if let fill, !fill.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                for thought in library.thoughts(in: datasetId) where !thought.locked {
                    var edit = thought.editable
                    edit.values[field.id] = fill
                    try Self.write(thought.id, edit, author: .you, note: "filled \(dataset.alias).\(field.name)", at: at, check: false, in: &library)
                }
            }

        case let .editField(datasetId, field, at):
            guard let dataset = library.dataset(datasetId) else { throw .notFound("That dataset") }
            guard let old = dataset.fields.first(where: { $0.id == field.id }) else { throw .notFound("That field") }
            if old.type != field.type { throw .rejected("A field's type cannot change. Remove it and add a new one.") }
            if let problem = Self.fieldProblem(field, in: dataset) { throw .rejected(problem) }
            try Self.updateDataset(datasetId, in: &library) { dataset in
                if let index = dataset.fields.firstIndex(where: { $0.id == field.id }) { dataset.fields[index] = field }
                dataset.updatedAt = at
            }

        case let .removeField(datasetId, fieldId, at):
            guard let dataset = library.dataset(datasetId) else { throw .notFound("That dataset") }
            guard let field = dataset.fields.first(where: { $0.id == fieldId }) else { throw .notFound("That field") }
            for thought in library.thoughts(in: datasetId) where thought.values[fieldId] != nil {
                if thought.locked { throw .locked(thought.title) }
                var edit = thought.editable
                edit.values[fieldId] = nil
                try Self.write(thought.id, edit, author: .you, note: "removed \(dataset.alias).\(field.name)", at: at, check: false, in: &library)
            }
            try Self.updateDataset(datasetId, in: &library) { dataset in
                dataset.fields.removeAll { $0.id == fieldId }
                dataset.updatedAt = at
            }

        case let .addProposals(list):
            for proposal in list where library.thought(proposal.thoughtId) != nil {
                library.proposals.append(proposal)
            }

        case let .acceptProposal(id, at):
            guard let proposal = library.proposal(id) else { throw .notFound("That proposal") }
            try Self.edit(proposal.thoughtId, proposal.edit, author: proposal.author, note: proposal.rationale, at: at, in: &library)
            library.proposals.removeAll { $0.id == id }

        case let .rejectProposal(id):
            guard library.proposal(id) != nil else { throw .notFound("That proposal") }
            library.proposals.removeAll { $0.id == id }

        case let .saveView(view):
            let alias = view.alias.trimmingCharacters(in: .whitespacesAndNewlines)
            if alias.isEmpty { throw .rejected("A view needs a name.") }
            if library.views.contains(where: { $0.id != view.id && $0.alias.caseInsensitiveCompare(alias) == .orderedSame }) {
                throw .rejected("Another view is already called \"\(alias)\".")
            }
            var clean = view
            clean.alias = alias
            clean.query = view.query.trimmingCharacters(in: .whitespacesAndNewlines)
            if let index = library.views.firstIndex(where: { $0.id == view.id }) {
                library.views[index] = clean
            } else {
                library.views.append(clean)
            }

        case let .deleteView(id):
            guard library.view(id) != nil else { throw .notFound("That view") }
            library.views.removeAll { $0.id == id }
        }
    }

    // MARK: - Helpers

    private static func edit(
        _ id: ID, _ edit: ThoughtEdit, author: Author, note: String, at: Date, in library: inout Library
    ) throws(MutationError) {
        guard let thought = library.thought(id) else { throw .notFound("That thought") }
        if thought.locked { throw .locked(thought.title) }
        try write(id, edit, author: author, note: note, at: at, check: true, in: &library)
    }

    /// Stores a new revision. `check: false` is for schema changes, which may leave a thought
    /// incomplete on purpose; the review queue then shows it.
    private static func write(
        _ id: ID, _ edit: ThoughtEdit, author: Author, note: String, at: Date, check: Bool,
        in library: inout Library
    ) throws(MutationError) {
        let clean = Validation.normalized(edit, library: library)
        if check {
            let issues = Validation.issues(for: clean, id: id, in: library)
            if !issues.isEmpty { throw .invalid(issues) }
        }
        try update(id, in: &library) { thought in
            let unchanged = thought.alias == clean.cleanAlias && thought.content == clean.content
                && thought.datasetIds == clean.datasetIds && thought.values == clean.values
            if unchanged { return }
            thought.alias = clean.cleanAlias
            thought.content = clean.content
            thought.datasetIds = clean.datasetIds
            thought.values = clean.values
            thought.validated = author.isHuman
            thought.updatedAt = at
            thought.revisions.append(Revision(
                alias: clean.cleanAlias, content: clean.content, datasetIds: clean.datasetIds,
                values: clean.values, author: author, note: note, at: at
            ))
        }
    }

    private static func update(_ id: ID, in library: inout Library, _ change: (inout Thought) -> Void) throws(MutationError) {
        guard let index = library.thoughts.firstIndex(where: { $0.id == id }) else { throw .notFound("That thought") }
        change(&library.thoughts[index])
    }

    private static func updateDataset(_ id: ID, in library: inout Library, _ change: (inout Dataset) -> Void) throws(MutationError) {
        guard let index = library.datasets.firstIndex(where: { $0.id == id }) else { throw .notFound("That dataset") }
        change(&library.datasets[index])
    }

    /// Dataset names are short lowercase words joined by hyphens, and unique.
    public static func datasetAliasProblem(_ alias: String, id: ID, in library: Library) -> String? {
        if alias.isEmpty { return "A dataset needs a name." }
        if alias.count > 32 { return "Dataset names are 32 characters at most." }
        let allowed = alias.allSatisfy { ($0.isLetter && $0.isLowercase) || $0.isNumber || $0 == "-" }
        if !allowed || alias.hasPrefix("-") || alias.hasSuffix("-") {
            return "Use lowercase letters, numbers, and hyphens, like open-questions."
        }
        if library.datasets.contains(where: { $0.id != id && $0.alias == alias }) {
            return "#\(alias) already exists."
        }
        return nil
    }

    public static func fieldProblem(_ field: Field, in dataset: Dataset) -> String? {
        let name = field.name
        if name.isEmpty { return "A field needs a name." }
        if name.count > 24 { return "Field names are 24 characters at most." }
        if !name.allSatisfy({ ($0.isLetter && $0.isLowercase) || $0.isNumber || $0 == "-" }) {
            return "Use lowercase letters, numbers, and hyphens for field names."
        }
        if dataset.fields.contains(where: { $0.id != field.id && $0.name == name }) {
            return "#\(dataset.alias) already has a field called \(name)."
        }
        if field.type == .choice {
            if field.options.isEmpty { return "A choice field needs at least one option." }
            if Set(field.options).count != field.options.count { return "Options must be unique." }
            if field.options.contains(where: { $0.trimmingCharacters(in: .whitespaces).isEmpty }) {
                return "Options cannot be empty."
            }
        }
        return nil
    }
}

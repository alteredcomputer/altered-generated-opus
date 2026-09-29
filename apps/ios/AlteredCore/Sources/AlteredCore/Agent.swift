import Foundation

/// A stand-in for Koa's review pass: simple, explainable rules that suggest changes. It only ever
/// proposes; a person accepts or rejects, and accepted changes stay marked as agent-authored
/// until someone validates them.
public enum Agent {
    static let filler: Set<String> = ["just", "really", "basically", "actually", "very", "literally", "simply"]

    public static func review(_ library: Library, author: Author = .koa, now: Date, limit: Int = 6) -> [Proposal] {
        var proposals: [Proposal] = []
        let busy = Set(library.proposals.map(\.thoughtId))

        for thought in library.thoughts where !thought.locked && !busy.contains(thought.id) {
            guard proposals.count < limit else { break }
            if let proposal = tighten(thought, author, now) ?? aliasForDraft(thought, library, author, now)
                ?? datasetForLoose(thought, library, author, now) {
                proposals.append(proposal)
            }
        }
        return proposals
    }

    /// A draft gets an alias from its first words.
    static func aliasForDraft(_ thought: Thought, _ library: Library, _ author: Author, _ now: Date) -> Proposal? {
        guard thought.isDraft else { return nil }
        let words = thought.content.split(whereSeparator: \.isWhitespace).prefix(5)
        guard !words.isEmpty else { return nil }
        var alias = words.joined(separator: " ").trimmingCharacters(in: .punctuationCharacters)
        alias = alias.prefix(1).uppercased() + alias.dropFirst()
        var edit = thought.editable
        edit.alias = alias
        guard Validation.issues(for: edit, id: thought.id, in: library).isEmpty else { return nil }
        return Proposal(
            id: IDs.make(), thoughtId: thought.id, author: author,
            rationale: "Drafts need an alias to be used anywhere. Taken from the first words.",
            edit: edit, createdAt: now
        )
    }

    /// Filler words removed. Concision is what makes a thought composable.
    static func tighten(_ thought: Thought, _ author: Author, _ now: Date) -> Proposal? {
        let tokens = Diff.tokens(thought.content)
        var kept: [String] = []
        var removed = 0
        for token in tokens {
            let bare = token.lowercased().trimmingCharacters(in: .punctuationCharacters)
            if filler.contains(bare) {
                removed += 1
                if let last = kept.last, last.allSatisfy(\.isWhitespace) { kept.removeLast() }
                continue
            }
            kept.append(token)
        }
        guard removed > 0 else { return nil }
        var edit = thought.editable
        edit.content = kept.joined()
        return Proposal(
            id: IDs.make(), thoughtId: thought.id, author: author,
            rationale: "Removed \(removed) filler word\(removed == 1 ? "" : "s"). Same meaning, fewer words.",
            edit: edit, createdAt: now
        )
    }

    /// A thought in no dataset gets the first dataset its content names.
    static func datasetForLoose(_ thought: Thought, _ library: Library, _ author: Author, _ now: Date) -> Proposal? {
        guard thought.datasetIds.isEmpty else { return nil }
        let text = Search.fold(thought.content + " " + (thought.alias ?? ""))
        guard let dataset = library.datasets.first(where: { dataset in
            let name = Search.fold(dataset.alias)
            let singular = name.hasSuffix("s") ? String(name.dropLast()) : name
            return text.contains(name) || text.contains(singular)
        }) else { return nil }
        var edit = thought.editable
        edit.datasetIds.append(dataset.id)
        return Proposal(
            id: IDs.make(), thoughtId: thought.id, author: author,
            rationale: "This thought is in no dataset and mentions \(dataset.alias).",
            edit: edit, createdAt: now
        )
    }
}

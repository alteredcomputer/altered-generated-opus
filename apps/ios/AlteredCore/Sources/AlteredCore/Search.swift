import Foundation

/// The search language, shared by the search bar and saved views, so a view is just a query
/// someone chose to keep.
///
/// - words match the alias, content, and dataset names; every word must match
/// - `#ideas` keeps thoughts in a dataset
/// - `is:draft`, `is:pinned`, `is:locked`, `is:incomplete`, `is:unvalidated`, `is:proposed`
/// - `by:koa` keeps thoughts whose latest revision that author wrote
/// - `status:locked` keeps thoughts with that value in a field of that name
/// - `sort:updated`, `sort:created`, `sort:alias`
/// - a leading `-` negates any filter
public struct Query: Hashable, Sendable {
    public enum Filter: Hashable, Sendable {
        case word(String)
        case dataset(String)
        case state(String)
        case author(String)
        case value(field: String, value: String)
    }

    public enum Sort: String, Hashable, Sendable { case relevance, updated, created, alias }

    public private(set) var terms: [Filter] = []
    public private(set) var negations: [Bool] = []
    public private(set) var sort: Sort = .relevance
    /// Parts the parser did not understand, so the UI can say so rather than ignore them.
    public private(set) var unknown: [String] = []

    public static let states = ["draft", "pinned", "locked", "incomplete", "unvalidated", "proposed"]

    public init(_ text: String) {
        for token in text.split(whereSeparator: \.isWhitespace).map(String.init) {
            let negated = token.hasPrefix("-") && token.count > 1
            let body = negated ? String(token.dropFirst()) : token
            let lower = body.lowercased()

            if lower.hasPrefix("#"), lower.count > 1 {
                add(.dataset(String(lower.dropFirst())), negated)
            } else if lower.hasPrefix("is:") {
                let state = String(lower.dropFirst(3))
                if Self.states.contains(state) { add(.state(state), negated) } else { unknown.append(token) }
            } else if lower.hasPrefix("by:"), lower.count > 3 {
                add(.author(String(lower.dropFirst(3))), negated)
            } else if lower.hasPrefix("sort:") {
                if let sort = Sort(rawValue: String(lower.dropFirst(5))) { self.sort = sort } else { unknown.append(token) }
            } else if let colon = lower.firstIndex(of: ":"), colon != lower.startIndex,
                      lower.index(after: colon) != lower.endIndex {
                let field = String(lower[..<colon])
                let value = String(lower[lower.index(after: colon)...])
                add(.value(field: field, value: value), negated)
            } else {
                add(.word(lower), negated)
            }
        }
    }

    private mutating func add(_ filter: Filter, _ negated: Bool) {
        terms.append(filter)
        negations.append(negated)
    }

    public var isEmpty: Bool { terms.isEmpty && sort == .relevance }

    var words: [String] {
        zip(terms, negations).compactMap { term, negated in
            if case let .word(word) = term, !negated { return word }
            return nil
        }
    }
}

public enum Search {
    public static func run(_ text: String, in library: Library) -> [Thought] {
        run(Query(text), in: library)
    }

    public static func run(_ query: Query, in library: Library) -> [Thought] {
        let found = library.thoughts.filter { thought in
            zip(query.terms, query.negations).allSatisfy { term, negated in
                Self.matches(term, thought, library) != negated
            }
        }

        switch query.sort {
        case .updated: return found.sorted { $0.updatedAt > $1.updatedAt }
        case .created: return found.sorted { $0.createdAt > $1.createdAt }
        case .alias:
            return found.sorted { $0.title.localizedCaseInsensitiveCompare($1.title) == .orderedAscending }
        case .relevance:
            let words = query.words
            if words.isEmpty {
                return found.sorted { a, b in
                    if a.pinned != b.pinned { return a.pinned }
                    return a.updatedAt > b.updatedAt
                }
            }
            let scored = found.map { ($0, score($0, words)) }
            return scored.sorted { a, b in
                if a.1 != b.1 { return a.1 > b.1 }
                return a.0.updatedAt > b.0.updatedAt
            }.map(\.0)
        }
    }

    static func fold(_ text: String) -> String {
        text.folding(options: [.caseInsensitive, .diacriticInsensitive], locale: nil)
    }

    static func matches(_ filter: Query.Filter, _ thought: Thought, _ library: Library) -> Bool {
        switch filter {
        case let .word(word):
            let needle = fold(word)
            if fold(thought.alias ?? "").contains(needle) || fold(thought.content).contains(needle) { return true }
            return library.datasets(of: thought).contains { fold($0.alias).contains(needle) }
        case let .dataset(alias):
            return library.datasets(of: thought).contains { fold($0.alias) == fold(alias) }
        case let .state(state):
            switch state {
            case "draft": return thought.isDraft
            case "pinned": return thought.pinned
            case "locked": return thought.locked
            case "incomplete":
                return !thought.isDraft && Validation.issues(for: thought, in: library).contains { $0.kind == .missing }
            case "unvalidated": return !thought.validated
            case "proposed": return !library.proposals(for: thought.id).isEmpty
            default: return false
            }
        case let .author(name):
            return fold(thought.lastAuthor.name) == fold(name)
        case let .value(field, value):
            return library.fields(for: thought.datasetIds).contains { pair in
                fold(pair.field.name) == fold(field) && fold(thought.values[pair.field.id] ?? "") == fold(value)
            }
        }
    }

    static func score(_ thought: Thought, _ words: [String]) -> Int {
        let alias = fold(thought.alias ?? "")
        let content = fold(thought.content)
        return words.reduce(0) { total, word in
            let needle = fold(word)
            if alias.hasPrefix(needle) { return total + 4 }
            if alias.contains(needle) { return total + 3 }
            if content.contains(needle) { return total + 1 }
            return total
        }
    }
}

/// A kept query plus how to lay it out. Stored as data, so it can later arrive from a server
/// and render without an app update.
public struct SavedView: Codable, Hashable, Identifiable, Sendable {
    public enum Layout: Codable, Hashable, Sendable {
        case list
        case grid
        /// Columns by the value of any field with this name, like "status".
        case board(field: String)

        public var label: String {
            switch self {
            case .list: "list"
            case .grid: "grid"
            case let .board(field): "board by \(field)"
            }
        }
    }

    public var id: ID
    public var alias: String
    public var query: String
    public var layout: Layout
    public var createdAt: Date

    public init(id: ID, alias: String, query: String, layout: Layout, createdAt: Date) {
        self.id = id
        self.alias = alias
        self.query = query
        self.layout = layout
        self.createdAt = createdAt
    }

    /// Groups for a board, in the field's option order, then any other values, then "none".
    public func columns(_ thoughts: [Thought], in library: Library) -> [(title: String, thoughts: [Thought])] {
        guard case let .board(fieldName) = layout else { return [(alias, thoughts)] }

        func value(_ thought: Thought) -> String? {
            for pair in library.fields(for: thought.datasetIds)
            where pair.field.name.caseInsensitiveCompare(fieldName) == .orderedSame {
                if let value = thought.values[pair.field.id], !value.isEmpty { return value }
            }
            return nil
        }

        var order: [String] = library.datasets.flatMap(\.fields)
            .filter { $0.name.caseInsensitiveCompare(fieldName) == .orderedSame }
            .flatMap(\.options)
        var groups: [String: [Thought]] = [:]
        var none: [Thought] = []
        for thought in thoughts {
            if let value = value(thought) {
                groups[value, default: []].append(thought)
                if !order.contains(value) { order.append(value) }
            } else {
                none.append(thought)
            }
        }
        var seen = Set<String>()
        var columns = order.filter { seen.insert($0).inserted }.compactMap { key in
            groups[key].map { (title: key, thoughts: $0) }
        }
        if !none.isEmpty { columns.append((title: "none", thoughts: none)) }
        return columns
    }
}

import Foundation
import Testing
@testable import AlteredCore

private let now = Date(timeIntervalSince1970: 1_790_000_000)
private let seed = Seed.library(now: now)

@Suite struct FieldTests {
    @Test func dates() {
        #expect(Field.parseDate("2026-09-29") != nil)
        #expect(Field.parseDate("2026-02-30") == nil)
        #expect(Field.parseDate("2026-9-29") == nil)
        #expect(Field.parseDate("tomorrow") == nil)
    }

    @Test func typesJudgeValues() {
        let choice = Field(id: "c", name: "status", type: .choice, options: ["open", "locked"])
        #expect(choice.problem(with: "open") == nil)
        #expect(choice.problem(with: "maybe") != nil)
        #expect(choice.problem(with: "  ") == nil)

        #expect(Field(id: "n", name: "n", type: .number).problem(with: "3.5") == nil)
        #expect(Field(id: "n", name: "n", type: .number).problem(with: "three") != nil)
        #expect(Field(id: "t", name: "t", type: .toggle).problem(with: "yes") == nil)
        #expect(Field(id: "t", name: "t", type: .toggle).problem(with: "true") != nil)
        #expect(Field(id: "l", name: "l", type: .link).problem(with: "https://altered.computer") == nil)
        #expect(Field(id: "l", name: "l", type: .link).problem(with: "altered.computer") != nil)
    }
}

@Suite struct ValidationTests {
    @Test func seedIsValidExceptTheIncompleteExamples() {
        let failing = seed.thoughts.filter { !Validation.issues(for: $0, in: seed).isEmpty }.map(\.id)
        #expect(failing == ["t-closed", "t-costar"])
    }

    @Test func draftsMayLeaveRequiredValuesEmpty() {
        let edit = ThoughtEdit(alias: "", content: "A loose decision", datasetIds: ["ds-decisions"])
        #expect(Validation.issues(for: edit, id: nil, in: seed).isEmpty)

        var named = edit
        named.alias = "Named"
        let kinds = Validation.issues(for: named, id: nil, in: seed).map(\.kind)
        #expect(kinds == [.missing, .missing])
    }

    @Test func aliasesAreUniqueIgnoringCase() {
        let edit = ThoughtEdit(alias: "local FIRST", content: "x")
        #expect(Validation.issues(for: edit, id: nil, in: seed).map(\.kind) == [.alias])
        #expect(Validation.issues(for: edit, id: "t-local", in: seed).isEmpty)
    }

    @Test func normalizingDropsValuesWithoutAField() {
        let edit = ThoughtEdit(alias: " A ", content: " b ", datasetIds: ["ds-koa", "ds-koa", "nope"],
                               values: ["f-phase": "loop", "f-status": "open"])
        let clean = Validation.normalized(edit, library: seed)
        #expect(clean.alias == "A")
        #expect(clean.content == "b")
        #expect(clean.datasetIds == ["ds-koa"])
        #expect(clean.values == ["f-phase": "loop"])
        #expect(Validation.strayValues(in: edit, library: seed) == ["f-status"])
    }
}

@Suite struct MutationTests {
    func apply(_ mutations: Mutation..., to library: Library = seed) throws -> Library {
        var next = library
        for mutation in mutations { try mutation.apply(to: &next) }
        return next
    }

    @Test func editsAppendRevisionsAndTrackAuthorship() throws {
        let before = seed.thought("t-prevent")!
        var edit = before.editable
        edit.content = "Ask before building anything that might look wrong. Always."
        let after = try apply(.editThought(id: "t-prevent", edit: edit, author: .koa, note: "extended", at: now))
        let thought = after.thought("t-prevent")!
        #expect(thought.version == before.version + 1)
        #expect(thought.lastAuthor == .koa)
        #expect(thought.validated == false)

        let validated = try apply(.setValidated(id: "t-prevent", true), to: after)
        #expect(validated.thought("t-prevent")!.validated)
    }

    @Test func unchangedEditsAddNoRevision() throws {
        let before = seed.thought("t-prevent")!
        let after = try apply(.editThought(id: "t-prevent", edit: before.editable, author: .you, note: "", at: now))
        #expect(after.thought("t-prevent")!.version == before.version)
    }

    @Test func lockedThoughtsRefuseChanges() {
        let edit = seed.thought("t-enemy")!.editable
        #expect(throws: MutationError.self) {
            try apply(.editThought(id: "t-enemy", edit: edit, author: .you, note: "", at: now))
        }
        #expect(throws: MutationError.self) { try apply(.deleteThought(id: "t-enemy")) }
    }

    @Test func invalidEditsAreRefused() {
        var edit = seed.thought("t-freeze")!.editable
        edit.values["f-status"] = "maybe"
        #expect(throws: MutationError.self) {
            try apply(.editThought(id: "t-freeze", edit: edit, author: .you, note: "", at: now))
        }
    }

    @Test func restoreWritesANewRevision() throws {
        let after = try apply(.restore(id: "t-types", version: 1, at: now))
        let thought = after.thought("t-types")!
        #expect(thought.content == "Text is enough to start.")
        #expect(thought.alias == "Schema types")
        #expect(thought.revisions.last?.note == "restored v1")
        #expect(thought.version == 3)
    }

    @Test func linksAreStoredFromBothEnds() throws {
        let after = try apply(.link(from: "t-prevent", kind: .parent, to: "t-draft"))
        #expect(after.thought("t-prevent")!.relations.contains(Relation(.parent, to: "t-draft")))
        #expect(after.thought("t-draft")!.relations.contains(Relation(.child, to: "t-prevent")))

        let unlinked = try apply(.unlink(from: "t-draft", to: "t-prevent"), to: after)
        #expect(!unlinked.thought("t-prevent")!.relations.contains { $0.to == "t-draft" })
    }

    @Test func deletingAThoughtRemovesLinksAndProposals() throws {
        let after = try apply(.deleteThought(id: "t-name"))
        #expect(after.thought("t-name") == nil)
        #expect(after.proposals.allSatisfy { $0.thoughtId != "t-name" })

        let linked = try apply(.deleteThought(id: "t-versioned"))
        #expect(linked.thoughts.allSatisfy { thought in !thought.relations.contains { $0.to == "t-versioned" } })
    }

    @Test func requiredFieldsCanFillExistingThoughts() throws {
        let field = Field(id: "f-owner", name: "owner", type: .text)
        let after = try apply(.addField(datasetId: "ds-ideas", field: field, fill: "owner", at: now))
        let ideas = after.thoughts(in: "ds-ideas")
        #expect(!ideas.isEmpty)
        #expect(ideas.allSatisfy { $0.values["f-owner"] == "owner" })
        #expect(ideas.allSatisfy { $0.revisions.last?.note == "filled ideas.owner" })

        let unfilled = try apply(.addField(datasetId: "ds-ideas", field: field, fill: nil, at: now))
        let incomplete = unfilled.thoughts(in: "ds-ideas").filter { !$0.isDraft }
        #expect(incomplete.allSatisfy { thought in
            Validation.issues(for: thought, in: unfilled).contains { $0.kind == .missing }
        })
    }

    @Test func fieldRulesAreEnforced() {
        let bad = Field(id: "x", name: "Status", type: .text)
        #expect(throws: MutationError.self) { try apply(.addField(datasetId: "ds-ideas", field: bad, fill: nil, at: now)) }
        let empty = Field(id: "x", name: "pick", type: .choice)
        #expect(throws: MutationError.self) { try apply(.addField(datasetId: "ds-ideas", field: empty, fill: nil, at: now)) }
        var retyped = seed.dataset("ds-decisions")!.fields[0]
        retyped.type = .text
        #expect(throws: MutationError.self) { try apply(.editField(datasetId: "ds-decisions", field: retyped, at: now)) }
    }

    @Test func removingAFieldDropsItsValues() throws {
        let after = try apply(.removeField(datasetId: "ds-koa", fieldId: "f-phase", at: now))
        #expect(after.thoughts(in: "ds-koa").allSatisfy { $0.values["f-phase"] == nil })
        #expect(after.dataset("ds-koa")!.fields.isEmpty)
    }

    @Test func deletingADatasetUntagsItsThoughts() throws {
        let after = try apply(.deleteDataset(id: "ds-marketing", at: now))
        #expect(after.dataset("ds-marketing") == nil)
        #expect(after.thoughts.allSatisfy { !$0.datasetIds.contains("ds-marketing") })
        #expect(after.thought("t-draft")!.values["f-channel"] == nil)
    }

    @Test func datasetNamesFollowTheRules() {
        #expect(Mutation.datasetAliasProblem("open-questions", id: "x", in: seed) == nil)
        #expect(Mutation.datasetAliasProblem("Open Questions", id: "x", in: seed) != nil)
        #expect(Mutation.datasetAliasProblem("ideas", id: "x", in: seed) != nil)
        #expect(Mutation.datasetAliasProblem("ideas", id: "ds-ideas", in: seed) == nil)
    }

    @Test func acceptingAProposalIsAgentAuthored() throws {
        let after = try apply(.acceptProposal(id: "p-house", at: now))
        let thought = after.thought("t-draft-house")!
        #expect(thought.alias == "Clean house, clean mind")
        #expect(thought.lastAuthor == .koa)
        #expect(!thought.validated)
        #expect(after.proposal("p-house") == nil)
    }

    @Test func viewsNeedUniqueNames() throws {
        let view = SavedView(id: "v-new", alias: "open questions", query: "#ideas", layout: .grid, createdAt: now)
        #expect(throws: MutationError.self) { try apply(.saveView(view)) }
        var renamed = view
        renamed.alias = "Ideas grid"
        try #expect(apply(.saveView(renamed)).view("v-new")?.layout == .grid)
    }
}

@Suite struct DiffTests {
    @Test func partsRebuildBothTexts() {
        let old = "Open instantly from disk. Never a spinner."
        let new = "Open instantly from disk. Sync quietly, never a blocking spinner."
        let parts = Diff.words(from: old, to: new)
        #expect(parts.filter { $0.kind != .added }.map(\.text).joined() == old)
        #expect(parts.filter { $0.kind != .removed }.map(\.text).joined() == new)
        #expect(parts.contains { $0.kind == .added && $0.text.contains("blocking") })
    }

    @Test func identicalTextsAreOnePart() {
        #expect(Diff.words(from: "same text", to: "same text") == [DiffPart(kind: .same, text: "same text")])
        #expect(Diff.words(from: "", to: "new") == [DiffPart(kind: .added, text: "new")])
    }
}

@Suite struct SearchTests {
    func ids(_ query: String) -> [ID] { Search.run(query, in: seed).map(\.id) }

    @Test func wordsMatchAliasContentAndDatasets() {
        #expect(ids("ledger").first == "t-ledger")
        #expect(Set(ids("koa")).isSuperset(of: ["t-remembers", "t-reach", "t-voice"]))
        #expect(ids("zzzz").isEmpty)
    }

    @Test func filtersCombineAndNegate() {
        #expect(Set(ids("#questions")) == ["t-name", "t-sync", "t-types"])
        #expect(Set(ids("#questions answered:no")) == ["t-name", "t-sync"])
        #expect(Set(ids("#questions -answered:no")) == ["t-types"])
        #expect(Set(ids("is:draft")) == ["t-draft-distill", "t-draft-house", "t-draft-compare", "t-draft-backlinks"])
        #expect(Set(ids("is:incomplete")) == ["t-closed", "t-costar"])
        #expect(Set(ids("is:proposed")) == ["t-draft-house", "t-name"])
        #expect(ids("by:koa") == ["t-local"])
    }

    @Test func emptyQueryPutsPinnedFirst() {
        let all = Search.run("", in: seed)
        #expect(all.count == seed.thoughts.count)
        #expect(all.prefix(3).allSatisfy { $0.pinned })
    }

    @Test func unknownTokensAreReported() {
        #expect(Query("is:nothing sort:size").unknown == ["is:nothing", "sort:size"])
        #expect(Query("#ideas sort:alias").sort == .alias)
    }

    @Test func boardsGroupByFieldOptions() {
        let view = seed.view("v-decisions")!
        let columns = view.columns(Search.run(view.query, in: seed), in: seed)
        #expect(columns.map(\.title) == ["open", "locked"])
        #expect(seed.views.allSatisfy { Query($0.query).unknown.isEmpty })
    }
}

@Suite struct AgentTests {
    @Test func proposesAliasesAndTighterWording() {
        var library = seed
        library.proposals = []
        let proposals = Agent.review(library, now: now)
        let byThought = Dictionary(uniqueKeysWithValues: proposals.map { ($0.thoughtId, $0) })
        #expect(byThought["t-draft-backlinks"]?.edit.alias == "Backlinks point at the exact")
        let tightened = byThought["t-draft-compare"]?.edit.content
        #expect(tightened == "I want to compare value propositions side by side, as rows with attributes.")
        #expect(proposals.allSatisfy { !library.thought($0.thoughtId)!.locked })
    }

    @Test func skipsThoughtsThatAlreadyHaveProposals() {
        let proposals = Agent.review(seed, now: now)
        #expect(!proposals.contains { $0.thoughtId == "t-draft-house" })
    }
}

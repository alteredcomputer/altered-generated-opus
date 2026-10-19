import Foundation
import SwiftData
import Testing
@testable import NativeErgonomics

/// Store behaviour against a fresh in-memory library seeded like a first launch.
@MainActor
struct StoreTests {
    let store: Store
    let undo: UndoManager

    init() throws {
        let container = try ModelContainer(
            for: Schema(storeModels), configurations: ModelConfiguration(isStoredInMemoryOnly: true)
        )
        store = Store(container: container)
        store.prepare(seedingWith: nil)
        undo = UndoManager()
        undo.groupsByEvent = false
    }

    private func all() throws -> [Thought] {
        try store.context.fetch(FetchDescriptor<Thought>(sortBy: ThoughtSort.modified.descriptors))
    }

    private func dataset(_ alias: String) throws -> Dataset {
        try #require(store.allDatasets().first { $0.alias == alias })
    }

    // MARK: - Seed

    @Test func seedMatchesTheWebEditor() throws {
        let thoughts = try all()
        #expect(thoughts.count == Seed.thoughts.count)
        #expect(thoughts.count == 25)
        #expect(store.allDatasets().map(\.alias).sorted() == Seed.datasets.map(\.alias).sorted())
        #expect(try store.context.fetchCount(FetchDescriptor<FieldSchema>()) == 4)
        #expect(thoughts.first?.title == "Time is the only enemy")
        #expect(Set(thoughts.map(\.id)).count == thoughts.count)
    }

    @Test func seedFieldsBelongToTheThoughtsDatasets() throws {
        for thought in try all() {
            for attribute in thought.attributes {
                let schemaId = try #require(attribute.schemaId, "\(attribute.name) has no field")
                let owner = thought.datasets.first { $0.schemas.contains { $0.id == schemaId } }
                #expect(owner != nil)
            }
            #expect(thought.searchText.contains(thought.title.lowercased()))
        }
    }

    @Test func seedingHappensOncePerInstall() throws {
        let defaults = try #require(UserDefaults(suiteName: "native-tests-\(UUID().uuidString)"))
        store.prepare(seedingWith: defaults)
        #expect(defaults.bool(forKey: "seeded"))
        store.delete(try all(), undo: undo)
        store.prepare(seedingWith: defaults)
        #expect(try all().isEmpty)
    }

    // MARK: - Editing

    @Test func stagedTextSavesOnCommit() throws {
        let thought = try #require(store.createThought())
        store.stage("Hello\nWorld", for: thought)
        #expect(thought.content == "")
        store.commit()
        #expect(thought.content == "Hello\nWorld")
        #expect(thought.title == "Hello")
        #expect(thought.snippet == "World")
    }

    @Test func emptyThoughtsAreDiscardedOnLeave() throws {
        let before = try all().count
        let empty = try #require(store.createThought())
        let token = UUID()
        store.editor(token, shows: empty.id)
        store.closeEditor(token, opened: empty.id)
        #expect(try all().count == before)
    }

    @Test func textTypedJustBeforeLeavingIsKept() throws {
        let thought = try #require(store.createThought())
        store.stage("Kept", for: thought)
        store.closeEditor(UUID(), opened: thought.id)
        #expect(store.thought(id: thought.id)?.content == "Kept")
    }

    @Test func steppingAwayDiscardsTheOneLeft() throws {
        let fresh = try #require(store.createThought())
        let next = try #require(try all().first { $0.id != fresh.id })
        let token = UUID()
        store.editor(token, shows: fresh.id)
        #expect(store.discardIfEmpty(id: fresh.id))
        store.editor(token, shows: next.id)
        store.closeEditor(token, opened: fresh.id)
        #expect(store.thought(id: next.id) != nil)
    }

    @Test func newThoughtsJoinTheDatasetsInView() throws {
        let koa = try dataset("koa")
        let thought = try #require(store.createThought(in: [koa.id]))
        #expect(thought.datasetLine == "koa")
    }

    // MARK: - Undo

    @Test func deleteIsUndoable() throws {
        let target = try #require(try all().first { $0.alias == "Event ledger first" })
        let id = target.id
        let count = try all().count
        store.delete([target], undo: undo)
        #expect(try all().count == count - 1)
        #expect(store.notice?.undoable == true)

        undo.undo()
        let restored = try #require(store.thought(id: id))
        #expect(restored.datasetLine == "decisions, koa")
        #expect(restored.attributes.count == 2)
        #expect(try all().count == count)

        undo.redo()
        #expect(store.thought(id: id) == nil)
    }

    @Test func datasetToggleIsUndoableAndDetachesFields() throws {
        let decisions = try dataset("decisions")
        let thought = try #require(try all().first { $0.alias == "Local first" })
        #expect(thought.attributes.first?.schemaId != nil)

        store.toggle(decisions, for: [thought], undo: undo)
        #expect(!thought.datasetIDs.contains(decisions.id))
        #expect(thought.attributes.first?.schemaId == nil)
        #expect(thought.attributes.first?.value == "prototype")

        undo.undo()
        #expect(thought.datasetIDs.contains(decisions.id))
        #expect(thought.attributes.first?.schemaId != nil)
    }

    @Test func toggleAddsAllUnlessAllAreIn() throws {
        let ideas = try dataset("ideas")
        let thoughts = Array(try all().prefix(3))
        store.toggle(ideas, for: thoughts, undo: undo)
        #expect(thoughts.allSatisfy { $0.datasetIDs.contains(ideas.id) })
        store.toggle(ideas, for: thoughts, undo: undo)
        #expect(thoughts.allSatisfy { !$0.datasetIDs.contains(ideas.id) })
    }

    // MARK: - Details

    @Test func detailsValidateLikeTheWeb() throws {
        let thought = try #require(try all().first)
        #expect(throws: ValidationError.self) {
            try store.saveDetails(
                thought, alias: "x", datasetIds: thought.datasetIDs,
                attributes: [ThoughtAttribute(name: " ", value: "value")]
            )
        }
        try store.saveDetails(
            thought, alias: "  Renamed  ", datasetIds: thought.datasetIDs,
            attributes: thought.attributes + [ThoughtAttribute(name: "mood", value: "calm")]
        )
        #expect(thought.alias == "Renamed")
        #expect(thought.searchText.contains("calm"))
    }

    // MARK: - Datasets

    @Test func datasetsAreValidatedAndRenamesReindex() throws {
        #expect(throws: ValidationError.self) { try store.createDataset(alias: "IDEAS") }
        let koa = try dataset("koa")
        try store.rename(koa, to: "agent")
        let member = try #require(koa.thoughts.first)
        #expect(member.datasetLine.contains("agent"))
        #expect(member.searchText.contains("agent"))
    }

    @Test func deletingADatasetKeepsItsThoughtsAndValues() throws {
        let koa = try dataset("koa")
        let member = try #require(koa.thoughts.first { $0.alias == "Koa remembers decisions" })
        let count = try all().count
        store.deleteDataset(koa)
        #expect(try all().count == count)
        #expect(member.datasets.isEmpty)
        #expect(member.attributes.first?.value == "memory")
        #expect(member.attributes.first?.schemaId == nil)
    }

    // MARK: - Sort and search

    @Test func titleSortIsAlphabetical() throws {
        let titles = try store.context
            .fetch(FetchDescriptor<Thought>(sortBy: ThoughtSort.title.descriptors))
            .map(\.title)
        #expect(titles == titles.sorted { $0.localizedStandardCompare($1) == .orderedAscending })
    }

    @Test func searchFindsByDatasetAndAttribute() throws {
        let thoughts = try all()
        let found = Search.filter(thoughts, query: "koa loop", allowed: nil, id: \.id, haystack: \.searchText)
        #expect(found.map(\.alias) == ["Voice notes are source data"])
    }
}

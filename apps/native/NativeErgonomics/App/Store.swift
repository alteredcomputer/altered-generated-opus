import Foundation
import SwiftData
import UIKit

/// A short message after a change, with Undo when the change can be taken back.
struct Notice: Equatable, Identifiable {
    let id = UUID()
    let message: String
    let undoable: Bool
}

/// A haptic for the root view to play. `tick` makes two of the same kind in a row distinct.
struct Feedback: Equatable {
    enum Kind { case created, removed, toggled, copied, undone }
    let kind: Kind
    let tick: Int
}

/// Everything needed to bring a deleted thought back, as plain values.
nonisolated struct ThoughtRecord: Sendable {
    let id: UUID
    let alias: String?
    let content: String
    let datasetIds: Set<UUID>
    let attributes: [ThoughtAttribute]
    let createdAt: Date
    let updatedAt: Date
    let addedAt: Date

    @MainActor init(_ thought: Thought) {
        id = thought.id
        alias = thought.alias
        content = thought.content
        datasetIds = thought.datasetIDs
        attributes = thought.attributes
        createdAt = thought.createdAt
        updatedAt = thought.updatedAt
        addedAt = thought.addedAt
    }
}

/// One thought's datasets and attributes, which change together when it joins or leaves one.
nonisolated struct Membership: Sendable {
    let thoughtId: UUID
    let datasetIds: Set<UUID>
    let attributes: [ThoughtAttribute]
    let updatedAt: Date

    @MainActor init(_ thought: Thought) {
        self.init(
            thoughtId: thought.id, datasetIds: thought.datasetIDs,
            attributes: thought.attributes, updatedAt: thought.updatedAt
        )
    }

    init(thoughtId: UUID, datasetIds: Set<UUID>, attributes: [ThoughtAttribute], updatedAt: Date) {
        self.thoughtId = thoughtId
        self.datasetIds = datasetIds
        self.attributes = attributes
        self.updatedAt = updatedAt
    }
}

/// The app's one writer. Views read through `@Query` and change data only through here, so every
/// write is saved, logged, and (for delete and dataset moves) undoable in one place.
@Observable
final class Store {
    let container: ModelContainer
    var context: ModelContext { container.mainContext }

    private(set) var notice: Notice?
    /// A failed write, shown as an alert. Validation problems are thrown to the form instead.
    var failure: String?
    private(set) var feedback: Feedback?
    /// Bumped by Cmd-F; the search tab opens its field when it changes.
    private(set) var searchRequests = 0

    /// Used when the environment has no undo manager, so Undo always works.
    let fallbackUndo = UndoManager()
    @ObservationIgnored private var pending: (thought: Thought, content: String)?
    @ObservationIgnored private var commitTask: Task<Void, Never>?
    @ObservationIgnored private var noticeTask: Task<Void, Never>?
    /// Which thought each open editor shows, by its route's token. Previous and next change it.
    @ObservationIgnored private var editors: [UUID: UUID] = [:]
    @ObservationIgnored private var ticks = 0

    /// How long typing pauses before the text is saved.
    static let autosaveDelay = Duration.milliseconds(400)

    init(container: ModelContainer) {
        self.container = container
    }

    // MARK: - Launch

    /// Clears empty thoughts left by a crash, then seeds the demo library once per install. With
    /// no defaults (an in-memory store), it seeds whenever the store is empty.
    func prepare(seedingWith defaults: UserDefaults?) {
        purgeEmpty()
        let key = "seeded"
        if defaults?.bool(forKey: key) == true { return }
        if fetch(FetchDescriptor<Thought>()).isEmpty, allDatasets().isEmpty {
            Seed.insert(into: context)
            guard save("seed the demo library") else { return }
        }
        defaults?.set(true, forKey: key)
    }

    private func purgeEmpty() {
        let blank = fetch(FetchDescriptor<Thought>(predicate: #Predicate<Thought> { $0.title == "" }))
            .filter(\.isEmpty)
        guard !blank.isEmpty else { return }
        for thought in blank { context.delete(thought) }
        save("clear \(blank.count) empty thoughts")
    }

    // MARK: - Reads

    func thought(id: UUID) -> Thought? {
        fetch(FetchDescriptor<Thought>(predicate: #Predicate<Thought> { $0.id == id })).first
    }

    func thoughts(ids: [UUID]) -> [Thought] {
        fetch(FetchDescriptor<Thought>(predicate: #Predicate<Thought> { ids.contains($0.id) }))
    }

    func allDatasets() -> [Dataset] {
        fetch(FetchDescriptor<Dataset>(sortBy: [SortDescriptor(\Dataset.alias)]))
    }

    private func schemaInfo() -> [UUID: SchemaInfo] {
        var info: [UUID: SchemaInfo] = [:]
        for schema in fetch(FetchDescriptor<FieldSchema>()) {
            guard let dataset = schema.dataset else { continue }
            info[schema.id] = SchemaInfo(datasetId: dataset.id, name: schema.name, kind: schema.kind)
        }
        return info
    }

    private func fetch<Model: PersistentModel>(_ descriptor: FetchDescriptor<Model>) -> [Model] {
        do {
            return try context.fetch(descriptor)
        } catch {
            report("read \(Model.self)", error)
            return []
        }
    }

    // MARK: - Thoughts

    /// A new empty thought in the given datasets. It is discarded if left empty.
    func createThought(in datasetIds: Set<UUID> = []) -> Thought? {
        commit()
        let thought = Thought()
        context.insert(thought)
        thought.datasets = allDatasets().filter { datasetIds.contains($0.id) }
        thought.reindex()
        guard save("create a thought") else { return nil }
        haptic(.created)
        return thought
    }

    /// Holds the editor's text and saves it once typing pauses, so a keystroke never waits on
    /// a write and the list does not re-sort under the person's finger.
    func stage(_ content: String, for thought: Thought) {
        if let pending, pending.thought.id != thought.id { commit() }
        pending = (thought, content)
        commitTask?.cancel()
        commitTask = Task { [weak self] in
            guard (try? await Task.sleep(for: Store.autosaveDelay)) != nil else { return }
            self?.commit()
        }
    }

    /// Saves staged text now. Every other write calls this first, so nothing typed is lost.
    func commit() {
        commitTask?.cancel()
        commitTask = nil
        guard let staged = pending else { return }
        pending = nil
        let (thought, content) = staged
        guard thought.modelContext != nil, !thought.isDeleted, thought.content != content else { return }
        thought.content = content
        thought.updatedAt = .now
        thought.reindex()
        save("save a thought")
    }

    /// Records which thought an editor shows, so leaving it discards the right one if empty.
    func editor(_ token: UUID, shows id: UUID) {
        editors[token] = id
    }

    /// Called when an editor leaves the navigation stack.
    func closeEditor(_ token: UUID, opened id: UUID) {
        let shown = editors.removeValue(forKey: token) ?? id
        discardIfEmpty(id: shown)
    }

    /// Deletes the thought if it has nothing in it. Not undoable: there is nothing to restore.
    @discardableResult
    func discardIfEmpty(id: UUID) -> Bool {
        commit()
        guard let thought = thought(id: id), thought.isEmpty else { return false }
        context.delete(thought)
        return save("discard an empty thought")
    }

    func delete(_ thoughts: [Thought], undo environment: UndoManager?) {
        guard !thoughts.isEmpty else { return }
        commit()
        let records = thoughts.map { ThoughtRecord($0) }
        for thought in thoughts { context.delete(thought) }
        guard save("delete \(records.count) thoughts") else { return }
        register(undoer(environment), name: "Delete") { [self] manager in
            restore(records, undo: manager)
        }
        announce(records.count == 1 ? "Thought deleted" : "\(records.count) thoughts deleted", undoable: true)
        haptic(.removed)
    }

    private func restore(_ records: [ThoughtRecord], undo: UndoManager) {
        let datasets = byId(allDatasets())
        for record in records {
            let thought = Thought(
                id: record.id, alias: record.alias, content: record.content,
                attributes: record.attributes, createdAt: record.createdAt,
                updatedAt: record.updatedAt, addedAt: record.addedAt
            )
            context.insert(thought)
            thought.datasets = record.datasetIds.compactMap { datasets[$0] }
            thought.reindex()
        }
        guard save("restore \(records.count) thoughts") else { return }
        let ids = records.map(\.id)
        register(undo, name: "Delete") { [self] manager in
            delete(thoughts(ids: ids), undo: manager)
        }
        announce(records.count == 1 ? "Thought restored" : "\(records.count) thoughts restored", undoable: false)
        haptic(.undone)
    }

    /// Adds every thought to the dataset, or removes them all when they are all already in it,
    /// the way a checkmark menu reads.
    func toggle(_ dataset: Dataset, for thoughts: [Thought], undo environment: UndoManager?) {
        guard !thoughts.isEmpty else { return }
        commit()
        let joining = !thoughts.allSatisfy { $0.datasetIDs.contains(dataset.id) }
        let changes = thoughts.map { thought in
            var ids = thought.datasetIDs
            if joining { ids.insert(dataset.id) } else { ids.remove(dataset.id) }
            return Membership(thoughtId: thought.id, datasetIds: ids, attributes: thought.attributes, updatedAt: .now)
        }
        let noun = thoughts.count == 1 ? "" : " \(thoughts.count) thoughts"
        let message = joining ? "Added\(noun) to \(dataset.alias)" : "Removed\(noun) from \(dataset.alias)"
        apply(changes, undo: undoer(environment), name: joining ? "Add to Dataset" : "Remove from Dataset", message: message)
    }

    /// Sets each thought's datasets and attributes exactly, registering the opposite change.
    private func apply(_ changes: [Membership], undo: UndoManager, name: String, message: String) {
        let targets = byId(thoughts(ids: changes.map(\.thoughtId)))
        let previous = changes.compactMap { targets[$0.thoughtId].map { Membership($0) } }
        let datasets = byId(allDatasets())
        let schemas = schemaInfo()
        for change in changes {
            guard let thought = targets[change.thoughtId] else { continue }
            thought.datasets = change.datasetIds.compactMap { datasets[$0] }
            thought.attributes = Rules.detach(change.attributes, keeping: change.datasetIds, schemas: schemas)
            thought.updatedAt = change.updatedAt
            thought.reindex()
        }
        guard save(name.lowercased()) else { return }
        register(undo, name: name) { [self] manager in
            apply(previous, undo: manager, name: name, message: "Undone: \(message)")
        }
        announce(message, undoable: true)
        haptic(.toggled)
    }

    func duplicate(_ thought: Thought) -> Thought? {
        commit()
        let copy = Thought(
            alias: thought.alias, content: thought.content,
            attributes: thought.attributes.map {
                ThoughtAttribute(name: $0.name, value: $0.value, schemaId: $0.schemaId)
            }
        )
        context.insert(copy)
        copy.datasets = thought.datasets
        copy.reindex()
        guard save("duplicate a thought") else { return nil }
        announce("Thought duplicated", undoable: false)
        haptic(.created)
        return copy
    }

    func copy(_ thoughts: [Thought]) {
        guard !thoughts.isEmpty else { return }
        commit()
        //  UIKit: SwiftUI on iOS has no way to write the clipboard (PasteButton only reads).
        UIPasteboard.general.string = Rules.clipboardText(thoughts.map(\.content))
        Log.store.info("copied \(thoughts.count) thoughts")
        announce(thoughts.count == 1 ? "Copied" : "Copied \(thoughts.count) thoughts", undoable: false)
        haptic(.copied)
    }

    /// The details sheet's save: alias, datasets, and attributes, validated like the web model.
    func saveDetails(
        _ thought: Thought, alias: String, datasetIds: Set<UUID>, attributes: [ThoughtAttribute]
    ) throws(ValidationError) {
        commit()
        let schemas = schemaInfo()
        let cleaned = try Rules.clean(
            Rules.detach(attributes, keeping: datasetIds, schemas: schemas), schemas: schemas
        )
        let members = Rules.datasets(datasetIds, implied: cleaned, schemas: schemas)
        let trimmed = alias.trimmingCharacters(in: .whitespacesAndNewlines)
        thought.alias = trimmed.isEmpty ? nil : trimmed
        thought.datasets = allDatasets().filter { members.contains($0.id) }
        thought.attributes = cleaned
        thought.updatedAt = .now
        thought.reindex()
        save("save a thought's details")
    }

    // MARK: - Datasets

    @discardableResult
    func createDataset(alias: String) throws(ValidationError) -> Dataset? {
        let existing = allDatasets().map { (id: $0.id, alias: $0.alias) }
        let name = try Rules.checkAlias(alias, existing: existing, excluding: nil)
        let dataset = Dataset(alias: name)
        context.insert(dataset)
        guard save("create a dataset") else { return nil }
        announce("Created \(name)", undoable: false)
        haptic(.created)
        return dataset
    }

    func rename(_ dataset: Dataset, to alias: String) throws(ValidationError) {
        let existing = allDatasets().map { (id: $0.id, alias: $0.alias) }
        let name = try Rules.checkAlias(alias, existing: existing, excluding: dataset.id)
        guard name != dataset.alias else { return }
        dataset.alias = name
        dataset.updatedAt = .now
        for thought in dataset.thoughts { thought.reindex() }
        save("rename a dataset")
    }

    /// Deletes the dataset and its fields. Its thoughts stay; their values for its fields stay as
    /// free attributes, as on the web.
    func deleteDataset(_ dataset: Dataset) {
        commit()
        let schemas = schemaInfo()
        let alias = dataset.alias
        for thought in dataset.thoughts {
            var kept = thought.datasetIDs
            kept.remove(dataset.id)
            thought.attributes = Rules.detach(thought.attributes, keeping: kept, schemas: schemas)
            thought.datasets.removeAll { $0.id == dataset.id }
            thought.reindex()
        }
        context.delete(dataset)
        guard save("delete a dataset") else { return }
        announce("Deleted \(alias)", undoable: false)
        haptic(.removed)
    }

    // MARK: - Undo, notices, haptics

    func undoer(_ environment: UndoManager?) -> UndoManager {
        environment ?? fallbackUndo
    }

    func undo(_ environment: UndoManager?) {
        let manager = undoer(environment)
        notice = nil
        guard manager.canUndo else { return }
        manager.undo()
    }

    func dismissNotice() {
        notice = nil
    }

    func requestSearch() {
        searchRequests += 1
    }

    /// One undo step per action, named for the Undo menu that shake and three-finger swipe show.
    private func register(
        _ undo: UndoManager, name: String, _ action: @escaping @MainActor @Sendable (UndoManager) -> Void
    ) {
        undo.beginUndoGrouping()
        undo.registerUndo(withTarget: undo) { manager in
            MainActor.assumeIsolated { action(manager) }
        }
        undo.setActionName(name)
        undo.endUndoGrouping()
    }

    private func announce(_ message: String, undoable: Bool) {
        let notice = Notice(message: message, undoable: undoable)
        self.notice = notice
        noticeTask?.cancel()
        noticeTask = Task { [weak self] in
            guard (try? await Task.sleep(for: .seconds(4))) != nil else { return }
            if self?.notice?.id == notice.id { self?.notice = nil }
        }
    }

    private func haptic(_ kind: Feedback.Kind) {
        ticks += 1
        feedback = Feedback(kind: kind, tick: ticks)
    }

    // MARK: - Saving

    @discardableResult
    private func save(_ operation: String) -> Bool {
        do {
            try context.save()
            Log.store.info("\(operation, privacy: .public)")
            return true
        } catch {
            context.rollback()
            report(operation, error)
            return false
        }
    }

    private func report(_ operation: String, _ error: any Error) {
        Log.store.error("\(operation, privacy: .public) failed: \(error.localizedDescription, privacy: .public)")
        failure = "Could not \(operation). \(error.localizedDescription)"
    }

    private func byId<Model: PersistentModel>(_ models: [Model]) -> [UUID: Model] where Model: HasUUID {
        Dictionary(models.map { ($0.id, $0) }, uniquingKeysWith: { first, _ in first })
    }
}

/// The models' own `id`, for keying lookups.
protocol HasUUID { var id: UUID { get } }
extension Thought: HasUUID {}
extension Dataset: HasUUID {}

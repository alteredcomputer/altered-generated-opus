import Foundation
import Testing
@testable import AlteredCore

/// Answers pushes from a script, in order, after a short pause so tests can look mid-flight.
private actor ScriptedServer: SyncServer {
    private var results: [Result<Void, SyncError>]
    private(set) var pushed: [String] = []

    init(_ results: [Result<Void, SyncError>]) {
        self.results = results
    }

    func push(_ mutation: Mutation, conditions: NetworkConditions) async -> Result<Void, SyncError> {
        guard conditions.online else { return .failure(.offline) }
        try? await Task.sleep(for: .milliseconds(30))
        pushed.append(mutation.summary)
        return results.isEmpty ? .success(()) : results.removeFirst()
    }
}

@MainActor
private func settle(_ store: Store, timeout: Duration = .seconds(3)) async {
    let clock = ContinuousClock()
    let deadline = clock.now + timeout
    while (!store.outbox.isEmpty || store.sending != nil) && clock.now < deadline {
        try? await Task.sleep(for: .milliseconds(10))
    }
}

@MainActor
@Suite struct StoreTests {
    let now = Date(timeIntervalSince1970: 1_790_000_000)
    var seed: Library { Seed.library(now: now) }

    func edit(_ id: ID, content: String, in library: Library) -> Mutation {
        var edit = library.thought(id)!.editable
        edit.content = content
        return .editThought(id: id, edit: edit, author: .you, note: "edited", at: now)
    }

    @Test func changesShowBeforeTheServerConfirms() async throws {
        let store = Store(snapshot: Snapshot(confirmed: seed), server: ScriptedServer([.success(())]))
        try store.perform(.setPinned(id: "t-prevent", true))

        #expect(store.library.thought("t-prevent")!.pinned)
        #expect(!store.confirmed.thought("t-prevent")!.pinned)
        #expect(store.isPending("t-prevent"))

        await settle(store)
        #expect(store.confirmed.thought("t-prevent")!.pinned)
        #expect(!store.isPending("t-prevent"))
    }

    @Test func overlappingChangesComposeAndConfirmInOrder() async throws {
        let server = ScriptedServer([])
        let store = Store(snapshot: Snapshot(confirmed: seed), server: server)
        try store.perform(edit("t-prevent", content: "first", in: store.library))
        try store.perform(edit("t-prevent", content: "second", in: store.library))
        try store.perform(.setPinned(id: "t-prevent", true))

        #expect(store.library.thought("t-prevent")!.content == "second")
        #expect(store.outbox.count == 3)

        await settle(store)
        let thought = store.confirmed.thought("t-prevent")!
        #expect(thought.content == "second")
        #expect(thought.pinned)
        #expect(thought.version == seed.thought("t-prevent")!.version + 2)
        #expect(await server.pushed == ["edit thought", "edit thought", "pin"])
    }

    @Test func aRejectedChangeRollsBackAndKeepsLaterOnes() async throws {
        let store = Store(snapshot: Snapshot(confirmed: seed), server: ScriptedServer([.failure(.rejected("no")), .success(())]))
        var events: [StoreEvent] = []
        store.onEvent = { events.append($0) }

        try store.perform(.setPinned(id: "t-prevent", true))
        try store.perform(.setLocked(id: "t-reach", true))
        await settle(store)

        #expect(!store.library.thought("t-prevent")!.pinned)
        #expect(store.library.thought("t-reach")!.locked)
        #expect(events.contains(.rolledBack("pin", reason: "no")))
    }

    @Test func changesThatDependOnARejectedOneAreDroppedToo() async throws {
        let store = Store(snapshot: Snapshot(confirmed: seed), server: ScriptedServer([.failure(.rejected("no"))]))
        var events: [StoreEvent] = []
        store.onEvent = { events.append($0) }

        try store.perform(.createThought(id: "t-new", edit: ThoughtEdit(alias: "New", content: "x"), author: .you, at: now))
        try store.perform(.setPinned(id: "t-new", true))
        #expect(store.library.thought("t-new")!.pinned)

        await settle(store)
        #expect(store.library.thought("t-new") == nil)
        #expect(store.outbox.isEmpty)
        #expect(events.filter { if case .rolledBack = $0 { true } else { false } }.count == 2)
    }

    @Test func offlineChangesWaitAndSendWhenBackOnline() async throws {
        let store = Store(snapshot: Snapshot(confirmed: seed), server: ScriptedServer([]),
                          network: NetworkConditions(online: false, latencyMs: 0))
        try store.perform(.setPinned(id: "t-prevent", true))
        await settle(store, timeout: .milliseconds(200))
        #expect(store.outbox.count == 1)
        #expect(store.library.thought("t-prevent")!.pinned)

        store.network.online = true
        await settle(store)
        #expect(store.outbox.isEmpty)
        #expect(store.confirmed.thought("t-prevent")!.pinned)
    }

    @Test func invalidChangesThrowAndQueueNothing() {
        let store = Store(snapshot: Snapshot(confirmed: seed), server: ScriptedServer([]))
        #expect(throws: MutationError.self) { try store.perform(.deleteThought(id: "t-enemy")) }
        #expect(store.outbox.isEmpty)
    }

    @Test func theOutboxSurvivesARelaunch() async throws {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("altered-\(IDs.make()).json")
        defer { try? FileManager.default.removeItem(at: url) }
        let disk = FilePersistence(url: url)

        let offline = Store(snapshot: Snapshot(confirmed: seed), server: ScriptedServer([]), persistence: disk,
                            network: NetworkConditions(online: false))
        try offline.perform(.setPinned(id: "t-prevent", true))

        let loaded = try #require(try disk.load())
        #expect(loaded.confirmed == seed)
        #expect(loaded.outbox.count == 1)

        let relaunched = Store(snapshot: loaded, server: ScriptedServer([]), persistence: disk)
        #expect(relaunched.library.thought("t-prevent")!.pinned)
        relaunched.start()
        await settle(relaunched)
        #expect(try disk.load()?.outbox.isEmpty == true)
        #expect(try disk.load()?.confirmed.thought("t-prevent")?.pinned == true)
    }

    @Test func mockServerHonoursConditions() async {
        let server = MockServer()
        let mutation = Mutation.setPinned(id: "x", true)
        func outcome(_ conditions: NetworkConditions) async -> String {
            switch await server.push(mutation, conditions: conditions) {
            case .success: "ok"
            case .failure(.offline): "offline"
            case .failure(.rejected): "rejected"
            }
        }
        #expect(await outcome(NetworkConditions(online: false)) == "offline")
        #expect(await outcome(NetworkConditions(latencyMs: 0, failureRate: 0)) == "ok")
        #expect(await outcome(NetworkConditions(latencyMs: 0, failureRate: 1)) == "rejected")
    }
}

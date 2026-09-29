import Foundation
import Observation

/// Local-first store with optimistic updates.
///
/// `confirmed` is what the server has accepted. `outbox` holds every change it has not accepted
/// yet, in order. `library`, which the UI reads, is always `confirmed` with the outbox replayed
/// on top, so overlapping changes compose, and a rejected change disappears without disturbing
/// the ones after it (any that depended on it are dropped and reported too).
@MainActor
@Observable
public final class Store {
    public private(set) var confirmed: Library
    public private(set) var outbox: [Envelope]
    public private(set) var library: Library
    /// The envelope the server is working on now, if any.
    public private(set) var sending: ID?

    public var network: NetworkConditions {
        didSet { pump() }
    }

    @ObservationIgnored public var onEvent: ((StoreEvent) -> Void)?
    @ObservationIgnored private let server: any SyncServer
    @ObservationIgnored private let persistence: (any Persistence)?

    public init(
        snapshot: Snapshot, server: any SyncServer = MockServer(), persistence: (any Persistence)? = nil,
        network: NetworkConditions = NetworkConditions()
    ) {
        confirmed = snapshot.confirmed
        outbox = snapshot.outbox
        library = snapshot.confirmed
        self.server = server
        self.persistence = persistence
        self.network = network
        rebuild()
    }

    /// Resumes sending anything left in the outbox from a previous launch.
    public func start() {
        pump()
    }

    /// Applies a change now and queues it for the server. Throws, and changes nothing, when the
    /// change is not valid against what the person currently sees.
    public func perform(_ mutation: Mutation) throws(MutationError) {
        var next = library
        try mutation.apply(to: &next)
        library = next
        let envelope = Envelope(id: IDs.make(), mutation: mutation, queuedAt: Clock.now())
        outbox.append(envelope)
        onEvent?(.queued(mutation.summary))
        save()
        pump()
    }

    /// Ids of records with a change still in flight or queued, for the syncing marks.
    public var pendingIds: Set<ID> {
        outbox.reduce(into: Set<ID>()) { $0.formUnion($1.mutation.affected) }
    }

    public func isPending(_ id: ID) -> Bool {
        outbox.contains { $0.mutation.affected.contains(id) }
    }

    /// Replaces everything, dropping the outbox. Used by the demo reset.
    public func reset(to library: Library) {
        confirmed = library
        outbox = []
        self.library = library
        save()
    }

    public var snapshot: Snapshot { Snapshot(confirmed: confirmed, outbox: outbox) }

    // MARK: - Sending

    @ObservationIgnored private var pumping = false

    private func pump() {
        guard !pumping, network.online, let envelope = outbox.first else { return }
        pumping = true
        sending = envelope.id
        let conditions = network
        let started = Date()
        Task { [server] in
            let result = await server.push(envelope.mutation, conditions: conditions)
            self.finish(envelope, result, ms: Int(Date().timeIntervalSince(started) * 1000))
        }
    }

    private func finish(_ envelope: Envelope, _ result: Result<Void, SyncError>, ms: Int) {
        pumping = false
        sending = nil
        let summary = envelope.mutation.summary

        switch result {
        case .success:
            var next = confirmed
            do {
                try envelope.mutation.apply(to: &next)
                confirmed = next
                onEvent?(.confirmed(summary, ms: ms))
            } catch {
                onEvent?(.rolledBack(summary, reason: "\(error)"))
            }
            outbox.removeAll { $0.id == envelope.id }
            rebuild()
        case .failure(.offline):
            onEvent?(.waiting(summary))
        case let .failure(.rejected(reason)):
            outbox.removeAll { $0.id == envelope.id }
            onEvent?(.rolledBack(summary, reason: reason))
            rebuild()
        }

        save()
        pump()
    }

    /// Recomputes what the person sees. A queued change that no longer applies, because one
    /// before it was rolled back, is dropped and reported rather than left stuck.
    private func rebuild() {
        var next = confirmed
        var dropped: [ID] = []
        for envelope in outbox {
            do {
                try envelope.mutation.apply(to: &next)
            } catch {
                dropped.append(envelope.id)
                onEvent?(.rolledBack(envelope.mutation.summary, reason: "\(error)"))
            }
        }
        if !dropped.isEmpty { outbox.removeAll { dropped.contains($0.id) } }
        library = next
    }

    private func save() {
        guard let persistence else { return }
        do {
            try persistence.save(snapshot)
        } catch {
            onEvent?(.saveFailed("\(error)"))
        }
    }
}

public enum Clock {
    /// Now, rounded down to the second, so a timestamp survives the JSON round trip unchanged.
    public static func now() -> Date {
        Date(timeIntervalSince1970: floor(Date().timeIntervalSince1970))
    }
}

import Foundation

/// Why the server did not take a mutation. Offline keeps it queued; rejected rolls it back.
public enum SyncError: Error, Equatable, Sendable {
    case offline
    case rejected(String)
}

/// The simulated network, set from the Sys tab. Real sync would read none of this.
public struct NetworkConditions: Codable, Hashable, Sendable {
    public var online: Bool
    public var latencyMs: Int
    /// 0 to 1: the share of pushes the mock server rejects.
    public var failureRate: Double

    public init(online: Bool = true, latencyMs: Int = 1500, failureRate: Double = 0) {
        self.online = online
        self.latencyMs = latencyMs
        self.failureRate = failureRate
    }
}

public protocol SyncServer: Sendable {
    func push(_ mutation: Mutation, conditions: NetworkConditions) async -> Result<Void, SyncError>
}

/// Stands in for the API: waits the configured latency, then accepts or rejects at the
/// configured rate. The store is what makes this safe to swap for a real client later.
public struct MockServer: SyncServer {
    public init() {}

    public func push(_ mutation: Mutation, conditions: NetworkConditions) async -> Result<Void, SyncError> {
        guard conditions.online else { return .failure(.offline) }
        if conditions.latencyMs > 0 {
            try? await Task.sleep(for: .milliseconds(conditions.latencyMs))
        }
        if Double.random(in: 0..<1) < conditions.failureRate {
            return .failure(.rejected("The server rejected \(mutation.summary) (simulated failure)."))
        }
        return .success(())
    }
}

/// A queued mutation. It stays in the outbox, and on disk, until the server confirms it.
public struct Envelope: Codable, Hashable, Identifiable, Sendable {
    public var id: ID
    public var mutation: Mutation
    public var queuedAt: Date

    public init(id: ID, mutation: Mutation, queuedAt: Date) {
        self.id = id
        self.mutation = mutation
        self.queuedAt = queuedAt
    }
}

/// What survives a relaunch: the last confirmed state and every change not yet confirmed.
public struct Snapshot: Codable, Hashable, Sendable {
    public var confirmed: Library
    public var outbox: [Envelope]

    public init(confirmed: Library, outbox: [Envelope] = []) {
        self.confirmed = confirmed
        self.outbox = outbox
    }
}

public protocol Persistence {
    func load() throws -> Snapshot?
    func save(_ snapshot: Snapshot) throws
}

/// One JSON file, written atomically after every change.
public struct FilePersistence: Persistence {
    public let url: URL

    public init(url: URL) {
        self.url = url
    }

    public static func inApplicationSupport(named name: String = "library.json") throws -> FilePersistence {
        let folder = try FileManager.default.url(
            for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true
        )
        return FilePersistence(url: folder.appendingPathComponent(name))
    }

    public func load() throws -> Snapshot? {
        guard FileManager.default.fileExists(atPath: url.path) else { return nil }
        return try Coding.decoder.decode(Snapshot.self, from: Data(contentsOf: url))
    }

    public func save(_ snapshot: Snapshot) throws {
        try Coding.encoder.encode(snapshot).write(to: url, options: .atomic)
    }
}

public enum Coding {
    public static var encoder: JSONEncoder {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = [.sortedKeys, .prettyPrinted, .withoutEscapingSlashes]
        return encoder
    }

    public static var decoder: JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return decoder
    }
}

public enum StoreEvent: Hashable, Sendable {
    case queued(String)
    case confirmed(String, ms: Int)
    case waiting(String)
    case rolledBack(String, reason: String)
    case saveFailed(String)
}

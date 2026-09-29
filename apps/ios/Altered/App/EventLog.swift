import AlteredCore
import Foundation
import OSLog

/// Every meaningful operation, readable in the Sys tab and in Console.app.
@MainActor
@Observable
final class EventLog {
    struct Line: Identifiable, Hashable {
        enum Level: String { case info, warn, error }

        let id: Int
        let at: Date
        let level: Level
        let text: String
    }

    private(set) var lines: [Line] = []
    private var counter = 0
    private let logger = Logger(subsystem: "com.rileybarabash.altered-editor", category: "app")
    private static let limit = 500

    func add(_ text: String, level: Line.Level = .info) {
        counter += 1
        lines.append(Line(id: counter, at: Date(), level: level, text: text))
        if lines.count > Self.limit { lines.removeFirst(lines.count - Self.limit) }
        switch level {
        case .info: logger.info("\(text, privacy: .public)")
        case .warn: logger.warning("\(text, privacy: .public)")
        case .error: logger.error("\(text, privacy: .public)")
        }
    }

    func record(_ event: StoreEvent) {
        switch event {
        case let .queued(summary): add("queued \(summary)")
        case let .confirmed(summary, ms): add("confirmed \(summary) in \(ms) ms")
        case let .waiting(summary): add("offline; \(summary) waits in the outbox", level: .warn)
        case let .rolledBack(summary, reason): add("rolled back \(summary): \(reason)", level: .error)
        case let .saveFailed(reason): add("could not save to disk: \(reason)", level: .error)
        }
    }
}

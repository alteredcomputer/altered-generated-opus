import OSLog

/// Every write and failure is logged here, readable in Console.app with the subsystem filter.
nonisolated enum Log {
    static let store = Logger(subsystem: "com.rileybarabash.altered-native", category: "store")
}

import AlteredCore
import Foundation

/// Everything a person can change at runtime, kept in UserDefaults. Config over constants.
struct Settings: Codable, Equatable {
    var network = NetworkConditions()
    var textSize: Int = 13
    /// Instant screen changes (default) or the system's slide.
    var instantNavigation = true
    var haptics = true

    static let textSizes = [13, 15, 17]
    static let latencies = [0, 300, 1500, 3000]
    static let failureRates = [0.0, 0.1, 0.5, 1.0]

    private static let key = "settings.v1"

    static func load(from defaults: UserDefaults) -> Settings {
        guard let data = defaults.data(forKey: key),
              let settings = try? JSONDecoder().decode(Settings.self, from: data)
        else { return Settings() }
        return settings
    }

    func save(to defaults: UserDefaults) {
        guard let data = try? JSONEncoder().encode(self) else { return }
        defaults.set(data, forKey: Self.key)
    }

    /// The next value in a fixed cycle, for settings changed by tapping.
    static func next<T: Equatable>(_ value: T, in cycle: [T]) -> T {
        guard let index = cycle.firstIndex(of: value) else { return cycle[0] }
        return cycle[(index + 1) % cycle.count]
    }
}

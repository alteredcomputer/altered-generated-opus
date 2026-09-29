import AlteredCore
import SwiftUI
import UIKit

/// A one-line message at the top of the screen. Errors stay until replaced or tapped.
struct Toast: Equatable, Identifiable {
    enum Kind { case info, error }

    let id = IDs.make()
    let text: String
    let kind: Kind
}

/// The action panel: the phone's Cmd-K. Opened by holding a row, or from any "Actions" button.
struct Panel: Identifiable {
    struct Action: Identifiable {
        let id: String
        let title: String
        var hint: String?
        var destructive = false
        let run: () -> Void
    }

    let id = IDs.make()
    let title: String
    let actions: [Action]
}

@MainActor
@Observable
final class AppModel {
    let store: Store
    let log = EventLog()
    let router = Router()
    let testing: Bool

    var settings: Settings {
        didSet { applySettings() }
    }

    var toast: Toast?
    var panel: Panel?
    /// Composer text not yet saved, keyed by thought id ("new" for a new thought), so leaving the
    /// composer by swipe never loses what was typed.
    var unsaved: [String: ThoughtEdit] = [:]
    var agentRunning = false

    @ObservationIgnored private let defaults: UserDefaults
    @ObservationIgnored private var toastTask: Task<Void, Never>?

    init(store: Store, settings: Settings, defaults: UserDefaults, testing: Bool) {
        self.store = store
        self.settings = settings
        self.defaults = defaults
        self.testing = testing
        store.onEvent = { [weak self] event in self?.handle(event) }
        applySettings()
        log.add("launched with \(store.library.thoughts.count) thoughts, \(store.outbox.count) queued")
        store.start()
    }

    /// Normal launches read and write the on-disk library. UI tests (`-uitest`) start from a fresh
    /// seed in memory, with a short latency so they run quickly.
    static func launch(arguments: [String] = ProcessInfo.processInfo.arguments) -> AppModel {
        let now = Clock.now()
        if arguments.contains("-uitest") {
            let defaults = UserDefaults(suiteName: "uitest") ?? .standard
            defaults.removePersistentDomain(forName: "uitest")
            var settings = Settings()
            settings.haptics = false
            if let index = arguments.firstIndex(of: "-latency"), index + 1 < arguments.count,
               let ms = Int(arguments[index + 1]) {
                settings.network.latencyMs = ms
            } else {
                settings.network.latencyMs = 300
            }
            let store = Store(snapshot: Snapshot(confirmed: Seed.library(now: now)), network: settings.network)
            return AppModel(store: store, settings: settings, defaults: defaults, testing: true)
        }

        let defaults = UserDefaults.standard
        let settings = Settings.load(from: defaults)
        var persistence: (any Persistence)?
        var snapshot = Snapshot(confirmed: Seed.library(now: now))
        var problem: String?
        do {
            let disk = try FilePersistence.inApplicationSupport()
            if let saved = try disk.load() { snapshot = saved }
            persistence = disk
        } catch {
            problem = "could not open the library on disk: \(error). Running from the demo seed in memory."
        }
        let store = Store(snapshot: snapshot, persistence: persistence, network: settings.network)
        let app = AppModel(store: store, settings: settings, defaults: defaults, testing: false)
        if let problem {
            app.log.add(problem, level: .error)
            app.show(problem, .error)
        }
        return app
    }

    var library: Library { store.library }
    var metrics: Metrics { Metrics(size: CGFloat(settings.textSize)) }

    private func applySettings() {
        store.network = settings.network
        router.instant = settings.instantNavigation
        Haptics.enabled = settings.haptics
        if !testing { settings.save(to: defaults) }
    }

    // MARK: - Changes

    /// Every change goes through here: applied now, synced in the background, and refused with a
    /// readable reason when it is not valid.
    @discardableResult
    func perform(_ mutation: Mutation, done: String? = nil) -> Bool {
        do {
            try store.perform(mutation)
            if let done { show(done) }
            return true
        } catch {
            Haptics.warning()
            let reason = String(describing: error)
            log.add("refused \(mutation.summary): \(reason)", level: .warn)
            show(reason, .error)
            return false
        }
    }

    func show(_ text: String, _ kind: Toast.Kind = .info) {
        toastTask?.cancel()
        let toast = Toast(text: text, kind: kind)
        self.toast = toast
        toastTask = Task { [weak self] in
            try? await Task.sleep(for: .seconds(kind == .error ? 5 : 2.2))
            guard !Task.isCancelled, let self, self.toast?.id == toast.id else { return }
            self.toast = nil
        }
    }

    private func handle(_ event: StoreEvent) {
        log.record(event)
        switch event {
        case let .rolledBack(summary, reason):
            Haptics.warning()
            show("Rolled back \(summary). \(reason)", .error)
        case let .saveFailed(reason):
            show("Could not save to disk. \(reason)", .error)
        case .queued, .confirmed, .waiting:
            break
        }
    }

    // MARK: - Agent

    /// Runs Koa's review with the same simulated latency as the network, then files its
    /// proposals through the normal outbox.
    func runAgent() {
        guard !agentRunning else { return }
        agentRunning = true
        log.add("koa review started")
        let latency = settings.network.latencyMs
        Task {
            try? await Task.sleep(for: .milliseconds(latency))
            let proposals = Agent.review(store.library, now: Clock.now())
            agentRunning = false
            if proposals.isEmpty {
                show("Koa has nothing to suggest.")
                log.add("koa review: nothing to suggest")
            } else if perform(.addProposals(proposals)) {
                Haptics.success()
                show("Koa proposed \(proposals.count) change\(proposals.count == 1 ? "" : "s").")
                log.add("koa review: \(proposals.count) proposals")
            }
        }
    }

    func resetDemo() {
        store.reset(to: Seed.library(now: Clock.now()))
        unsaved = [:]
        router.paths = [:]
        log.add("demo data reset")
        show("Demo data reset.")
    }
}

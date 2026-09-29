import AlteredCore
import Foundation
import Testing
@testable import Altered

@MainActor
@Suite struct AlteredTests {
    @Test func testLaunchStartsFromTheSeedInMemory() {
        let app = AppModel.launch(arguments: ["-uitest", "-latency", "0"])
        #expect(app.testing)
        #expect(app.settings.network.latencyMs == 0)
        #expect(app.library.thoughts.count == Seed.library(now: Date()).thoughts.count)
    }

    @Test func refusedChangesExplainThemselves() {
        let app = AppModel.launch(arguments: ["-uitest"])
        #expect(!(app.perform(.deleteThought(id: "t-enemy"))))
        #expect(app.toast?.kind == .error)
        #expect(app.toast?.text.contains("locked") == true)
        #expect(app.store.outbox.isEmpty)

        #expect(app.perform(.setPinned(id: "t-prevent", true), done: "Pinned."))
        #expect(app.toast?.text == "Pinned.")
        #expect(app.store.outbox.count == 1)
    }

    @Test func reviewQueueCountsEveryKind() {
        let queue = ReviewQueue(Seed.library(now: Date()))
        #expect(queue.proposals.count == 2)
        #expect(queue.drafts.count == 4)
        #expect(Set(queue.incomplete.map(\.id)) == ["t-closed", "t-costar"])
        #expect(queue.unvalidated.map(\.id) == ["t-local"])
        #expect(queue.count == 9)
    }

    @Test func routerKeepsOneStackPerTab() {
        let router = Router()
        router.push(.log)
        router.push(.outbox)
        #expect(router.depth == 2)
        router.select(.sets)
        #expect(router.depth == 0)
        router.select(.thoughts)
        #expect(router.depth == 2)
        router.select(.thoughts)
        #expect(router.depth == 0)
        router.push(.log)
        router.pop(5)
        #expect(router.depth == 0)
    }

    @Test func keyboardLiftOnlyCoversWhatTheTabBarDoesNot() {
        #expect(KeyboardObserver.lift(overlap: 0, below: 84) == 0)
        #expect(KeyboardObserver.lift(overlap: 336, below: 84) == 252)
        #expect(KeyboardObserver.lift(overlap: 50, below: 84) == 0)
    }

    @Test func settingsCycle() {
        #expect(Settings.next(1500, in: Settings.latencies) == 3000)
        #expect(Settings.next(3000, in: Settings.latencies) == 0)
        #expect(Settings.next(99, in: Settings.latencies) == 0)
    }

    @Test func metricsFollowTheTextSize() {
        let metrics = Metrics(size: 13)
        #expect(metrics.ch == 8)
        #expect(metrics.px == 24)
        #expect(metrics.leading == 6.5)
    }
}

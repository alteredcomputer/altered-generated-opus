import AlteredCore
import XCTest
@testable import Altered

final class AlteredTests: XCTestCase {
    func testTestLaunchStartsFromTheSeedInMemory() {
        let app = AppModel.launch(arguments: ["-uitest", "-latency", "0"])
        XCTAssertTrue(app.testing)
        XCTAssertEqual(app.settings.network.latencyMs, 0)
        XCTAssertEqual(app.library.thoughts.count, Seed.library(now: Date()).thoughts.count)
    }

    func testRefusedChangesExplainThemselves() {
        let app = AppModel.launch(arguments: ["-uitest"])
        XCTAssertFalse(app.perform(.deleteThought(id: "t-enemy")))
        XCTAssertEqual(app.toast?.kind, .error)
        XCTAssertTrue(app.toast?.text.contains("locked") == true)
        XCTAssertTrue(app.store.outbox.isEmpty)

        XCTAssertTrue(app.perform(.setPinned(id: "t-prevent", true), done: "Pinned."))
        XCTAssertEqual(app.toast?.text, "Pinned.")
        XCTAssertEqual(app.store.outbox.count, 1)
    }

    func testReviewQueueCountsEveryKind() {
        let queue = ReviewQueue(Seed.library(now: Date()))
        XCTAssertEqual(queue.proposals.count, 2)
        XCTAssertEqual(queue.drafts.count, 4)
        XCTAssertEqual(Set(queue.incomplete.map(\.id)), ["t-closed", "t-costar"])
        XCTAssertEqual(queue.unvalidated.map(\.id), ["t-local"])
        XCTAssertEqual(queue.count, 9)
    }

    func testRouterKeepsOneStackPerTab() {
        let router = Router()
        router.push(.log)
        router.push(.outbox)
        XCTAssertEqual(router.depth, 2)
        router.select(.sets)
        XCTAssertEqual(router.depth, 0)
        router.select(.thoughts)
        XCTAssertEqual(router.depth, 2)
        router.select(.thoughts)
        XCTAssertEqual(router.depth, 0)
        router.push(.log)
        router.pop(5)
        XCTAssertEqual(router.depth, 0)
    }

    func testKeyboardLiftOnlyCoversWhatTheTabBarDoesNot() {
        XCTAssertEqual(KeyboardObserver.lift(overlap: 0, below: 84), 0)
        XCTAssertEqual(KeyboardObserver.lift(overlap: 336, below: 84), 252)
        XCTAssertEqual(KeyboardObserver.lift(overlap: 50, below: 84), 0)
    }

    func testSettingsCycle() {
        XCTAssertEqual(Settings.next(1500, in: Settings.latencies), 3000)
        XCTAssertEqual(Settings.next(3000, in: Settings.latencies), 0)
        XCTAssertEqual(Settings.next(99, in: Settings.latencies), 0)
    }

    func testMetricsFollowTheTextSize() {
        let metrics = Metrics(size: 13)
        XCTAssertEqual(metrics.ch, 8)
        XCTAssertEqual(metrics.px, 24)
        XCTAssertEqual(metrics.leading, 6.5)
    }
}

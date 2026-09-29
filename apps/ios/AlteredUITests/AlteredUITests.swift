import XCTest

/// Drives the real app on the Simulator. Every test starts from the demo seed in memory
/// (`-uitest`), and screenshots are kept as attachments for review.
final class AlteredUITests: XCTestCase {
    var app: XCUIApplication!

    override func setUp() {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-uitest", "-latency", "600"]
        app.launch()
    }

    // MARK: - Helpers

    func el(_ id: String) -> XCUIElement {
        app.descendants(matching: .any)[id].firstMatch
    }

    func tap(_ id: String, timeout: TimeInterval = 5) {
        let element = el(id)
        XCTAssertTrue(element.waitForExistence(timeout: timeout), "missing \(id)")
        element.tap()
    }

    func snap(_ name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    var keyboard: XCUIElement { app.keyboards.firstMatch }

    func waitForKeyboard(_ visible: Bool, timeout: TimeInterval = 5) {
        let predicate = NSPredicate(format: "exists == %@", NSNumber(value: visible))
        let expectation = XCTNSPredicateExpectation(predicate: predicate, object: keyboard)
        XCTAssertEqual(XCTWaiter().wait(for: [expectation], timeout: timeout), .completed, "keyboard visible should be \(visible)")
        // Let the keyboard's own animation finish before measuring frames.
        Thread.sleep(forTimeInterval: 0.8)
    }

    func waitForToast(containing text: String, timeout: TimeInterval = 8) {
        let toast = el("toast")
        let predicate = NSPredicate(format: "label CONTAINS %@", text)
        let expectation = XCTNSPredicateExpectation(predicate: predicate, object: toast)
        XCTAssertEqual(XCTWaiter().wait(for: [expectation], timeout: timeout), .completed, "no toast containing \(text)")
    }

    func search(_ text: String) {
        tap("search")
        el("search").typeText(text)
    }

    // MARK: - Tests

    func testSearchRidesOnTheKeyboardWhileTheTabBarStays() {
        XCTAssertTrue(el("row.t-thumbs").waitForExistence(timeout: 5))
        snap("01 thoughts")

        let tabbar = el("tabbar")
        let before = tabbar.frame
        tap("search")
        waitForKeyboard(true)

        let bar = el("searchbar").frame
        let top = keyboard.frame.minY
        XCTAssertEqual(bar.maxY, top, accuracy: 2, "search bar should sit on the keyboard")
        XCTAssertEqual(tabbar.frame.minY, before.minY, accuracy: 1, "tab bar should stay under the keyboard")
        XCTAssertTrue(el("token.#questions").exists, "query tokens show while searching")
        snap("02 search with keyboard")

        tap("token.#questions")
        XCTAssertTrue(el("row.t-name").waitForExistence(timeout: 3))
        XCTAssertFalse(el("row.t-thumbs").exists)
        tap("search.done")
        waitForKeyboard(false)
        XCTAssertEqual(el("searchbar").frame.maxY, before.minY, accuracy: 2, "search bar returns above the tab bar")
    }

    func testDetailReadsLikeTheKoaPageAndStepsSideways() {
        search("schema")
        tap("row.t-types")
        XCTAssertTrue(el("thought.alias").waitForExistence(timeout: 5))
        XCTAssertTrue(el("thought.alias").label.contains("Which schema types come next?"))
        snap("03 thought detail")

        tap("bar.actions")
        XCTAssertTrue(el("panel").waitForExistence(timeout: 3))
        snap("04 action panel")
        tap("panel.close")

        tap("version")
        XCTAssertTrue(el("revision.1").waitForExistence(timeout: 3))
        tap("revision.1")
        XCTAssertTrue(el("diff").waitForExistence(timeout: 3))
        snap("05 revision diff")
    }

    func testSidewaysSwipeSteps() {
        tap("row.t-thumbs")
        let alias = el("thought.alias")
        XCTAssertTrue(alias.waitForExistence(timeout: 5))
        let first = alias.label
        el("thought.document").swipeLeft()
        let predicate = NSPredicate(format: "label != %@", first)
        let changed = XCTNSPredicateExpectation(predicate: predicate, object: alias)
        XCTAssertEqual(XCTWaiter().wait(for: [changed], timeout: 3), .completed, "swipe left should open the next thought")
    }

    func testComposerKeepsTheCaretAndToolbarAboveTheKeyboard() {
        tap("new")
        let alias = el("composer.alias")
        XCTAssertTrue(alias.waitForExistence(timeout: 5))
        waitForKeyboard(true)
        alias.typeText("Keyboard test")

        tap("editor.content")
        let lines = (1...40).map { "Line \($0) of a long thought that wraps past the edge of the screen." }
        el("editor.content").typeText(lines.joined(separator: "\n"))
        Thread.sleep(forTimeInterval: 0.8)

        let toolbar = el("composer.toolbar").frame
        let editor = el("editor.content").frame
        let top = keyboard.frame.minY
        XCTAssertLessThanOrEqual(toolbar.maxY, top + 1, "toolbar must sit on or above the keyboard")
        XCTAssertGreaterThan(toolbar.maxY, top - 4, "toolbar must sit right on the keyboard, not float")
        XCTAssertLessThanOrEqual(editor.maxY, toolbar.minY + 1, "editor must end above the toolbar")
        XCTAssertEqual(el("probe.caret").label, "yes", "caret must be visible after typing past the fold")
        snap("06 composer with keyboard")

        tap("composer.hide")
        waitForKeyboard(false)
        let window = app.windows.firstMatch.frame
        XCTAssertGreaterThan(el("composer.toolbar").frame.maxY, window.maxY - 60, "toolbar returns to the bottom")
        snap("07 composer without keyboard")

        tap("editor.content")
        waitForKeyboard(true)
        XCTAssertEqual(el("probe.caret").label, "yes", "caret must be visible after the keyboard returns")
        tap("composer.save")
        waitForToast(containing: "Created")
        search("Keyboard test")
        XCTAssertTrue(app.buttons.matching(NSPredicate(format: "label CONTAINS 'Keyboard test'")).firstMatch.waitForExistence(timeout: 3))
    }

    func testRequiredFieldsAreEnforced() {
        tap("new")
        el("composer.alias").typeText("A closed decision")
        tap("dataset.decisions")
        tap("editor.content")
        el("editor.content").typeText("Every field is required unless opted out.")
        tap("composer.save")

        let status = el("values.status")
        XCTAssertTrue(status.waitForExistence(timeout: 5))
        XCTAssertEqual(status.label, "2 to fill")
        snap("08 fields form")

        tap("option.status.open")
        tap("today.decided")
        XCTAssertEqual(status.label, "complete")
        tap("values.save")
        waitForToast(containing: "Created")
        XCTAssertTrue(el("search").waitForExistence(timeout: 3), "back on the list")
    }

    func testRejectedChangesRollBack() {
        tap("tab.sys")
        for _ in 0..<3 { tap("setting.failures") }
        XCTAssertTrue(el("setting.failures").label.contains("100%"))
        snap("09 sys")
        tap("tab.thoughts")

        let row = el("row.t-thumbs")
        XCTAssertTrue(row.waitForExistence(timeout: 3))
        row.swipeLeft()
        tap("Pin", timeout: 3)
        XCTAssertTrue(el("sync").waitForExistence(timeout: 2), "the outbox shows while the change is in flight")
        snap("10 pending change")
        waitForToast(containing: "Rolled back")
        XCTAssertFalse(el("sync").exists, "nothing left in the outbox")
    }

    func testReviewAcceptsAndValidates() {
        tap("tab.review")
        XCTAssertTrue(el("section.proposals").waitForExistence(timeout: 3))
        snap("11 review")
        tap("proposalrow.p-house")
        XCTAssertTrue(el("bar.accept").waitForExistence(timeout: 3))
        snap("12 proposal")
        tap("bar.accept")
        waitForToast(containing: "Accepted")
        tap("review.run")
        waitForToast(containing: "Koa proposed")
    }

    func testRestoreAnOlderVersion() {
        search("Local first")
        tap("row.t-local")
        tap("version")
        tap("revision.1")
        tap("bar.restore")
        waitForToast(containing: "Restored v1")
        XCTAssertTrue(el("thought.alias").label.contains("Offline"))
    }

    func testSetsAndViews() {
        tap("tab.sets")
        XCTAssertTrue(el("tile.decisions").waitForExistence(timeout: 3))
        snap("13 sets")
        tap("tile.decisions")
        XCTAssertTrue(el("schema.status").waitForExistence(timeout: 3))
        snap("14 dataset")

        tap("tab.views")
        tap("view.v-decisions")
        XCTAssertTrue(el("column.open").waitForExistence(timeout: 3))
        snap("15 board view")
        tap("view.actions")
        tap("panel.definition")
        XCTAssertTrue(el("definition.json").waitForExistence(timeout: 3))
        snap("16 view definition")
    }
}

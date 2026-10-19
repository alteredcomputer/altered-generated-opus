import XCTest

/// The core loop on a Simulator: compose arrives with the keyboard up, typing saves, and the
/// thought is in the list after going back.
final class ComposeUITests: XCTestCase {
    @MainActor
    func testComposeTypeAndFindIt() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing"]
        app.launch()

        let compose = app.buttons["compose"]
        XCTAssertTrue(compose.waitForExistence(timeout: 10))
        compose.tap()

        XCTAssertTrue(app.textViews["editor"].waitForExistence(timeout: 5), "The editor should open")

        XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 5), "The keyboard should be up")
        app.typeText("Written on the Simulator\nSecond line")
        add(screenshot(app, "editor"))

        app.navigationBars.buttons.element(boundBy: 0).tap()

        //  A row reads as one element ("title, date, snippet"), so match on its label.
        let row = app.descendants(matching: .any)
            .matching(NSPredicate(format: "label CONTAINS %@", "Written on the Simulator"))
            .firstMatch
        XCTAssertTrue(row.waitForExistence(timeout: 5), "The new thought should be in the list")
        add(screenshot(app, "list"))
    }

    @MainActor
    private func screenshot(_ app: XCUIApplication, _ name: String) -> XCTAttachment {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        return attachment
    }
}

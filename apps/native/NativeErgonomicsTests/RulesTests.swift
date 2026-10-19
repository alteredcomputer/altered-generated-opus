import Foundation
import Testing
@testable import NativeErgonomics

struct DeriveTests {
    @Test func titleIsTheAliasOrTheFirstLine() {
        #expect(Derive.title(alias: "Alias", content: "First\nSecond") == "Alias")
        #expect(Derive.title(alias: nil, content: "\n  First  \nSecond") == "First")
        #expect(Derive.title(alias: "  ", content: "First") == "First")
        #expect(Derive.title(alias: nil, content: " \n ") == "")
    }

    @Test func snippetIsTheLineUnderTheTitle() {
        #expect(Derive.snippet(alias: "Alias", content: "First\nSecond") == "First")
        #expect(Derive.snippet(alias: nil, content: "First\n\nSecond") == "Second")
        #expect(Derive.snippet(alias: nil, content: "Only") == "")
    }

    @Test func searchTextCoversEveryField() {
        let text = Derive.searchText(
            alias: "Local First", content: "Open from DISK",
            datasetAliases: ["decisions"],
            attributes: [ThoughtAttribute(name: "Status", value: "Prototype")]
        )
        for word in ["local", "disk", "decisions", "status", "prototype"] {
            #expect(text.contains(word))
        }
        #expect(text == text.lowercased())
    }
}

struct SearchTests {
    private struct Item {
        let id = UUID()
        let text: String
    }

    private let items = [
        Item(text: "keyboard before mouse decisions"),
        Item(text: "local first decisions prototype"),
        Item(text: "clean the house tenets"),
    ]

    private func run(_ query: String, allowed: Set<UUID>? = nil) -> [String] {
        Search.filter(items, query: query, allowed: allowed, id: \.id, haystack: \.text).map(\.text)
    }

    @Test func everyWordMustMatchInAnyOrderAndCase() {
        #expect(run("DECISIONS local") == ["local first decisions prototype"])
        #expect(run("decisions").count == 2)
        #expect(run("decisions tenets").isEmpty)
    }

    @Test func emptyQueryKeepsEverythingInOrder() {
        #expect(run("   ") == items.map(\.text))
    }

    @Test func allowedNarrowsToDatasetMembers() {
        let allowed: Set = [items[0].id, items[2].id]
        #expect(run("", allowed: allowed) == [items[0].text, items[2].text])
        #expect(run("decisions", allowed: allowed) == [items[0].text])
        #expect(run("", allowed: []).isEmpty)
    }
}

struct StepperTests {
    private let order = [UUID(), UUID(), UUID()]

    @Test func movesThroughTheListAsShown() {
        #expect(Stepper.neighbor(of: order[1], in: order, by: 1) == order[2])
        #expect(Stepper.neighbor(of: order[1], in: order, by: -1) == order[0])
    }

    @Test func stopsAtTheEnds() {
        #expect(Stepper.neighbor(of: order[0], in: order, by: -1) == nil)
        #expect(Stepper.neighbor(of: order[2], in: order, by: 1) == nil)
        #expect(Stepper.neighbor(of: UUID(), in: order, by: 1) == nil)
    }
}

struct ValidationTests {
    private let datasetId = UUID()
    private let schemaId = UUID()
    private var schemas: [UUID: SchemaInfo] {
        [schemaId: SchemaInfo(datasetId: datasetId, name: "status", kind: .text)]
    }

    @Test func blankRowsAreDroppedAndNamesTrimmed() throws {
        let kept = try Rules.clean(
            [
                ThoughtAttribute(name: "  source ", value: "notes"),
                ThoughtAttribute(name: " ", value: "  "),
            ],
            schemas: schemas
        )
        #expect(kept.map(\.name) == ["source"])
    }

    @Test func aValueNeedsAName() {
        #expect(throws: ValidationError("Every attribute with a value needs a name.")) {
            try Rules.clean([ThoughtAttribute(name: "", value: "orphan")], schemas: schemas)
        }
    }

    @Test func aFieldMustStillExist() {
        #expect(throws: ValidationError.self) {
            try Rules.clean([ThoughtAttribute(name: "gone", value: "x", schemaId: UUID())], schemas: schemas)
        }
    }

    @Test func aFieldImpliesItsDataset() {
        let attributes = [ThoughtAttribute(name: "status", value: "locked", schemaId: schemaId)]
        #expect(Rules.datasets([], implied: attributes, schemas: schemas) == [datasetId])
    }

    @Test func leavingADatasetDetachesItsFields() {
        let attributes = [ThoughtAttribute(name: "status", value: "locked", schemaId: schemaId)]
        let detached = Rules.detach(attributes, keeping: [], schemas: schemas)
        #expect(detached.first?.schemaId == nil)
        #expect(detached.first?.value == "locked")
        #expect(Rules.detach(attributes, keeping: [datasetId], schemas: schemas).first?.schemaId == schemaId)
    }

    @Test func emptyMeansNothingToKeep() {
        #expect(Rules.isEmpty(alias: nil, content: " \n", attributes: []))
        #expect(Rules.isEmpty(alias: " ", content: "", attributes: [ThoughtAttribute(name: "a", value: " ")]))
        #expect(!Rules.isEmpty(alias: "A", content: "", attributes: []))
        #expect(!Rules.isEmpty(alias: nil, content: "", attributes: [ThoughtAttribute(name: "a", value: "b")]))
    }

    @Test func datasetNamesAreRequiredAndUniqueIgnoringCase() throws {
        let existing = [(id: UUID(), alias: "Ideas")]
        #expect(throws: ValidationError.self) { try Rules.checkAlias("  ", existing: existing, excluding: nil) }
        #expect(throws: ValidationError.self) { try Rules.checkAlias("ideas", existing: existing, excluding: nil) }
        #expect(try Rules.checkAlias(" ideas ", existing: existing, excluding: existing[0].id) == "ideas")
    }
}

struct RowDateTests {
    private let calendar = Calendar(identifier: .gregorian)
    private let now = Date(timeIntervalSince1970: 1_800_000_000)

    @Test func yesterdayIsNamed() {
        #expect(RowDate.string(now.addingTimeInterval(-86_400), now: now, calendar: calendar) == "Yesterday")
    }

    @Test func olderDatesAreNotToday() {
        let old = RowDate.string(now.addingTimeInterval(-30 * 86_400), now: now, calendar: calendar)
        #expect(old != RowDate.string(now, now: now, calendar: calendar))
    }
}

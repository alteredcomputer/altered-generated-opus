import SwiftData
import SwiftUI

@main
struct NativeApp: App {
    private let container: ModelContainer
    @State private var store: Store

    init() {
        //  UI tests launch with a fresh in-memory library so every run starts from the seed.
        let testing = ProcessInfo.processInfo.arguments.contains("-ui-testing")
        do {
            container = try ModelContainer(
                for: Schema(storeModels),
                configurations: ModelConfiguration(isStoredInMemoryOnly: testing)
            )
        } catch {
            //  Without its store the app has nothing to show; stop loudly rather than start empty.
            fatalError("The thought store could not open: \(error)")
        }
        let store = Store(container: container)
        store.prepare(seedingWith: testing ? nil : .standard)
        _store = State(initialValue: store)
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(store)
                .modelContainer(container)
        }
    }
}

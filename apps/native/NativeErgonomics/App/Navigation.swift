import SwiftUI

/// Opening a thought carries the list it was opened from, so previous and next walk that list in
/// the order it was shown. `token` tells two openings of the same thought apart.
struct ThoughtRoute: Hashable {
    var token = UUID()
    let id: UUID
    let order: [UUID]
    /// Raise the keyboard on arrival (a new thought).
    var focus = false
}

enum Route: Hashable {
    case thought(ThoughtRoute)
    case dataset(UUID)
}

/// One tab's navigation stack. When an editor leaves the stack (back button, swipe, Escape, or a
/// pop after delete) its staged text is saved and an empty thought is discarded.
struct StackTab<Root: View>: View {
    @ViewBuilder let root: (Binding<[Route]>) -> Root
    @Environment(Store.self) private var store
    @State private var path: [Route] = []

    var body: some View {
        NavigationStack(path: $path) {
            root($path)
                .navigationDestination(for: Route.self) { route in
                    switch route {
                    case .thought(let thought):
                        ThoughtEditor(route: thought)
                    case .dataset(let id):
                        ThoughtsScreen(scope: .dataset(id), path: $path)
                    }
                }
        }
        .onChange(of: path) { old, new in
            for case .thought(let route) in old where !new.contains(.thought(route)) {
                store.closeEditor(route.token, opened: route.id)
            }
        }
    }
}

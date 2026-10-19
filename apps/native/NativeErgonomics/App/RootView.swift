import SwiftUI

enum AppTab: Hashable {
    case thoughts, datasets, search
}

/// Glass tab bar: Thoughts, Datasets, and the iOS 26 search tab.
struct RootView: View {
    @Environment(Store.self) private var store
    @State private var tab = AppTab.thoughts

    var body: some View {
        TabView(selection: $tab) {
            Tab("Thoughts", systemImage: "note.text", value: AppTab.thoughts) {
                StackTab { path in ThoughtsScreen(scope: .all, path: path) }
            }
            Tab("Datasets", systemImage: "square.stack", value: AppTab.datasets) {
                StackTab { path in DatasetsScreen(path: path) }
            }
            Tab(value: AppTab.search, role: .search) {
                StackTab { path in ThoughtsScreen(scope: .search, path: path) }
            }
        }
        .tabBarMinimizeBehavior(.onScrollDown)
        .sensoryFeedback(trigger: store.feedback) { _, new in new.map(\.kind.sensory) }
        .alert("Something went wrong", isPresented: failureShown) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(store.failure ?? "")
        }
        .background {
            KeyCommand("Search", key: "f") {
                tab = .search
                store.requestSearch()
            }
        }
    }

    private var failureShown: Binding<Bool> {
        Binding(get: { store.failure != nil }, set: { if !$0 { store.failure = nil } })
    }
}

extension Feedback.Kind {
    var sensory: SensoryFeedback {
        switch self {
        case .created, .undone: .success
        case .removed: .impact(weight: .medium)
        case .toggled: .selection
        case .copied: .impact(weight: .light)
        }
    }
}

/// A key command with no visible button, for keys whose action has no button on screen. The
/// button is zero-sized and transparent so it takes no touches and is hidden from VoiceOver.
struct KeyCommand: View {
    let title: String
    let key: KeyEquivalent
    let modifiers: EventModifiers
    let action: () -> Void

    init(
        _ title: String, key: KeyEquivalent, modifiers: EventModifiers = .command,
        action: @escaping () -> Void
    ) {
        self.title = title
        self.key = key
        self.modifiers = modifiers
        self.action = action
    }

    var body: some View {
        Button(title, action: action)
            .keyboardShortcut(key, modifiers: modifiers)
            .frame(width: 0, height: 0)
            .opacity(0)
            .accessibilityHidden(true)
    }
}

import AlteredCore
import SwiftUI

/// Five tabs, each with its own navigation stack, all kept alive so switching is instant and a
/// tab comes back exactly as it was left. No transitions between tabs.
struct RootView: View {
    @Environment(AppModel.self) private var app

    var body: some View {
        ZStack(alignment: .top) {
            Theme.bg.ignoresSafeArea()
            ForEach(Tab.allCases) { tab in
                let active = app.router.tab == tab
                TabStack(tab: tab)
                    .opacity(active ? 1 : 0)
                    .allowsHitTesting(active)
                    .accessibilityHidden(!active)
            }
            if let toast = app.toast {
                ToastView(toast: toast)
            }
            if let panel = app.panel {
                PanelView(panel: panel).id(panel.id)
            }
            if app.testing {
                Probes()
            }
        }
        .tint(Theme.accent)
    }
}

struct TabStack: View {
    @Environment(AppModel.self) private var app
    let tab: Tab

    var body: some View {
        NavigationStack(path: app.router.path(tab)) {
            root
                .toolbar(.hidden, for: .navigationBar)
                .navigationDestination(for: Route.self) { route in
                    Destination(route: route)
                        .toolbar(.hidden, for: .navigationBar)
                        .background(Theme.bg.ignoresSafeArea())
                }
        }
    }

    @ViewBuilder private var root: some View {
        switch tab {
        case .thoughts: ThoughtsScreen()
        case .sets: SetsScreen()
        case .views: ViewsScreen()
        case .review: ReviewScreen()
        case .sys: SysScreen()
        }
    }
}

struct Destination: View {
    let route: Route

    var body: some View {
        switch route {
        case let .thought(id, context): ThoughtScreen(id: id, context: context)
        case let .compose(id, datasetId): ComposerScreen(id: id, datasetId: datasetId)
        case let .values(id, edit): ValuesScreen(id: id, edit: edit)
        case let .history(id): HistoryScreen(id: id)
        case let .revision(id, version): RevisionScreen(id: id, version: version)
        case let .proposal(id): ProposalScreen(id: id)
        case let .link(id): LinkScreen(id: id)
        case let .dataset(id): DatasetScreen(id: id)
        case let .datasetForm(id): DatasetFormScreen(id: id)
        case let .fieldForm(datasetId, fieldId): FieldFormScreen(datasetId: datasetId, fieldId: fieldId)
        case let .view(id): ViewScreen(id: id)
        case let .viewForm(id, query): ViewFormScreen(id: id, query: query)
        case let .definition(id): DefinitionScreen(id: id)
        case .outbox: OutboxScreen()
        case .log: LogScreen()
        }
    }
}

/// The frame of a tab's root screen: content, an optional bottom control that rides on the
/// keyboard, and the tab bar, which stays under the keyboard.
struct TabScaffold<Content: View, Bottom: View>: View {
    @ViewBuilder var content: () -> Content
    @ViewBuilder var bottom: () -> Bottom

    var body: some View {
        // Read outside the GeometryReader so observation re-renders this view on every change.
        let overlap = KeyboardObserver.shared.overlap
        GeometryReader { geometry in
            let lift = KeyboardObserver.lift(overlap: overlap, below: geometry.safeAreaInsets.bottom + TabBar.height)
            VStack(spacing: 0) {
                VStack(spacing: 0) { content() }
                    .frame(maxHeight: .infinity, alignment: .top)
                bottom()
                    .padding(.bottom, lift)
                TabBar()
            }
            .background(Theme.bg.ignoresSafeArea())
        }
        .ignoresSafeArea(.keyboard)
    }
}

extension TabScaffold where Bottom == EmptyView {
    init(@ViewBuilder content: @escaping () -> Content) {
        self.content = content
        self.bottom = { EmptyView() }
    }
}

/// Flat and textual, after Co-Star: the current tab is bright, the rest are grey. Tapping the
/// current tab again goes back to its root.
struct TabBar: View {
    @Environment(AppModel.self) private var app
    static let height: CGFloat = 50

    var body: some View {
        let review = ReviewQueue(app.library).count
        VStack(spacing: 0) {
            Hairline()
            HStack(spacing: 0) {
                ForEach(Tab.allCases) { tab in
                    Button {
                        Haptics.tap()
                        app.router.select(tab)
                    } label: {
                        HStack(spacing: 4) {
                            Text(tab.label).styled(app.router.tab == tab ? .strong : .dim, scale: 0.92)
                            if tab == .review, review > 0 {
                                Text("\(review)").styled(.accent, scale: 0.92)
                            }
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                    }
                    .buttonStyle(Press())
                    .accessibilityIdentifier("tab.\(tab.rawValue)")
                }
            }
            .frame(height: Self.height - 1)
        }
        .background(Theme.bg)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("tabbar")
    }
}

struct ToastView: View {
    @Environment(AppModel.self) private var app
    @Environment(\.metrics) private var metrics
    let toast: Toast

    var body: some View {
        Button {
            app.toast = nil
        } label: {
            HStack(alignment: .firstTextBaseline, spacing: metrics.ch) {
                Text(toast.kind == .error ? "!" : ">").styled(toast.kind == .error ? .accent : .dim)
                Text(toast.text).styled(toast.kind == .error ? .title : .body)
                    .fixedSize(horizontal: false, vertical: true)
                Spacer(minLength: 0)
            }
            .padding(.horizontal, metrics.px)
            .padding(.vertical, metrics.py * 1.5)
            .background(Theme.raised)
            .overlay(alignment: .bottom) { Hairline() }
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier("toast")
        .accessibilityLabel(toast.text)
    }
}

/// Invisible elements that expose internal state to UI tests. Only built under `-uitest`.
struct Probes: View {
    var body: some View {
        VStack {
            Text(TestProbe.shared.caretVisible ? "yes" : "no").accessibilityIdentifier("probe.caret")
            Text("\(Int(KeyboardObserver.shared.overlap))").accessibilityIdentifier("probe.keyboard")
        }
        .font(.system(size: 2))
        .foregroundStyle(Theme.bg)
        .frame(width: 2, height: 2)
        .allowsHitTesting(false)
    }
}

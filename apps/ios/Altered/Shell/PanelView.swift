import SwiftUI

/// The action panel, anchored to the bottom where the thumb already is. Destructive actions sit
/// apart and ask for a second tap instead of a dialog: one extra tap, no extra screen.
struct PanelView: View {
    @Environment(AppModel.self) private var app
    @Environment(\.metrics) private var metrics
    let panel: Panel
    @State private var armed: String?

    var body: some View {
        ZStack(alignment: .bottom) {
            Color.black.opacity(0.6)
                .ignoresSafeArea()
                .onTapGesture { app.panel = nil }
                .accessibilityIdentifier("panel.backdrop")

            VStack(spacing: 0) {
                HStack {
                    Text(panel.title).styled(.dim).lineLimit(1)
                    Spacer(minLength: metrics.ch)
                    Text("\(panel.actions.count) actions").styled(.faint)
                }
                .padding(.horizontal, metrics.px)
                .frame(height: 44)
                Hairline()
                ScrollView {
                    VStack(spacing: 0) {
                        ForEach(panel.actions.filter { !$0.destructive }) { action in
                            row(action)
                        }
                        let destructive = panel.actions.filter(\.destructive)
                        if !destructive.isEmpty {
                            Hairline()
                            ForEach(destructive) { action in row(action) }
                        }
                    }
                }
                .scrollBounceBehavior(.basedOnSize)
                .frame(maxHeight: 520)
                .fixedSize(horizontal: false, vertical: true)
                Hairline()
                Button {
                    Haptics.tap()
                    app.panel = nil
                } label: {
                    Text("Close").styled(.dim)
                        .frame(maxWidth: .infinity, minHeight: 52)
                }
                .buttonStyle(Press())
                .accessibilityIdentifier("panel.close")
            }
            .background(Theme.raised.ignoresSafeArea(edges: .bottom))
            .overlay(alignment: .top) { Hairline() }
        }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("panel")
    }

    private func row(_ action: Panel.Action) -> some View {
        let isArmed = armed == action.id
        return Button {
            if action.destructive, !isArmed {
                Haptics.warning()
                armed = action.id
                return
            }
            Haptics.tap()
            app.panel = nil
            action.run()
        } label: {
            HStack(spacing: metrics.ch) {
                Text(isArmed ? "Tap again to \(action.title.lowercased())" : action.title)
                    .styled(action.destructive ? .danger : .title)
                    .lineLimit(1)
                Spacer(minLength: metrics.ch)
                if let hint = action.hint, !isArmed {
                    Text(hint).styled(.faint).lineLimit(1)
                }
            }
            .padding(.horizontal, metrics.px)
            .frame(minHeight: 52)
        }
        .buttonStyle(Press(fill: Theme.line))
        .accessibilityIdentifier("panel.\(action.id)")
    }
}

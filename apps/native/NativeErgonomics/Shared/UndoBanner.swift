import SwiftUI

/// The glass capsule that confirms a change and offers Undo for a few seconds, above the bottom
/// bar. Shake to undo and the three-finger swipe use the same undo manager.
struct UndoBanner: View {
    @Environment(Store.self) private var store
    @Environment(\.undoManager) private var undoManager

    var body: some View {
        VStack(spacing: 0) {
            if let notice = store.notice {
                banner(notice)
            }
        }
        .animation(.snappy, value: store.notice)
    }

    private func banner(_ notice: Notice) -> some View {
        HStack(spacing: 12) {
            Text(notice.message)
                .font(.subheadline)
                .frame(maxWidth: .infinity, alignment: .leading)
            if notice.undoable {
                Button("Undo") { store.undo(undoManager) }
                    .font(.subheadline.weight(.semibold))
            }
            Button("Dismiss", systemImage: "xmark") { store.dismissNotice() }
                .labelStyle(.iconOnly)
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 12)
        .glassEffect(.regular, in: Capsule())
        .padding(.horizontal, 16)
        .padding(.bottom, 8)
        .transition(.move(edge: .bottom).combined(with: .opacity))
    }
}

extension View {
    /// Shows the undo banner over the bottom of this screen.
    func undoBanner() -> some View {
        safeAreaInset(edge: .bottom, spacing: 0) {
            UndoBanner()
        }
    }
}

import SwiftUI

extension View {
    /// A list row with no system insets, separators, or selection background.
    func plainRow() -> some View {
        listRowInsets(EdgeInsets())
            .listRowSeparator(.hidden)
            .listRowBackground(Theme.bg)
    }

    /// A List with the system look removed: rows butt together on the app background.
    func plainList() -> some View {
        listStyle(.plain)
            .scrollContentBackground(.hidden)
            .background(Theme.bg)
            .environment(\.defaultMinListRowHeight, 1)
            .scrollDismissesKeyboard(.immediately)
    }
}

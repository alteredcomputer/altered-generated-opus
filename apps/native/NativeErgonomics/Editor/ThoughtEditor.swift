import SwiftData
import SwiftUI

/// The thought is the editor: SwiftUI's own `TextEditor`, full screen, saving as you type. The
/// system moves the text above the keyboard and keeps the caret in view; dragging the text down
/// dismisses the keyboard. The keyboard bar walks the list this thought was opened from.
struct ThoughtEditor: View {
    let route: ThoughtRoute

    @Environment(Store.self) private var store
    @Environment(\.undoManager) private var undoManager
    @Environment(\.dismiss) private var dismiss
    @Query(sort: \Dataset.alias) private var datasets: [Dataset]

    @State private var thought: Thought?
    @State private var text = ""
    @State private var order: [UUID] = []
    @State private var showingDetails = false
    @FocusState private var focused: Bool

    var body: some View {
        TextEditor(text: $text)
            .focused($focused)
            .font(.body)
            .scrollDismissesKeyboard(.interactively)
            .padding(.horizontal, 12)
            .accessibilityIdentifier("editor")
            .accessibilityLabel("Thought")
            .onChange(of: text) { _, new in
                if let thought { store.stage(new, for: thought) }
            }
            .navigationTitle(thought?.alias ?? "")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar(.hidden, for: .tabBar)
            .toolbar { toolbar }
            .sheet(isPresented: $showingDetails) {
                if let thought { DetailsSheet(thought: thought) }
            }
            .onAppear(perform: appear)
            .background {
                KeyCommand("Back", key: .escape, modifiers: []) { dismiss() }
            }
    }

    // MARK: - Showing a thought

    private func appear() {
        if thought == nil {
            order = route.order
            show(route.id)
            if route.focus { focused = true }
        } else if let thought, thought.modelContext == nil || thought.isDeleted {
            //  Deleted from another tab while this editor waited underneath.
            self.thought = nil
            dismiss()
        }
    }

    private func show(_ id: UUID) {
        guard let next = store.thought(id: id) else {
            thought = nil
            dismiss()
            return
        }
        thought = next
        text = next.content
        store.editor(route.token, shows: id)
    }

    private func canStep(_ offset: Int) -> Bool {
        guard let thought else { return false }
        return Stepper.neighbor(of: thought.id, in: order, by: offset) != nil
    }

    /// Moves to the previous or next thought in place, keeping the keyboard up. The one being
    /// left is saved, or discarded if empty.
    private func step(_ offset: Int) {
        guard let current = thought,
              let next = Stepper.neighbor(of: current.id, in: order, by: offset)
        else { return }
        if store.discardIfEmpty(id: current.id) { order.removeAll { $0 == current.id } }
        show(next)
    }

    /// A new thought in the same datasets, opened in place with the keyboard up.
    private func composeNext() {
        guard let current = thought else { return }
        let datasetIds = current.datasetIDs
        if store.discardIfEmpty(id: current.id) { order.removeAll { $0 == current.id } }
        guard let fresh = store.createThought(in: datasetIds) else { return }
        order.insert(fresh.id, at: 0)
        show(fresh.id)
        focused = true
    }

    private func deleteCurrent() {
        guard let current = thought else { return }
        thought = nil
        store.delete([current], undo: undoManager)
        dismiss()
    }

    // MARK: - Toolbar

    @ToolbarContentBuilder
    private var toolbar: some ToolbarContent {
        if focused {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Done", systemImage: "checkmark") { focused = false }
            }
        }
        ToolbarItem(placement: .topBarTrailing) {
            Button("Details", systemImage: "info.circle") { showingDetails = true }
                .keyboardShortcut("i", modifiers: .command)
                .disabled(thought == nil)
        }
        ToolbarItem(placement: .topBarTrailing) {
            Menu {
                if let thought {
                    Button("Copy Contents", systemImage: "doc.on.doc") { store.copy([thought]) }
                    Button("Duplicate", systemImage: "plus.square.on.square") {
                        if let copy = store.duplicate(thought) {
                            order.insert(copy.id, at: 0)
                            show(copy.id)
                        }
                    }
                    Divider()
                    //  No Cmd-Delete here: in a text view it deletes to the start of the line.
                    Button("Delete", systemImage: "trash", role: .destructive, action: deleteCurrent)
                }
            } label: {
                Label("More", systemImage: "ellipsis")
            }
        }

        //  The keyboard bar: everything needed to keep writing without reaching for the top.
        ToolbarItemGroup(placement: .keyboard) {
            Button("Previous Thought", systemImage: "chevron.up") { step(-1) }
                .disabled(!canStep(-1))
            Button("Next Thought", systemImage: "chevron.down") { step(1) }
                .disabled(!canStep(1))
            Spacer()
            if let thought {
                DatasetsMenu(datasets: datasets, targets: [thought])
            }
            Button("Details", systemImage: "info.circle") { showingDetails = true }
            Button("Hide Keyboard", systemImage: "keyboard.chevron.compact.down") { focused = false }
        }

        //  The same moves when the keyboard is down, and the hardware keys for them.
        ToolbarItemGroup(placement: .bottomBar) {
            Button("Previous Thought", systemImage: "chevron.up") { step(-1) }
                .keyboardShortcut("[", modifiers: .command)
                .disabled(!canStep(-1))
            Button("Next Thought", systemImage: "chevron.down") { step(1) }
                .keyboardShortcut("]", modifiers: .command)
                .disabled(!canStep(1))
        }
        ToolbarSpacer(.flexible, placement: .bottomBar)
        ToolbarItem(placement: .bottomBar) {
            Button("New Thought", systemImage: "square.and.pencil", action: composeNext)
                .keyboardShortcut("n", modifiers: .command)
                .disabled(thought == nil)
        }
    }
}

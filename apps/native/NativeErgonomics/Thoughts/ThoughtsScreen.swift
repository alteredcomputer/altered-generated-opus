import SwiftData
import SwiftUI

enum ThoughtScope: Hashable {
    case all, search
    case dataset(UUID)
}

/// A dataset as a search token.
struct DatasetToken: Identifiable, Hashable {
    let id: UUID
    let alias: String
}

/// Holds the remembered sort, so the list below can build its query from it.
struct ThoughtsScreen: View {
    let scope: ThoughtScope
    @Binding var path: [Route]
    @AppStorage("thoughts.sort") private var sort = ThoughtSort.modified

    var body: some View {
        ThoughtList(scope: scope, sort: $sort, path: $path)
    }
}

/// The Notes-style list: finger-wide rows, search with dataset tokens, swipe actions, context
/// menus with previews, multi-select (Select, or a two-finger swipe) with a bulk bar, and compose.
struct ThoughtList: View {
    let scope: ThoughtScope
    @Binding var sort: ThoughtSort
    @Binding var path: [Route]

    @Environment(Store.self) private var store
    @Environment(\.undoManager) private var undoManager
    @Query private var thoughts: [Thought]
    @Query(sort: \Dataset.alias) private var datasets: [Dataset]

    @State private var query = ""
    @State private var tokens: [DatasetToken] = []
    @State private var searching = false
    @State private var selection = Set<UUID>()
    @State private var editMode = EditMode.inactive
    @State private var picking: PickTarget?

    init(scope: ThoughtScope, sort: Binding<ThoughtSort>, path: Binding<[Route]>) {
        self.scope = scope
        _sort = sort
        _path = path
        _thoughts = Query(sort: sort.wrappedValue.descriptors, animation: .default)
    }

    var body: some View {
        let visible = visibleThoughts
        let order = visible.map(\.id)
        List(selection: $selection) {
            ForEach(visible) { thought in
                NavigationLink(value: Route.thought(ThoughtRoute(id: thought.id, order: order))) {
                    ThoughtRow(thought: thought, sort: sort)
                }
                .tag(thought.id)
                .swipeActions(edge: .trailing) { trailingSwipe(thought) }
                .swipeActions(edge: .leading) { leadingSwipe(thought) }
                .contextMenu {
                    rowMenu(thought, order: order)
                } preview: {
                    ThoughtPreview(thought: thought)
                }
            }
        }
        .listStyle(.plain)
        .environment(\.editMode, $editMode)
        .overlay { emptyState(visible.isEmpty) }
        .navigationTitle(editMode.isEditing ? "\(selection.count) Selected" : title)
        .searchable(
            text: $query, tokens: $tokens, suggestedTokens: .constant(suggestedTokens),
            isPresented: $searching, prompt: Text(prompt)
        ) { token in
            Label(token.alias, systemImage: "square.stack")
        }
        .toolbar { toolbar(visible: visible, order: order) }
        .sheet(item: $picking) { target in
            DatasetPicker(thoughtIDs: target.thoughtIDs)
        }
        .undoBanner()
        .onChange(of: editMode) { _, mode in
            if !mode.isEditing { selection.removeAll() }
        }
        .onChange(of: store.searchRequests) {
            if scope == .search { searching = true }
        }
        .background { keyCommands(isTop: isTop) }
    }

    // MARK: - Data

    private var scopeDataset: UUID? {
        if case .dataset(let id) = scope { id } else { nil }
    }

    /// The datasets a thought must be in to show: the tokens, plus the dataset this list is for.
    private var filterIDs: [UUID] {
        tokens.map(\.id) + (scopeDataset.map { [$0] } ?? [])
    }

    /// The thoughts in sort order that match the query and every dataset token. Row and search
    /// fields are precomputed on the model, so this is a pass of `contains` over strings.
    private var visibleThoughts: [Thought] {
        var allowed: Set<UUID>?
        for id in filterIDs {
            let members = Set(datasets.first { $0.id == id }?.thoughts.map(\.id) ?? [])
            allowed = allowed.map { $0.intersection(members) } ?? members
        }
        return Search.filter(thoughts, query: query, allowed: allowed, id: \.id, haystack: \.searchText)
    }

    private var suggestedTokens: [DatasetToken] {
        let chosen = Set(filterIDs)
        let words = Search.words(query)
        return datasets
            .filter { !chosen.contains($0.id) && Search.matches(words, in: $0.alias.lowercased()) }
            .map { DatasetToken(id: $0.id, alias: $0.alias) }
    }

    private var title: String {
        switch scope {
        case .all: "Thoughts"
        case .search: "Search"
        case .dataset(let id): datasets.first { $0.id == id }?.alias ?? "Dataset"
        }
    }

    private var prompt: String {
        scope == .search ? "Thoughts, datasets, attributes" : "Search"
    }

    /// Whether this list is the screen on top of its stack, so its keys do not fire under an
    /// editor pushed over it.
    private var isTop: Bool {
        switch scope {
        case .all, .search: path.isEmpty
        case .dataset(let id): path.last == .dataset(id)
        }
    }

    private func selected(in visible: [Thought]) -> [Thought] {
        visible.filter { selection.contains($0.id) }
    }

    // MARK: - Actions

    private func open(_ thought: Thought, order: [UUID]) {
        path.append(.thought(ThoughtRoute(id: thought.id, order: order)))
    }

    /// Creates a thought in the datasets being looked at and opens it with the keyboard up.
    private func compose(order: [UUID]) {
        editMode = .inactive
        guard let thought = store.createThought(in: Set(filterIDs)) else { return }
        path.append(.thought(ThoughtRoute(id: thought.id, order: [thought.id] + order, focus: true)))
    }

    private func delete(_ targets: [Thought]) {
        store.delete(targets, undo: undoManager)
        selection.subtract(targets.map(\.id))
    }

    // MARK: - Rows

    @ViewBuilder
    private func trailingSwipe(_ thought: Thought) -> some View {
        Button(role: .destructive) {
            delete([thought])
        } label: {
            Label("Delete", systemImage: "trash")
        }
        Button {
            picking = PickTarget(thoughtIDs: [thought.id])
        } label: {
            Label("Datasets", systemImage: "square.stack")
        }
        .tint(.gray)
    }

    private func leadingSwipe(_ thought: Thought) -> some View {
        Button {
            store.copy([thought])
        } label: {
            Label("Copy", systemImage: "doc.on.doc")
        }
        .tint(.accentColor)
    }

    /// Long press: on a row that is part of a selection, the actions apply to the whole selection.
    @ViewBuilder
    private func rowMenu(_ thought: Thought, order: [UUID]) -> some View {
        let group = editMode.isEditing && selection.contains(thought.id)
            ? thoughts.filter { selection.contains($0.id) }
            : [thought]
        if group.count == 1 {
            Button("Open", systemImage: "arrow.up.right") { open(thought, order: order) }
        }
        Button(group.count == 1 ? "Copy Contents" : "Copy \(group.count) Thoughts", systemImage: "doc.on.doc") {
            store.copy(group)
        }
        DatasetsMenu(datasets: datasets, targets: group)
        if group.count == 1 {
            Button("Duplicate", systemImage: "plus.square.on.square") { _ = store.duplicate(thought) }
            if !editMode.isEditing {
                Button("Select", systemImage: "checkmark.circle") {
                    editMode = .active
                    selection = [thought.id]
                }
            }
        }
        Divider()
        Button(group.count == 1 ? "Delete" : "Delete \(group.count) Thoughts", systemImage: "trash", role: .destructive) {
            delete(group)
        }
    }

    @ViewBuilder
    private func emptyState(_ empty: Bool) -> some View {
        if empty {
            if query.isEmpty, tokens.isEmpty {
                ContentUnavailableView(
                    "No Thoughts", systemImage: "note.text",
                    description: Text("Tap the compose button to write one.")
                )
            } else {
                ContentUnavailableView.search(text: query)
            }
        }
    }

    // MARK: - Toolbar

    @ToolbarContentBuilder
    private func toolbar(visible: [Thought], order: [UUID]) -> some ToolbarContent {
        if editMode.isEditing {
            ToolbarItem(placement: .topBarLeading) {
                let all = !visible.isEmpty && selection.isSuperset(of: order)
                Button(all ? "Deselect All" : "Select All") {
                    selection = all ? [] : Set(order)
                }
                .keyboardShortcut("a", modifiers: [.command, .shift])
            }
            ToolbarItem(placement: .topBarTrailing) {
                Button("Done") { editMode = .inactive }
            }
            ToolbarItem(placement: .bottomBar) {
                DatasetsMenu(datasets: datasets, targets: selected(in: visible))
                    .disabled(selection.isEmpty)
            }
            ToolbarSpacer(.flexible, placement: .bottomBar)
            ToolbarItemGroup(placement: .bottomBar) {
                Button("Copy", systemImage: "doc.on.doc") { store.copy(selected(in: visible)) }
                    .disabled(selection.isEmpty)
                Button("Delete", systemImage: "trash", role: .destructive) {
                    delete(selected(in: visible))
                    editMode = .inactive
                }
                .keyboardShortcut(.delete, modifiers: .command)
                .disabled(selection.isEmpty)
            }
        } else {
            ToolbarItem(placement: .topBarTrailing) { filterMenu }
            ToolbarItem(placement: .topBarTrailing) { moreMenu }
            if scope != .search {
                DefaultToolbarItem(kind: .search, placement: .bottomBar)
                ToolbarSpacer(.fixed, placement: .bottomBar)
                ToolbarItem(placement: .bottomBar) {
                    Button("New Thought", systemImage: "square.and.pencil") { compose(order: order) }
                        .keyboardShortcut("n", modifiers: .command)
                        .accessibilityIdentifier("compose")
                }
            }
        }
    }

    private var filterMenu: some View {
        Menu {
            ForEach(datasets.filter { $0.id != scopeDataset }) { dataset in
                Toggle(dataset.alias, isOn: tokenBinding(dataset))
            }
            if !tokens.isEmpty {
                Divider()
                Button("Clear Filter", systemImage: "xmark") { tokens.removeAll() }
            }
        } label: {
            Label(
                "Filter by Dataset",
                systemImage: tokens.isEmpty
                    ? "line.3.horizontal.decrease" : "line.3.horizontal.decrease.circle.fill"
            )
        }
    }

    private var moreMenu: some View {
        Menu {
            Button("Select Thoughts", systemImage: "checkmark.circle") { editMode = .active }
            Picker(selection: $sort) {
                ForEach(ThoughtSort.allCases) { option in
                    Text(option.label).tag(option)
                }
            } label: {
                Label("Sort By", systemImage: "arrow.up.arrow.down")
                Text(sort.label)
            }
            .pickerStyle(.menu)
        } label: {
            Label("More", systemImage: "ellipsis")
        }
    }

    private func tokenBinding(_ dataset: Dataset) -> Binding<Bool> {
        Binding(
            get: { tokens.contains { $0.id == dataset.id } },
            set: { on in
                tokens.removeAll { $0.id == dataset.id }
                if on { tokens.append(DatasetToken(id: dataset.id, alias: dataset.alias)) }
            }
        )
    }

    // MARK: - Keys

    @ViewBuilder
    private func keyCommands(isTop: Bool) -> some View {
        KeyCommand("Back", key: .escape, modifiers: []) {
            if editMode.isEditing {
                editMode = .inactive
            } else if searching || !query.isEmpty || !tokens.isEmpty {
                query = ""
                tokens.removeAll()
                searching = false
            }
        }
        .disabled(!isTop)
        KeyCommand("Select", key: "e", modifiers: .command) {
            editMode = editMode.isEditing ? .inactive : .active
        }
        .disabled(!isTop)
    }
}

struct PickTarget: Identifiable {
    let id = UUID()
    let thoughtIDs: [UUID]
}

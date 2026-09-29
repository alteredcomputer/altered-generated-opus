import AlteredCore
import SwiftUI

/// The main list. Search lives at the bottom, in the thumb's reach, and rides on the keyboard;
/// query tokens appear above it while typing, so filters are one tap instead of typed syntax.
struct ThoughtsScreen: View {
    @Environment(AppModel.self) private var app
    @Environment(\.metrics) private var metrics
    @State private var query = ""
    @State private var datasetId: ID?
    @FocusState private var searching: Bool

    private var fullQuery: String {
        let prefix = datasetId.flatMap { app.library.dataset($0) }.map { "#\($0.alias) " } ?? ""
        return prefix + query
    }

    var body: some View {
        let results = Search.run(fullQuery, in: app.library)
        let ids = results.map(\.id)
        TabScaffold {
            Header(title: "Thoughts") {
                SyncStatus()
                HeaderButton(label: filterLabel + " ▾", role: .dim, identifier: "filter") { openFilter() }
            }
            List {
                ForEach(results) { thought in
                    Pressable(action: {
                        app.router.push(.thought(thought.id, context: ids))
                    }, hold: {
                        app.panel = ThoughtActions.panel(thought, app: app, context: ids, open: true)
                    }) {
                        ThoughtRow(thought: thought)
                    }
                    .accessibilityIdentifier("row.\(thought.id)")
                    .plainRow()
                    .swipeActions(edge: .leading, allowsFullSwipe: true) {
                        Button("Edit") {
                            Haptics.tap()
                            app.router.push(.compose(thought.id))
                        }
                        .tint(Theme.pressed)
                    }
                    .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                        Button(thought.pinned ? "Unpin" : "Pin") {
                            Haptics.tap()
                            app.perform(.setPinned(id: thought.id, !thought.pinned))
                        }
                        .tint(Theme.accent)
                        Button("More") {
                            Haptics.tap()
                            app.panel = ThoughtActions.panel(thought, app: app, context: ids, open: true)
                        }
                        .tint(Theme.pressed)
                    }
                }
                if results.isEmpty {
                    EmptyNote(text: app.library.thoughts.isEmpty ? "No thoughts yet. Tap + to write one." : "No thoughts match.")
                        .plainRow()
                }
            }
            .plainList()
            .accessibilityIdentifier("list.thoughts")
        } bottom: {
            VStack(spacing: 0) {
                if searching { TokenStrip(query: $query) }
                SearchBar(
                    query: $query, focused: $searching, count: results.count,
                    placeholder: "Search thoughts...",
                    onSubmit: {
                        if let first = results.first { app.router.push(.thought(first.id, context: ids)) }
                    },
                    onNew: { app.router.push(.compose(nil, datasetId: datasetId)) }
                )
            }
        }
    }

    private var filterLabel: String {
        datasetId.flatMap { app.library.dataset($0) }.map { "#\($0.alias)" } ?? "All"
    }

    private func openFilter() {
        let library = app.library
        var actions: [Panel.Action] = [
            .init(id: "all", title: "All Thoughts", hint: "\(library.thoughts.count)") { datasetId = nil }
        ]
        for dataset in library.datasets {
            actions.append(.init(id: "ds.\(dataset.alias)", title: "#\(dataset.alias)", hint: "\(library.thoughts(in: dataset.id).count)") {
                datasetId = dataset.id
            })
        }
        if !fullQuery.trimmingCharacters(in: .whitespaces).isEmpty {
            let saved = fullQuery
            actions.append(.init(id: "save-view", title: "Save Search as View", hint: "views") {
                app.router.push(.viewForm(nil, query: saved))
            })
        }
        app.panel = Panel(title: "Filter by dataset", actions: actions)
    }
}

/// The search field with its count, clear, done, and new controls.
struct SearchBar: View {
    @Environment(\.metrics) private var metrics
    @Binding var query: String
    var focused: FocusState<Bool>.Binding
    let count: Int
    let placeholder: String
    var onSubmit: () -> Void = {}
    var onNew: (() -> Void)?

    var body: some View {
        VStack(spacing: 0) {
            Hairline()
            HStack(spacing: 0) {
                Text(">").styled(.faint).padding(.leading, metrics.px).padding(.trailing, metrics.ch)
                TextField("", text: $query, prompt: Text(placeholder).foregroundStyle(Theme.faint))
                    .textFieldStyle(.plain)
                    .font(metrics.font())
                    .foregroundStyle(Theme.fg)
                    .tint(Theme.accent)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .submitLabel(.go)
                    .focused(focused)
                    .onSubmit(onSubmit)
                    .accessibilityIdentifier("search")
                if !query.isEmpty {
                    Text("\(count)").styled(.faint).padding(.horizontal, metrics.ch)
                    Button {
                        Haptics.tap()
                        query = ""
                    } label: {
                        Text("×").styled(.dim).frame(width: 40, height: 48)
                    }
                    .buttonStyle(Press())
                    .accessibilityIdentifier("search.clear")
                }
                if focused.wrappedValue {
                    Button {
                        Haptics.tap()
                        focused.wrappedValue = false
                    } label: {
                        Text("Done").styled(.body).padding(.horizontal, metrics.ch * 1.5).frame(height: 48)
                    }
                    .buttonStyle(Press())
                    .accessibilityIdentifier("search.done")
                } else if let onNew {
                    VHairline().frame(height: 48)
                    Button {
                        Haptics.tap()
                        onNew()
                    } label: {
                        Text("+").styled(.title, scale: 1.3).frame(width: 56, height: 48)
                    }
                    .buttonStyle(Press())
                    .accessibilityIdentifier("new")
                    .accessibilityLabel("New thought")
                }
            }
            .frame(height: 48)
        }
        .background(Theme.bg)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("searchbar")
    }
}

/// One-tap query tokens shown above the keyboard while searching. Tapping adds the token, or
/// removes it if it is already in the query.
struct TokenStrip: View {
    @Environment(AppModel.self) private var app
    @Environment(\.metrics) private var metrics
    @Binding var query: String

    private var tokens: [String] {
        let states = ["is:draft", "is:incomplete", "is:unvalidated", "is:pinned", "is:proposed", "by:koa"]
        let sorts = ["sort:updated", "sort:alias"]
        return app.library.datasets.map { "#\($0.alias)" } + states + sorts
    }

    var body: some View {
        let words = query.split(whereSeparator: \.isWhitespace).map(String.init)
        VStack(spacing: 0) {
            Hairline()
            ScrollView(.horizontal) {
                HStack(spacing: metrics.ch) {
                    ForEach(tokens, id: \.self) { token in
                        Chip(text: token, on: words.contains(token), identifier: "token.\(token)") {
                            query = words.contains(token)
                                ? words.filter { $0 != token }.joined(separator: " ")
                                : (words + [token]).joined(separator: " ") + " "
                        }
                    }
                }
                .padding(.horizontal, metrics.px)
            }
            .scrollIndicators(.hidden)
            .frame(height: 46)
        }
        .background(Theme.bg)
    }
}

/// The outbox at a glance: a spinner and a count while changes wait, "offline" when they cannot
/// be sent. Tapping opens the outbox.
struct SyncStatus: View {
    @Environment(AppModel.self) private var app
    @Environment(\.metrics) private var metrics

    var body: some View {
        let pending = app.store.outbox.count
        if pending > 0 || !app.settings.network.online {
            Button {
                Haptics.tap()
                app.router.push(.outbox)
            } label: {
                HStack(spacing: metrics.ch * 0.6) {
                    if app.settings.network.online {
                        Spinner()
                        Text("\(pending)").styled(.accent)
                    } else {
                        Text("offline\(pending > 0 ? " \(pending)" : "")").styled(.accent)
                    }
                }
                .padding(.horizontal, metrics.ch)
                .frame(height: 44)
            }
            .buttonStyle(Press())
            .accessibilityIdentifier("sync")
        }
    }
}

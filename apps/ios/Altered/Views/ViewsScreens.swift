import AlteredCore
import SwiftUI

/// Saved views: a query plus a layout, stored as data. The same renderer draws any of them, so a
/// new view never needs new code, and one could arrive from a server as JSON.
struct ViewsScreen: View {
    @Environment(AppModel.self) private var app
    @Environment(\.metrics) private var metrics

    var body: some View {
        let library = app.library
        TabScaffold {
            Header(title: "Views") {
                SyncStatus()
                HeaderButton(label: "+ New", identifier: "views.new") { app.router.push(.viewForm(nil, query: "")) }
            }
            List {
                ForEach(library.views) { view in
                    Pressable(action: {
                        app.router.push(.view(view.id))
                    }, hold: {
                        app.panel = ViewActions.panel(view, app: app)
                    }) {
                        VStack(alignment: .leading, spacing: metrics.ch * 0.4) {
                            HStack(alignment: .firstTextBaseline) {
                                Text(view.alias).styled(.title).lineLimit(1)
                                Spacer(minLength: metrics.ch)
                                Text("\(Search.run(view.query, in: library).count)").styled(.dim)
                            }
                            Text("\(view.query.isEmpty ? "everything" : view.query)  ·  \(view.layout.label)")
                                .styled(.faint).lineLimit(1)
                        }
                        .padding(.horizontal, metrics.px)
                        .padding(.vertical, metrics.py)
                    }
                    .plainRow()
                    .accessibilityIdentifier("view.\(view.id)")
                    .swipeActions(edge: .trailing) {
                        Button("More") {
                            Haptics.tap()
                            app.panel = ViewActions.panel(view, app: app)
                        }
                        .tint(Theme.pressed)
                    }
                }
                if library.views.isEmpty {
                    EmptyNote(text: "No views. Save a search to make one.").plainRow()
                }
            }
            .plainList()
        }
    }
}

@MainActor
enum ViewActions {
    static func panel(_ view: SavedView, app: AppModel) -> Panel {
        Panel(title: view.alias, actions: [
            .init(id: "open", title: "Open", hint: "tap") { app.router.push(.view(view.id)) },
            .init(id: "edit", title: "Edit View") { app.router.push(.viewForm(view.id, query: view.query)) },
            .init(id: "definition", title: "Show Definition", hint: "json") { app.router.push(.definition(view.id)) },
            .init(id: "delete", title: "Delete View", destructive: true) {
                if app.perform(.deleteView(id: view.id), done: "Deleted \(view.alias).") {
                    if case .view? = app.router.paths[app.router.tab]?.last { app.router.pop() }
                }
            }
        ])
    }
}

/// Renders a saved view in its layout.
struct ViewScreen: View {
    @Environment(AppModel.self) private var app
    @Environment(\.metrics) private var metrics
    let id: ID

    var body: some View {
        VStack(spacing: 0) {
            if let view = app.library.view(id) {
                let thoughts = Search.run(view.query, in: app.library)
                Header(title: view.alias, back: true) {
                    SyncStatus()
                    HeaderButton(label: "⋯", role: .dim, identifier: "view.actions") {
                        app.panel = ViewActions.panel(view, app: app)
                    }
                }
                HStack {
                    Text(view.query.isEmpty ? "everything" : view.query).styled(.faint).lineLimit(1)
                    Spacer(minLength: metrics.ch)
                    Text("\(thoughts.count)").styled(.faint)
                }
                .padding(.horizontal, metrics.px)
                .frame(height: 36)
                Hairline()
                ScrollView {
                    ViewBody(view: view, thoughts: thoughts)
                }
                .accessibilityIdentifier("view.body")
            } else {
                Header(title: "View", back: true)
                EmptyNote(text: "This view no longer exists.")
                Spacer()
            }
        }
        .background(Theme.bg)
    }
}

struct ViewBody: View {
    @Environment(AppModel.self) private var app
    @Environment(\.metrics) private var metrics
    let view: SavedView
    let thoughts: [Thought]

    var body: some View {
        let ids = thoughts.map(\.id)
        switch view.layout {
        case .list:
            LazyVStack(spacing: 0) {
                ForEach(thoughts) { thought in row(thought, ids) }
            }
        case .grid:
            LazyVGrid(columns: [GridItem(.flexible(), spacing: 1), GridItem(.flexible(), spacing: 1)], spacing: 1) {
                ForEach(thoughts) { thought in
                    Pressable(base: Theme.bg, action: {
                        app.router.push(.thought(thought.id, context: ids))
                    }, hold: {
                        app.panel = ThoughtActions.panel(thought, app: app, context: ids, open: true)
                    }) {
                        VStack(alignment: .leading, spacing: metrics.ch * 0.6) {
                            Text(thought.title).styled(thought.isDraft ? .body : .title).lineLimit(2)
                            Text(thought.content).styled(.dim).lineLimit(4)
                            Spacer(minLength: 0)
                        }
                        .padding(metrics.ch * 2)
                        .frame(maxWidth: .infinity, minHeight: metrics.size * 10, alignment: .topLeading)
                    }
                }
            }
            .background(Theme.line)
        case .board:
            let columns = view.columns(thoughts, in: app.library)
            LazyVStack(alignment: .leading, spacing: 0) {
                ForEach(columns, id: \.title) { column in
                    Heading(level: 2, text: "\(column.title) (\(column.thoughts.count))")
                        .padding(.horizontal, metrics.px)
                        .padding(.top, metrics.py * 2.5)
                        .padding(.bottom, metrics.py)
                        .accessibilityIdentifier("column.\(column.title)")
                    ForEach(column.thoughts) { thought in row(thought, ids) }
                }
            }
        }
        if thoughts.isEmpty { EmptyNote(text: "Nothing matches this view.") }
    }

    private func row(_ thought: Thought, _ ids: [ID]) -> some View {
        Pressable(action: {
            app.router.push(.thought(thought.id, context: ids))
        }, hold: {
            app.panel = ThoughtActions.panel(thought, app: app, context: ids, open: true)
        }) {
            ThoughtRow(thought: thought)
        }
        .accessibilityIdentifier("row.\(thought.id)")
    }
}

/// Name, query with a live count, and layout. Board columns come from choice fields.
struct ViewFormScreen: View {
    @Environment(AppModel.self) private var app
    @Environment(\.metrics) private var metrics
    let id: ID?
    let query: String

    @State private var alias = ""
    @State private var text = ""
    @State private var layout: SavedView.Layout = .list
    @State private var loaded = false

    var body: some View {
        let library = app.library
        let parsed = Query(text)
        let count = Search.run(parsed, in: library).count
        let boardFields = Array(Set(library.datasets.flatMap(\.fields).filter { $0.type == .choice }.map(\.name))).sorted()

        VStack(spacing: 0) {
            Header(title: id == nil ? "New View" : "Edit View", back: true)
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    section("name") {
                        LineField(placeholder: "Open questions", text: $alias, identifier: "viewform.alias")
                    }
                    section("query  \(count) match\(count == 1 ? "" : "es")") {
                        LineField(placeholder: "#questions answered:no", text: $text, identifier: "viewform.query",
                                  keyboard: .asciiCapable, capitalization: .never, role: .body)
                        if !parsed.unknown.isEmpty {
                            Text("Not understood: \(parsed.unknown.joined(separator: " "))").styled(.accent)
                        }
                    }
                    section("layout") {
                        FlowLayout(spacing: metrics.ch, lineSpacing: metrics.ch) {
                            Chip(text: "list", on: layout == .list, identifier: "layout.list") { layout = .list }
                            Chip(text: "grid", on: layout == .grid, identifier: "layout.grid") { layout = .grid }
                            ForEach(boardFields, id: \.self) { field in
                                Chip(text: "board by \(field)", on: layout == .board(field: field), identifier: "layout.board.\(field)") {
                                    layout = .board(field: field)
                                }
                            }
                        }
                    }
                }
            }
            .scrollDismissesKeyboard(.immediately)
            BottomBar {
                BarButton(label: "Save", key: "↵", primary: true,
                          enabled: !alias.trimmingCharacters(in: .whitespaces).isEmpty && parsed.unknown.isEmpty,
                          identifier: "viewform.save") { save() }
            }
        }
        .background(Theme.bg)
        .onAppear {
            guard !loaded else { return }
            loaded = true
            text = query
            if let id, let view = app.library.view(id) {
                alias = view.alias
                text = view.query
                layout = view.layout
            }
        }
    }

    private func section<Content: View>(_ label: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: metrics.ch) {
            Text(label).styled(.dim)
            content()
        }
        .padding(.horizontal, metrics.px)
        .padding(.vertical, metrics.py * 1.5)
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay(alignment: .bottom) { Hairline() }
    }

    private func save() {
        let existing = id.flatMap { app.library.view($0) }
        let view = SavedView(id: id ?? IDs.make(), alias: alias, query: text, layout: layout,
                             createdAt: existing?.createdAt ?? Clock.now())
        if app.perform(.saveView(view), done: "Saved \(view.alias).") {
            app.router.replaceTop(with: .view(view.id))
        }
    }
}

/// The JSON a view is stored as: proof that a screen here is data, not code.
struct DefinitionScreen: View {
    @Environment(AppModel.self) private var app
    @Environment(\.metrics) private var metrics
    let id: ID

    var body: some View {
        let json = app.library.view(id)
            .flatMap { try? Coding.encoder.encode($0) }
            .flatMap { String(data: $0, encoding: .utf8) } ?? "{}"
        VStack(spacing: 0) {
            Header(title: "Definition", back: true)
            ScrollView {
                VStack(alignment: .leading, spacing: metrics.size * 1.5) {
                    Text("A view is data. This is everything the app needs to draw it; the same JSON could come from a server and render with no update.")
                        .styled(.dim)
                        .fixedSize(horizontal: false, vertical: true)
                    Text(json)
                        .styled(.body)
                        .textSelection(.enabled)
                        .fixedSize(horizontal: false, vertical: true)
                        .padding(metrics.ch * 2)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Theme.raised)
                        .accessibilityIdentifier("definition.json")
                }
                .padding(.horizontal, metrics.px)
                .padding(.vertical, metrics.py * 3)
            }
            BottomBar {
                BarButton(label: "Copy JSON", key: "⌘C", primary: true, identifier: "bar.copy") {
                    UIPasteboard.general.string = json
                    app.show("Copied the definition.")
                }
            }
        }
        .background(Theme.bg)
    }
}

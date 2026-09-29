import AlteredCore
import SwiftUI

/// Datasets as a two-column grid of tiles: name, purpose, size, and anything incomplete.
struct SetsScreen: View {
    @Environment(AppModel.self) private var app
    @Environment(\.metrics) private var metrics

    var body: some View {
        let library = app.library
        TabScaffold {
            Header(title: "Sets") {
                SyncStatus()
                HeaderButton(label: "+ New", identifier: "sets.new") { app.router.push(.datasetForm(nil)) }
            }
            ScrollView {
                LazyVGrid(columns: [GridItem(.flexible(), spacing: 1), GridItem(.flexible(), spacing: 1)], spacing: 1) {
                    ForEach(library.datasets) { dataset in
                        Pressable(base: Theme.bg, action: {
                            app.router.push(.dataset(dataset.id))
                        }, hold: {
                            app.panel = DatasetActions.panel(dataset, app: app)
                        }) {
                            DatasetTile(dataset: dataset)
                        }
                        .accessibilityIdentifier("tile.\(dataset.alias)")
                    }
                }
                .background(Theme.line)
                .overlay(alignment: .bottom) { Hairline() }
                if library.datasets.isEmpty {
                    EmptyNote(text: "No datasets. A dataset is a tag with a schema.")
                }
            }
        }
    }
}

struct DatasetTile: View {
    @Environment(AppModel.self) private var app
    @Environment(\.metrics) private var metrics
    let dataset: Dataset

    var body: some View {
        let library = app.library
        let thoughts = library.thoughts(in: dataset.id)
        let incomplete = thoughts.filter { thought in
            !thought.isDraft && Validation.issues(for: thought, in: library).contains { $0.kind == .missing || $0.kind == .invalid }
        }.count
        VStack(alignment: .leading, spacing: metrics.ch * 0.6) {
            HStack(spacing: 0) {
                Text("#").styled(.faint)
                Text(dataset.alias).styled(.title).lineLimit(1)
                Spacer(minLength: 0)
                if app.store.isPending(dataset.id) { Spinner() }
            }
            Text(dataset.description.isEmpty ? "No description." : dataset.description)
                .styled(.dim).lineLimit(2)
                .frame(maxWidth: .infinity, alignment: .leading)
            Spacer(minLength: metrics.ch)
            Text("\(thoughts.count) thoughts").styled(.body)
            Text(incomplete > 0 ? "\(incomplete) incomplete" : "\(dataset.fields.count) field\(dataset.fields.count == 1 ? "" : "s")")
                .styled(incomplete > 0 ? .accent : .faint)
        }
        .padding(metrics.ch * 2)
        .frame(maxWidth: .infinity, minHeight: metrics.size * 11, alignment: .topLeading)
    }
}

@MainActor
enum DatasetActions {
    static func panel(_ dataset: Dataset, app: AppModel) -> Panel {
        let id = dataset.id
        return Panel(title: "#\(dataset.alias)", actions: [
            .init(id: "open", title: "Open", hint: "tap") { app.router.push(.dataset(id)) },
            .init(id: "new-thought", title: "New Thought in #\(dataset.alias)") { app.router.push(.compose(nil, datasetId: id)) },
            .init(id: "add-field", title: "Add Field") { app.router.push(.fieldForm(datasetId: id, fieldId: nil)) },
            .init(id: "edit", title: "Rename or Describe") { app.router.push(.datasetForm(id)) },
            .init(id: "view", title: "Save as View") {
                app.router.open(.viewForm(nil, query: "#\(dataset.alias)"), in: .views)
            },
            .init(id: "delete", title: "Delete Dataset", destructive: true) {
                if app.perform(.deleteDataset(id: id, at: Clock.now()), done: "Deleted #\(dataset.alias). Its thoughts were kept.") {
                    if case .dataset? = app.router.paths[app.router.tab]?.last { app.router.pop() }
                }
            }
        ])
    }
}

/// A dataset as a document: purpose, schema, and its thoughts.
struct DatasetScreen: View {
    @Environment(AppModel.self) private var app
    @Environment(\.metrics) private var metrics
    let id: ID

    var body: some View {
        VStack(spacing: 0) {
            Header(title: "Dataset", back: true) { SyncStatus() }
            if let dataset = app.library.dataset(id) {
                let thoughts = app.library.thoughts(in: id).sorted { $0.updatedAt > $1.updatedAt }
                let ids = thoughts.map(\.id)
                ScrollView {
                    VStack(alignment: .leading, spacing: metrics.size * 1.5) {
                        Heading(level: 1, text: dataset.alias)
                        Text(dataset.description.isEmpty ? "No description." : dataset.description)
                            .styled(dataset.description.isEmpty ? .faint : .body)
                        Rule()
                        Heading(level: 2, text: "Fields")
                        fields(dataset)
                        Heading(level: 2, text: "Thoughts (\(thoughts.count))")
                    }
                    .padding(.horizontal, metrics.px)
                    .padding(.top, metrics.py * 3)
                    .padding(.bottom, metrics.py)
                    LazyVStack(spacing: 0) {
                        ForEach(thoughts) { thought in
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
                    if thoughts.isEmpty { EmptyNote(text: "Nothing tagged #\(dataset.alias) yet.") }
                }
                BottomBar {
                    BarButton(label: "New Thought", key: "+", primary: true, identifier: "bar.new-thought") {
                        app.router.push(.compose(nil, datasetId: id))
                    }
                    VHairline()
                    BarButton(label: "Actions", key: "⋯", identifier: "bar.actions") {
                        app.panel = DatasetActions.panel(dataset, app: app)
                    }
                }
            } else {
                EmptyNote(text: "This dataset no longer exists.")
                Spacer()
            }
        }
        .background(Theme.bg)
    }

    @ViewBuilder private func fields(_ dataset: Dataset) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            ForEach(dataset.fields) { field in
                Pressable(action: { app.router.push(.fieldForm(datasetId: id, fieldId: field.id)) }) {
                    VStack(alignment: .leading, spacing: 2) {
                        HStack(alignment: .firstTextBaseline, spacing: metrics.ch) {
                            Text(field.name).styled(.title)
                            Text("\(field.type.rawValue)\(field.required ? "" : " · optional")").styled(.dim)
                            Spacer(minLength: 0)
                        }
                        if field.type == .choice {
                            Text(field.options.joined(separator: " / ")).styled(.faint)
                        }
                    }
                    .padding(.vertical, metrics.ch * 0.6)
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                .accessibilityIdentifier("schema.\(field.name)")
            }
            Pressable(action: { app.router.push(.fieldForm(datasetId: id, fieldId: nil)) }) {
                Text("+ Add field").styled(.dim)
                    .padding(.vertical, metrics.ch * 0.6)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .accessibilityIdentifier("schema.add")
        }
    }
}

/// Creating or renaming a dataset. Names are short lowercase words, checked as you type.
struct DatasetFormScreen: View {
    @Environment(AppModel.self) private var app
    @Environment(\.metrics) private var metrics
    let id: ID?
    @State private var alias = ""
    @State private var description = ""
    @State private var loaded = false
    @FocusState private var focus: Int?

    var body: some View {
        let problem = Mutation.datasetAliasProblem(alias, id: id ?? "", in: app.library)
        VStack(spacing: 0) {
            Header(title: id == nil ? "New Dataset" : "Edit Dataset", back: true)
            VStack(alignment: .leading, spacing: 0) {
                row("name") {
                    HStack(spacing: 0) {
                        Text("#").styled(.faint)
                        LineField(placeholder: "open-questions", text: $alias, identifier: "dataset.alias",
                                  keyboard: .asciiCapable, capitalization: .never, submit: .next) { focus = 1 }
                            .focused($focus, equals: 0)
                    }
                }
                row("purpose") {
                    LineField(placeholder: "What belongs here", text: $description, identifier: "dataset.description", role: .body)
                        .focused($focus, equals: 1)
                }
                Text(alias.isEmpty ? "Lowercase words joined by hyphens." : (problem ?? "Looks good."))
                    .styled(alias.isEmpty ? .faint : (problem == nil ? .dim : .accent))
                    .padding(.horizontal, metrics.px)
                    .padding(.vertical, metrics.py)
                    .accessibilityIdentifier("dataset.problem")
            }
            Spacer()
            BottomBar {
                BarButton(label: id == nil ? "Create" : "Save", key: "↵", primary: true, enabled: problem == nil, identifier: "dataset.save") {
                    save()
                }
            }
        }
        .background(Theme.bg)
        .onAppear {
            guard !loaded else { return }
            loaded = true
            if let id, let dataset = app.library.dataset(id) {
                alias = dataset.alias
                description = dataset.description
            } else {
                focus = 0
            }
        }
    }

    private func row<Content: View>(_ label: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(spacing: 0) {
            HStack(spacing: metrics.ch) {
                Text(label).styled(.dim).frame(width: metrics.ch * 8, alignment: .leading)
                content()
            }
            .padding(.horizontal, metrics.px)
            .frame(minHeight: 52)
            Hairline()
        }
    }

    private func save() {
        let now = Clock.now()
        if let id {
            if app.perform(.editDataset(id: id, alias: alias, description: description, at: now), done: "Saved #\(alias).") {
                app.router.pop()
            }
        } else {
            let newId = IDs.make()
            let dataset = Dataset(id: newId, alias: alias, description: description.trimmingCharacters(in: .whitespacesAndNewlines),
                                  createdAt: now, updatedAt: now)
            if app.perform(.createDataset(dataset), done: "Created #\(alias).") {
                app.router.replaceTop(with: .dataset(newId))
            }
        }
    }
}

/// Adding or editing one field. Required is the default. Adding a required field to a dataset
/// that already has thoughts offers a value to fill them with, like a column default in SQL;
/// left empty, those thoughts show up in Review as incomplete.
struct FieldFormScreen: View {
    @Environment(AppModel.self) private var app
    @Environment(\.metrics) private var metrics
    let datasetId: ID
    let fieldId: ID?

    @State private var name = ""
    @State private var type: FieldType = .text
    @State private var required = true
    @State private var options = ""
    @State private var description = ""
    @State private var fill = ""
    @State private var loaded = false
    @State private var armed = false

    private var draft: Field {
        Field(
            id: fieldId ?? "draft", name: name.trimmingCharacters(in: .whitespaces), type: type, required: required,
            options: type == .choice ? options.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) } : [],
            description: description.trimmingCharacters(in: .whitespacesAndNewlines)
        )
    }

    var body: some View {
        let library = app.library
        let dataset = library.dataset(datasetId)
        let count = library.thoughts(in: datasetId).count
        let problem = dataset.flatMap { Mutation.fieldProblem(draft, in: $0) }
            ?? (fill.isEmpty ? nil : draft.problem(with: fill).map { "Fill value \($0)." })
        let showFill = fieldId == nil && required && count > 0

        VStack(spacing: 0) {
            Header(title: fieldId == nil ? "Add Field" : "Edit Field", back: true)
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    section("name") {
                        LineField(placeholder: "status", text: $name, identifier: "field.name", keyboard: .asciiCapable, capitalization: .never)
                    }
                    section(fieldId == nil ? "type" : "type (fixed)") {
                        FlowLayout(spacing: metrics.ch, lineSpacing: metrics.ch) {
                            ForEach(FieldType.allCases, id: \.self) { option in
                                Chip(text: option.rawValue, on: type == option, identifier: "type.\(option.rawValue)") {
                                    if fieldId == nil { type = option }
                                }
                            }
                        }
                    }
                    section("rule") {
                        HStack(spacing: metrics.ch) {
                            Chip(text: "required", on: required, identifier: "rule.required") { required = true }
                            Chip(text: "optional", on: !required, identifier: "rule.optional") { required = false }
                        }
                    }
                    if type == .choice {
                        section("options") {
                            LineField(placeholder: "open, locked, reversed", text: $options, identifier: "field.options",
                                      capitalization: .never, role: .body)
                        }
                    }
                    section("note") {
                        LineField(placeholder: "What the value means", text: $description, identifier: "field.description", role: .body)
                    }
                    if showFill {
                        section("fill \(count)") {
                            LineField(placeholder: "value for existing thoughts", text: $fill, identifier: "field.fill",
                                      capitalization: .never, role: .body)
                        }
                        Text(fill.isEmpty
                            ? "Left empty, the \(count) thoughts in #\(dataset?.alias ?? "") become incomplete and wait in Review."
                            : "All \(count) thoughts get this value, each as a new revision.")
                            .styled(.faint)
                            .padding(.horizontal, metrics.px)
                            .padding(.vertical, metrics.py)
                    }
                    if let problem, !name.isEmpty {
                        Text(problem).styled(.accent)
                            .padding(.horizontal, metrics.px)
                            .padding(.vertical, metrics.py)
                            .accessibilityIdentifier("field.problem")
                    }
                }
            }
            .scrollDismissesKeyboard(.immediately)
            BottomBar {
                if fieldId != nil {
                    BarButton(label: armed ? "Tap again" : "Remove", identifier: "field.remove") { remove() }
                    VHairline()
                }
                BarButton(label: fieldId == nil ? "Add" : "Save", key: "↵", primary: true,
                          enabled: problem == nil && !name.isEmpty, identifier: "field.save") { save(showFill: showFill) }
            }
        }
        .background(Theme.bg)
        .onAppear(perform: load)
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

    private func load() {
        guard !loaded else { return }
        loaded = true
        guard let fieldId, let field = app.library.dataset(datasetId)?.fields.first(where: { $0.id == fieldId }) else { return }
        name = field.name
        type = field.type
        required = field.required
        options = field.options.joined(separator: ", ")
        description = field.description
    }

    private func save(showFill: Bool) {
        let now = Clock.now()
        if fieldId != nil {
            if app.perform(.editField(datasetId: datasetId, field: draft, at: now), done: "Saved \(draft.name).") { app.router.pop() }
        } else {
            var field = draft
            field.id = IDs.make()
            let value = showFill && !fill.isEmpty ? fill : nil
            if app.perform(.addField(datasetId: datasetId, field: field, fill: value, at: now), done: "Added \(field.name).") {
                app.router.pop()
            }
        }
    }

    private func remove() {
        guard let fieldId else { return }
        if !armed {
            armed = true
            Haptics.warning()
            return
        }
        if app.perform(.removeField(datasetId: datasetId, fieldId: fieldId, at: Clock.now()), done: "Removed \(name).") {
            app.router.pop()
        }
    }
}

import AlteredCore
import SwiftUI

/// Writing a thought. One fixed layout, top to bottom: alias, datasets, the content editor
/// filling the rest, and a toolbar. The toolbar rides on the keyboard through SwiftUI's own
/// keyboard avoidance, the editor shrinks by exactly that much and keeps its caret in view.
///
/// Unsaved text is kept in the app model, so leaving by the back swipe never loses it.
struct ComposerScreen: View {
    @Environment(AppModel.self) private var app
    @Environment(\.metrics) private var metrics
    let id: ID?
    let datasetId: ID?

    @State private var edit = ThoughtEdit()
    @State private var original = ThoughtEdit()
    @State private var loaded = false
    @State private var restored = false
    @State private var contentFocused = false
    @State private var showIssues = false
    @FocusState private var aliasFocused: Bool

    private var key: String { id ?? "new" }

    var body: some View {
        let library = app.library
        let clean = Validation.normalized(edit, library: library)
        let issues = Validation.issues(for: clean, id: id, in: library)
        let blocking = issues.filter { $0.kind == .content || $0.kind == .alias }
        let needsValues = issues.contains { $0.kind == .missing || $0.kind == .invalid }
        let keyboard = KeyboardObserver.shared.visible

        VStack(spacing: 0) {
            Header(title: id == nil ? "New Thought" : "Edit Thought", back: true) {
                if restored {
                    HeaderButton(label: "Discard", role: .accent, identifier: "discard") { discard() }
                }
            }
            LineField(
                placeholder: "Alias (empty keeps it a draft)", text: $edit.alias, identifier: "composer.alias",
                submit: .next, onSubmit: { contentFocused = true }
            )
            .focused($aliasFocused)
            .padding(.horizontal, metrics.px)
            .frame(height: 52)
            Hairline()
            DatasetStrip(selected: $edit.datasetIds)
            Hairline()
            ContentEditor(text: $edit.content, focused: $contentFocused, placeholder: "What is the thought?", metrics: metrics)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            if showIssues, !issues.isEmpty {
                IssueLines(issues: blocking.isEmpty ? issues : blocking)
            }
            BottomBar {
                if keyboard {
                    Button {
                        Haptics.tap()
                        contentFocused = false
                        aliasFocused = false
                        UIApplication.shared.hideKeyboard()
                    } label: {
                        Text("Hide").styled(.dim).frame(width: 72).frame(maxHeight: .infinity)
                    }
                    .buttonStyle(Press())
                    .accessibilityIdentifier("composer.hide")
                    VHairline()
                }
                Text("\(clean.content.count) chars").styled(.faint).padding(.horizontal, metrics.ch * 1.5)
                    .accessibilityIdentifier("composer.count")
                Spacer(minLength: 0)
                VHairline()
                BarButton(
                    label: needsValues && blocking.isEmpty ? "Next: Fields" : "Save",
                    key: "↵", primary: true, enabled: clean != original,
                    identifier: "composer.save"
                ) { save(clean, issues: issues) }
                .frame(width: 180)
            }
            .accessibilityElement(children: .contain)
            .accessibilityIdentifier("composer.toolbar")
        }
        .background(Theme.bg)
        .onAppear(perform: load)
        .onChange(of: edit) { _, next in
            guard loaded else { return }
            if next == original { app.unsaved[key] = nil } else { app.unsaved[key] = next }
        }
    }

    private func load() {
        guard !loaded else { return }
        let library = app.library
        if let id, let thought = library.thought(id) {
            original = thought.editable
        } else if let datasetId {
            original = ThoughtEdit(datasetIds: [datasetId])
        }
        if let saved = app.unsaved[key], saved != original {
            edit = saved
            restored = true
        } else {
            edit = original
        }
        loaded = true
        if id == nil { aliasFocused = true }
    }

    private func discard() {
        Haptics.tap()
        app.unsaved[key] = nil
        edit = original
        restored = false
    }

    private func save(_ clean: ThoughtEdit, issues: [Issue]) {
        let blocking = issues.filter { $0.kind == .content || $0.kind == .alias }
        if !blocking.isEmpty {
            showIssues = true
            Haptics.warning()
            return
        }
        if !issues.isEmpty {
            app.router.push(.values(id, edit: clean))
            return
        }
        let done: Bool
        if let id {
            done = app.perform(.editThought(id: id, edit: clean, author: .you, note: "edited", at: Clock.now()), done: "Saved.")
        } else {
            done = app.perform(.createThought(id: IDs.make(), edit: clean, author: .you, at: Clock.now()),
                               done: clean.cleanAlias == nil ? "Saved as a draft." : "Created.")
        }
        if done {
            Haptics.success()
            app.unsaved[key] = nil
            UIApplication.shared.hideKeyboard()
            app.router.pop()
        }
    }
}

/// Datasets as a row of chips: tagged ones first and bright, the rest grey. One tap toggles.
struct DatasetStrip: View {
    @Environment(AppModel.self) private var app
    @Environment(\.metrics) private var metrics
    @Binding var selected: [ID]

    var body: some View {
        let all = app.library.datasets
        let ordered = all.filter { selected.contains($0.id) } + all.filter { !selected.contains($0.id) }
        ScrollView(.horizontal) {
            HStack(spacing: metrics.ch) {
                Text("#").styled(.faint)
                ForEach(ordered) { dataset in
                    Chip(text: dataset.alias, on: selected.contains(dataset.id), identifier: "dataset.\(dataset.alias)") {
                        if selected.contains(dataset.id) {
                            selected.removeAll { $0 == dataset.id }
                        } else {
                            selected.append(dataset.id)
                        }
                    }
                }
            }
            .padding(.horizontal, metrics.px)
        }
        .scrollIndicators(.hidden)
        .frame(height: 52)
        .accessibilityIdentifier("composer.datasets")
    }
}

struct IssueLines: View {
    @Environment(\.metrics) private var metrics
    let issues: [Issue]

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            ForEach(issues, id: \.self) { issue in
                HStack(alignment: .firstTextBaseline, spacing: metrics.ch) {
                    Text("!").styled(.accent)
                    Text(issue.message).styled(.body).fixedSize(horizontal: false, vertical: true)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, metrics.px)
        .padding(.vertical, metrics.py)
        .background(Theme.raised)
        .accessibilityIdentifier("issues")
    }
}

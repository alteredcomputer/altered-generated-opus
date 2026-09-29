import AlteredCore
import SwiftUI

/// The attribute form: one entry per field of the thought's datasets. Choices and yes/no are
/// chips, so most values take one tap and no keyboard. Saving is refused until every required
/// field holds a valid value: default closed.
struct ValuesScreen: View {
    @Environment(AppModel.self) private var app
    @Environment(\.metrics) private var metrics
    let id: ID?
    @State private var edit: ThoughtEdit
    @FocusState private var focus: ID?

    init(id: ID?, edit: ThoughtEdit) {
        self.id = id
        _edit = State(initialValue: edit)
    }

    var body: some View {
        let library = app.library
        let fields = library.fields(for: edit.datasetIds)
        let issues = Validation.issues(for: Validation.normalized(edit, library: library), id: id, in: library)
        let open = issues.filter { $0.kind == .missing || $0.kind == .invalid }.count

        VStack(spacing: 0) {
            Header(title: "Fields", back: true)
            ScrollViewReader { proxy in
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        Heading(level: 1, text: edit.cleanAlias ?? "Draft", dim: edit.cleanAlias == nil)
                            .padding(.horizontal, metrics.px)
                            .padding(.vertical, metrics.py * 2)
                        Hairline()
                        ForEach(fields, id: \.field.id) { pair in
                            FieldEditor(
                                dataset: pair.dataset, field: pair.field,
                                value: binding(pair.field.id),
                                issue: issues.first { $0.fieldId == pair.field.id },
                                focus: $focus
                            )
                            .id(pair.field.id)
                            Hairline()
                        }
                        if fields.isEmpty {
                            EmptyNote(text: "This thought's datasets have no fields.")
                        }
                    }
                }
                .scrollDismissesKeyboard(.immediately)
                .onChange(of: focus) { _, field in
                    guard let field else { return }
                    withAnimation(nil) { proxy.scrollTo(field, anchor: .center) }
                }
            }
            BottomBar {
                if KeyboardObserver.shared.visible {
                    Button {
                        Haptics.tap()
                        focus = nil
                    } label: {
                        Text("Hide").styled(.dim).frame(width: 72).frame(maxHeight: .infinity)
                    }
                    .buttonStyle(Press())
                    .accessibilityIdentifier("values.hide")
                    VHairline()
                }
                Text(open == 0 ? "complete" : "\(open) to fill").styled(open == 0 ? .dim : .accent)
                    .padding(.horizontal, metrics.ch * 1.5)
                    .accessibilityIdentifier("values.status")
                Spacer(minLength: 0)
                VHairline()
                BarButton(label: "Save", key: "↵", primary: true, enabled: issues.isEmpty, identifier: "values.save") {
                    save()
                }
                .frame(width: 150)
            }
        }
        .background(Theme.bg)
    }

    private func binding(_ fieldId: ID) -> Binding<String> {
        Binding(
            get: { edit.values[fieldId] ?? "" },
            set: { edit.values[fieldId] = $0.isEmpty ? nil : $0 }
        )
    }

    private func save() {
        let clean = Validation.normalized(edit, library: app.library)
        let done: Bool
        if let id {
            done = app.perform(.editThought(id: id, edit: clean, author: .you, note: "edited", at: Clock.now()), done: "Saved.")
        } else {
            done = app.perform(.createThought(id: IDs.make(), edit: clean, author: .you, at: Clock.now()), done: "Created.")
        }
        guard done else { return }
        Haptics.success()
        focus = nil
        // Opened from the composer: close both, and forget the composer's unsaved copy.
        let path = app.router.paths[app.router.tab] ?? []
        if path.count >= 2, case .compose = path[path.count - 2] {
            app.unsaved[id ?? "new"] = nil
            app.router.pop(2)
        } else {
            app.router.pop()
        }
    }
}

struct FieldEditor: View {
    @Environment(\.metrics) private var metrics
    let dataset: Dataset
    let field: Field
    @Binding var value: String
    let issue: Issue?
    var focus: FocusState<ID?>.Binding

    var body: some View {
        VStack(alignment: .leading, spacing: metrics.ch) {
            HStack(alignment: .firstTextBaseline, spacing: 0) {
                Text("\(dataset.alias).").styled(.dim)
                Text(field.name).styled(.title)
                Spacer(minLength: metrics.ch)
                Text("\(field.type.rawValue)\(field.required ? "" : " · optional")").styled(.faint)
            }
            input
            if let issue {
                Text(issue.message).styled(.accent).fixedSize(horizontal: false, vertical: true)
                    .accessibilityIdentifier("issue.\(field.name)")
            } else if !field.description.isEmpty {
                Text(field.description).styled(.faint).fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(.horizontal, metrics.px)
        .padding(.vertical, metrics.py * 1.5)
        .accessibilityIdentifier("field.\(field.name)")
    }

    @ViewBuilder private var input: some View {
        switch field.type {
        case .choice:
            chips(field.options)
        case .toggle:
            chips(["yes", "no"])
        case .date:
            HStack(spacing: metrics.ch) {
                text(placeholder: "YYYY-MM-DD", keyboard: .numbersAndPunctuation)
                Chip(text: "today", identifier: "today.\(field.name)") { value = Self.today() }
            }
        case .number:
            text(placeholder: "0", keyboard: .decimalPad)
        case .link:
            text(placeholder: "https://", keyboard: .URL)
        case .text:
            text(placeholder: field.type.hint, keyboard: .default)
        }
    }

    private func chips(_ options: [String]) -> some View {
        FlowLayout(spacing: metrics.ch, lineSpacing: metrics.ch) {
            ForEach(options, id: \.self) { option in
                Chip(text: option, on: value == option, identifier: "option.\(field.name).\(option)") {
                    value = value == option ? "" : option
                }
            }
        }
    }

    private func text(placeholder: String, keyboard: UIKeyboardType) -> some View {
        LineField(
            placeholder: placeholder, text: $value, identifier: "input.\(field.name)", keyboard: keyboard,
            capitalization: keyboard == .default ? .sentences : .never, role: .title
        )
        .focused(focus, equals: field.id)
        .frame(minHeight: 36)
        .padding(.horizontal, metrics.ch)
        .background(Theme.raised)
    }

    static func today() -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: Date())
    }
}

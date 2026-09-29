import AlteredCore
import SwiftUI

/// A thought as a markdown document, in the Koa page's hierarchy: literal marks, grey body,
/// white headings. A sideways swipe steps to the next or previous thought in the list it came
/// from, the phone's arrow keys.
struct ThoughtScreen: View {
    @Environment(AppModel.self) private var app
    @Environment(\.metrics) private var metrics
    let id: ID
    let context: [ID]

    var body: some View {
        let position = context.firstIndex(of: id)
        VStack(spacing: 0) {
            Header(title: position.map { "\($0 + 1) / \(context.count)" } ?? "Thought", back: true) {
                SyncStatus()
                if let thought = app.library.thought(id) {
                    HeaderButton(label: "v\(thought.version)", role: .dim, identifier: "version") {
                        app.router.push(.history(id))
                    }
                }
            }
            if let thought = app.library.thought(id) {
                ScrollView {
                    ThoughtDocument(thought: thought)
                        .padding(.horizontal, metrics.px)
                        .padding(.vertical, metrics.py * 3)
                }
                .scrollBounceBehavior(.basedOnSize)
                .simultaneousGesture(stepGesture)
                .accessibilityIdentifier("thought.document")
                BottomBar {
                    BarButton(label: "Edit Thought", key: "↵", primary: true, identifier: "bar.edit") {
                        app.router.push(.compose(id))
                    }
                    VHairline()
                    BarButton(label: "Actions", key: "⋯", identifier: "bar.actions") {
                        app.panel = ThoughtActions.panel(thought, app: app, context: context, open: false)
                    }
                }
            } else {
                EmptyNote(text: "This thought no longer exists.")
                Spacer()
            }
        }
        .background(Theme.bg)
    }

    private var stepGesture: some Gesture {
        DragGesture(minimumDistance: 24)
            .onEnded { value in
                let dx = value.translation.width
                let dy = value.translation.height
                // Leave the left edge to the system's swipe back.
                guard abs(dx) > 70, abs(dx) > abs(dy) * 2, value.startLocation.x > 32 else { return }
                step(dx < 0 ? 1 : -1)
            }
    }

    private func step(_ offset: Int) {
        guard let index = context.firstIndex(of: id) else { return }
        let next = index + offset
        guard context.indices.contains(next) else {
            Haptics.warning()
            return
        }
        Haptics.tap()
        app.router.replaceTop(with: .thought(context[next], context: context))
    }
}

struct ThoughtDocument: View {
    @Environment(AppModel.self) private var app
    @Environment(\.metrics) private var metrics
    let thought: Thought

    var body: some View {
        let library = app.library
        let issues = Validation.issues(for: thought, in: library)
        VStack(alignment: .leading, spacing: metrics.size * 1.5) {
            Heading(level: 1, text: thought.isDraft ? "Draft" : thought.title, dim: thought.isDraft)
                .accessibilityIdentifier("thought.alias")
            Text(thought.content).styled(.body)
                .textSelection(.enabled)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
                .accessibilityIdentifier("thought.content")
            Rule()
            datasets(library)
            attributes(library, issues: issues)
            relations(library)
            proposals(library)
            Rule()
            meta
        }
    }

    @ViewBuilder private func datasets(_ library: Library) -> some View {
        Heading(level: 2, text: "Datasets")
        let sets = library.datasets(of: thought)
        if sets.isEmpty {
            Text("None").styled(.faint)
        } else {
            FlowLayout(spacing: metrics.ch, lineSpacing: metrics.ch) {
                ForEach(sets) { dataset in
                    Button {
                        Haptics.tap()
                        app.router.push(.dataset(dataset.id))
                    } label: {
                        Tag(dataset.alias)
                    }
                    .buttonStyle(Press())
                    .accessibilityIdentifier("tag.\(dataset.alias)")
                }
            }
        }
    }

    @ViewBuilder private func attributes(_ library: Library, issues: [Issue]) -> some View {
        Heading(level: 2, text: "Attributes")
        let fields = library.fields(for: thought.datasetIds)
        if fields.isEmpty {
            Text("None").styled(.faint)
        } else {
            Button {
                Haptics.tap()
                app.router.push(.values(thought.id, edit: thought.editable))
            } label: {
                VStack(alignment: .leading, spacing: metrics.ch * 0.6) {
                    ForEach(fields, id: \.field.id) { pair in
                        let value = thought.values[pair.field.id]
                        let issue = issues.first { $0.fieldId == pair.field.id }
                        KeyValue(
                            key: pair.field.name,
                            value: value ?? (issue != nil ? "missing" : "-"),
                            role: issue != nil ? .accent : (value == nil ? .faint : .title),
                            keyWidth: 10
                        )
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .buttonStyle(Press())
            .accessibilityIdentifier("thought.attributes")
        }
    }

    @ViewBuilder private func relations(_ library: Library) -> some View {
        if !thought.relations.isEmpty {
            Heading(level: 2, text: "Relations")
            VStack(alignment: .leading, spacing: metrics.ch * 0.6) {
                ForEach(thought.relations, id: \.to) { relation in
                    if let other = library.thought(relation.to) {
                        Pressable(action: {
                            app.router.push(.thought(other.id, context: []))
                        }, hold: {
                            app.panel = Panel(title: "\(relation.kind.label)  \(other.title)", actions: [
                                .init(id: "open", title: "Open") { app.router.push(.thought(other.id, context: [])) },
                                .init(id: "unlink", title: "Unlink", destructive: true) {
                                    app.perform(.unlink(from: thought.id, to: other.id), done: "Unlinked.")
                                }
                            ])
                        }) {
                            HStack(alignment: .firstTextBaseline, spacing: metrics.ch) {
                                Text(relation.kind.label).styled(.dim).frame(width: metrics.ch * 10, alignment: .leading)
                                Text(other.title).styled(.title).lineLimit(1)
                                Spacer(minLength: 0)
                            }
                            .frame(minHeight: 32)
                        }
                        .accessibilityIdentifier("relation.\(other.id)")
                    }
                }
            }
        }
    }

    @ViewBuilder private func proposals(_ library: Library) -> some View {
        let list = library.proposals(for: thought.id)
        if !list.isEmpty {
            Heading(level: 2, text: "Proposals")
            ForEach(list) { proposal in
                Pressable(action: { app.router.push(.proposal(proposal.id)) }) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("\(proposal.author.name) proposes").styled(.accent)
                        Text(proposal.rationale).styled(.body).fixedSize(horizontal: false, vertical: true)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                .accessibilityIdentifier("proposal.\(proposal.id)")
            }
        }
    }

    private var meta: some View {
        VStack(alignment: .leading, spacing: metrics.ch * 0.6) {
            KeyValue(key: "created", value: Format.stamp(thought.createdAt))
            KeyValue(key: "updated", value: Format.stamp(thought.updatedAt))
            KeyValue(key: "version", value: "v\(thought.version) by \(thought.lastAuthor.name)")
            KeyValue(
                key: "status",
                value: [
                    thought.validated ? "validated" : "unvalidated",
                    thought.locked ? "locked" : nil,
                    thought.pinned ? "pinned" : nil
                ].compactMap { $0 }.joined(separator: ", "),
                role: thought.validated ? .body : .accent
            )
        }
    }
}

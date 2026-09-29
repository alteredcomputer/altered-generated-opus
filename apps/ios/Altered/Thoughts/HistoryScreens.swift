import AlteredCore
import SwiftUI

/// Every revision of a thought, newest first, with who wrote it.
struct HistoryScreen: View {
    @Environment(AppModel.self) private var app
    @Environment(\.metrics) private var metrics
    let id: ID

    var body: some View {
        VStack(spacing: 0) {
            Header(title: "History", back: true)
            if let thought = app.library.thought(id) {
                let now = Date()
                List {
                    ForEach(Array(thought.revisions.enumerated().reversed()), id: \.offset) { index, revision in
                        Pressable(action: { app.router.push(.revision(id, version: index + 1)) }) {
                            HStack(alignment: .firstTextBaseline, spacing: metrics.ch) {
                                Text("v\(index + 1)").styled(.title).frame(width: metrics.ch * 4, alignment: .leading)
                                Text(revision.author.name).styled(revision.author.isHuman ? .body : .accent)
                                    .frame(width: metrics.ch * 6, alignment: .leading)
                                Text(revision.note).styled(.dim).lineLimit(1)
                                Spacer(minLength: metrics.ch)
                                Text(Format.age(revision.at, now: now)).styled(.faint)
                            }
                            .padding(.horizontal, metrics.px)
                            .padding(.vertical, metrics.py * 1.5)
                        }
                        .plainRow()
                        .accessibilityIdentifier("revision.\(index + 1)")
                    }
                }
                .plainList()
            } else {
                EmptyNote(text: "This thought no longer exists.")
                Spacer()
            }
        }
        .background(Theme.bg)
    }
}

/// One revision against the one before it, word by word, with a restore.
struct RevisionScreen: View {
    @Environment(AppModel.self) private var app
    @Environment(\.metrics) private var metrics
    let id: ID
    let version: Int

    var body: some View {
        VStack(spacing: 0) {
            Header(title: "v\(version)", back: true)
            if let thought = app.library.thought(id), thought.revisions.indices.contains(version - 1) {
                let revision = thought.revisions[version - 1]
                let previous = version > 1 ? thought.revisions[version - 2] : nil
                ScrollView {
                    VStack(alignment: .leading, spacing: metrics.size * 1.5) {
                        VStack(alignment: .leading, spacing: metrics.ch * 0.6) {
                            KeyValue(key: "author", value: revision.author.name, role: revision.author.isHuman ? .body : .accent)
                            KeyValue(key: "change", value: revision.note)
                            KeyValue(key: "saved", value: Format.stamp(revision.at))
                            KeyValue(key: "compared", value: previous == nil ? "first version" : "with v\(version - 1)")
                        }
                        Rule()
                        Heading(level: 2, text: "Alias")
                        DiffText(old: previous?.alias ?? "", new: revision.alias ?? "", empty: "(draft)")
                        Heading(level: 2, text: "Content")
                        DiffText(old: previous?.content ?? "", new: revision.content, empty: "")
                        Heading(level: 2, text: "Datasets")
                        DatasetChanges(old: previous?.datasetIds ?? [], new: revision.datasetIds)
                    }
                    .padding(.horizontal, metrics.px)
                    .padding(.vertical, metrics.py * 3)
                }
                BottomBar {
                    let latest = version == thought.revisions.count
                    BarButton(
                        label: latest ? "Current Version" : "Restore v\(version)", key: latest ? nil : "↵",
                        primary: !latest, enabled: !latest && !thought.locked, identifier: "bar.restore"
                    ) {
                        if app.perform(.restore(id: id, version: version, at: Clock.now()), done: "Restored v\(version) as v\(thought.version + 1).") {
                            Haptics.success()
                            app.router.pop(2)
                        }
                    }
                }
            } else {
                EmptyNote(text: "This version no longer exists.")
                Spacer()
            }
        }
        .background(Theme.bg)
    }
}

/// Words removed are struck through in grey, words added are bright and underlined in orange.
struct DiffText: View {
    let old: String
    let new: String
    var empty = ""

    var body: some View {
        if old == new {
            Text(new.isEmpty ? (empty.isEmpty ? "-" : empty) : new)
                .styled(.body)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
        } else {
            Text(Self.attributed(Diff.words(from: old, to: new)))
                .styled(.body)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
                .accessibilityIdentifier("diff")
        }
    }

    static func attributed(_ parts: [DiffPart]) -> AttributedString {
        var result = AttributedString()
        for part in parts {
            var run = AttributedString(part.text)
            switch part.kind {
            case .same:
                run.foregroundColor = Theme.body
            case .removed:
                run.foregroundColor = Theme.dim
                run.strikethroughStyle = .single
            case .added:
                run.foregroundColor = Theme.fg
                run.underlineStyle = .single
                run.underlineColor = UIColor(Theme.accent)
            }
            result += run
        }
        return result
    }
}

struct DatasetChanges: View {
    @Environment(AppModel.self) private var app
    @Environment(\.metrics) private var metrics
    let old: [ID]
    let new: [ID]

    var body: some View {
        let names = { (id: ID) in app.library.dataset(id)?.alias ?? "deleted" }
        let kept = new.filter { old.contains($0) }
        let added = new.filter { !old.contains($0) }
        let removed = old.filter { !new.contains($0) }
        if kept.isEmpty && added.isEmpty && removed.isEmpty {
            Text("None").styled(.faint)
        } else {
            FlowLayout(spacing: metrics.ch, lineSpacing: metrics.ch) {
                ForEach(kept, id: \.self) { Tag(names($0)) }
                ForEach(added, id: \.self) { Tag("+ \(names($0))", role: .title) }
                ForEach(removed, id: \.self) { Tag("- \(names($0))", role: .dim) }
            }
        }
    }
}

import AlteredCore
import SwiftUI

/// Two lines: the alias, then the content in grey. A draft shows its content first and says so.
/// Marks on the right are words, not icons: sync, ai, pin, lock, and "!" when incomplete.
struct ThoughtRow: View {
    @Environment(AppModel.self) private var app
    @Environment(\.metrics) private var metrics
    let thought: Thought

    var body: some View {
        let library = app.library
        let incomplete = !thought.isDraft
            && Validation.issues(for: thought, in: library).contains { $0.kind == .missing || $0.kind == .invalid }
        VStack(alignment: .leading, spacing: metrics.ch * 0.4) {
            HStack(alignment: .firstTextBaseline, spacing: metrics.ch) {
                Text(thought.title)
                    .styled(thought.isDraft ? .body : .title)
                    .lineLimit(1)
                Spacer(minLength: metrics.ch)
                marks(incomplete: incomplete)
            }
            Text(secondLine(library))
                .styled(.dim)
                .lineLimit(1)
        }
        .padding(.horizontal, metrics.px)
        .padding(.vertical, metrics.py)
        .frame(maxWidth: .infinity, alignment: .leading)
        .contentShape(Rectangle())
    }

    private func secondLine(_ library: Library) -> String {
        if thought.isDraft {
            let sets = library.datasets(of: thought).map { "#\($0.alias)" }.joined(separator: " ")
            return "draft" + (sets.isEmpty ? "" : "  \(sets)")
        }
        return thought.content
    }

    @ViewBuilder private func marks(incomplete: Bool) -> some View {
        HStack(spacing: metrics.ch) {
            if app.store.isPending(thought.id) { Spinner() }
            if incomplete { Text("!").styled(.accent) }
            if !app.library.proposals(for: thought.id).isEmpty { Text("koa").styled(.accent) }
            if !thought.validated { Text("ai").styled(.dim) }
            if thought.locked { Text("lock").styled(.faint) }
            if thought.pinned { Text("pin").styled(.faint) }
        }
        .fixedSize()
    }
}

/// Everything you can do to a thought, in one place, used by the panel, the swipe actions, and
/// the detail footer so they never disagree.
@MainActor
enum ThoughtActions {
    static func panel(_ thought: Thought, app: AppModel, context: [ID], open: Bool) -> Panel {
        let id = thought.id
        let library = app.library
        var actions: [Panel.Action] = []

        if open {
            actions.append(.init(id: "open", title: "Open", hint: "tap") {
                app.router.push(.thought(id, context: context))
            })
        }
        actions.append(.init(id: "edit", title: "Edit Thought", hint: "swipe right") {
            app.router.push(.compose(id))
        })
        if !library.fields(for: thought.datasetIds).isEmpty {
            actions.append(.init(id: "fields", title: "Edit Fields") {
                app.router.push(.values(id, edit: thought.editable))
            })
        }
        if let proposal = library.proposals(for: id).first {
            actions.append(.init(id: "proposal", title: "Review Koa's Proposal") {
                app.router.push(.proposal(proposal.id))
            })
        }
        actions.append(.init(id: "pin", title: thought.pinned ? "Unpin" : "Pin", hint: "swipe left") {
            app.perform(.setPinned(id: id, !thought.pinned))
        })
        actions.append(.init(id: "validate", title: thought.validated ? "Invalidate" : "Validate") {
            app.perform(.setValidated(id: id, !thought.validated), done: thought.validated ? "Invalidated." : "Validated.")
        })
        actions.append(.init(id: "lock", title: thought.locked ? "Unlock" : "Lock") {
            app.perform(.setLocked(id: id, !thought.locked), done: thought.locked ? "Unlocked." : "Locked.")
        })
        actions.append(.init(id: "link", title: "Link to Thought") {
            app.router.push(.link(id))
        })
        actions.append(.init(id: "history", title: "History", hint: "v\(thought.version)") {
            app.router.push(.history(id))
        })
        actions.append(.init(id: "copy", title: "Copy Content") {
            UIPasteboard.general.string = thought.content
            app.show("Copied.")
        })
        actions.append(.init(id: "delete", title: "Delete", destructive: true) {
            if app.perform(.deleteThought(id: id), done: "Deleted.") {
                if case let .thought(open, _)? = app.router.paths[app.router.tab]?.last, open == id {
                    app.router.pop()
                }
            }
        })
        return Panel(title: thought.title, actions: actions)
    }
}

import AlteredCore
import SwiftUI

/// What needs a human, in the order it matters: agent proposals, drafts without an alias,
/// thoughts missing required values, and agent-written changes nobody has validated.
struct ReviewQueue {
    let proposals: [Proposal]
    let drafts: [Thought]
    let incomplete: [Thought]
    let unvalidated: [Thought]

    init(_ library: Library) {
        proposals = library.proposals.sorted { $0.createdAt > $1.createdAt }
        let byUpdate = library.thoughts.sorted { $0.updatedAt > $1.updatedAt }
        drafts = byUpdate.filter(\.isDraft)
        incomplete = byUpdate.filter { thought in
            !thought.isDraft && Validation.issues(for: thought, in: library).contains { $0.kind == .missing || $0.kind == .invalid }
        }
        unvalidated = byUpdate.filter { !$0.validated }
    }

    var count: Int { proposals.count + drafts.count + incomplete.count + unvalidated.count }
}

/// Triage with the thumb: swipe right to accept or validate, swipe left to reject, tap to open.
struct ReviewScreen: View {
    @Environment(AppModel.self) private var app
    @Environment(\.metrics) private var metrics

    var body: some View {
        let library = app.library
        let queue = ReviewQueue(library)
        TabScaffold {
            Header(title: "Review") {
                SyncStatus()
                if app.agentRunning {
                    HStack(spacing: metrics.ch) {
                        Spinner()
                        Text("koa").styled(.accent)
                    }
                    .padding(.horizontal, metrics.ch * 1.5)
                } else {
                    HeaderButton(label: "Run Koa", role: .accent, identifier: "review.run") { app.runAgent() }
                }
            }
            List {
                section("Proposals", queue.proposals.count)
                ForEach(queue.proposals) { proposal in
                    proposalRow(proposal, library)
                }
                section("Drafts", queue.drafts.count)
                ForEach(queue.drafts) { thought in
                    thoughtRow(thought, ids: queue.drafts.map(\.id)) { app.router.push(.compose(thought.id)) }
                }
                section("Incomplete", queue.incomplete.count)
                ForEach(queue.incomplete) { thought in
                    thoughtRow(thought, ids: queue.incomplete.map(\.id)) {
                        app.router.push(.values(thought.id, edit: thought.editable))
                    }
                }
                section("Unvalidated", queue.unvalidated.count)
                ForEach(queue.unvalidated) { thought in
                    thoughtRow(thought, ids: queue.unvalidated.map(\.id)) {
                        app.router.push(.thought(thought.id, context: queue.unvalidated.map(\.id)))
                    }
                    .swipeActions(edge: .leading, allowsFullSwipe: true) {
                        Button("Validate") {
                            Haptics.success()
                            app.perform(.setValidated(id: thought.id, true), done: "Validated.")
                        }
                        .tint(Theme.accent)
                    }
                }
                if queue.count == 0 {
                    EmptyNote(text: "Nothing to review. Everything is named, complete, and validated.").plainRow()
                }
            }
            .plainList()
            .accessibilityIdentifier("list.review")
        }
    }

    @ViewBuilder private func section(_ title: String, _ count: Int) -> some View {
        if count > 0 {
            Heading(level: 2, text: "\(title) (\(count))")
                .padding(.horizontal, metrics.px)
                .padding(.top, metrics.py * 2.5)
                .padding(.bottom, metrics.py)
                .plainRow()
                .accessibilityIdentifier("section.\(title.lowercased())")
        }
    }

    private func proposalRow(_ proposal: Proposal, _ library: Library) -> some View {
        let thought = library.thought(proposal.thoughtId)
        return Pressable(action: { app.router.push(.proposal(proposal.id)) }) {
            VStack(alignment: .leading, spacing: metrics.ch * 0.4) {
                HStack(alignment: .firstTextBaseline, spacing: metrics.ch) {
                    Text(thought?.title ?? "Deleted thought").styled(.title).lineLimit(1)
                    Spacer(minLength: metrics.ch)
                    if app.store.isPending(proposal.id) { Spinner() }
                    Text(proposal.author.name).styled(.accent)
                }
                Text(proposal.rationale).styled(.dim).lineLimit(1)
            }
            .padding(.horizontal, metrics.px)
            .padding(.vertical, metrics.py)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .plainRow()
        .accessibilityIdentifier("proposalrow.\(proposal.id)")
        .swipeActions(edge: .leading, allowsFullSwipe: true) {
            Button("Accept") {
                Haptics.success()
                app.perform(.acceptProposal(id: proposal.id, at: Clock.now()), done: "Accepted.")
            }
            .tint(Theme.accent)
        }
        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
            Button("Reject") {
                Haptics.tap()
                app.perform(.rejectProposal(id: proposal.id), done: "Rejected.")
            }
            .tint(Theme.pressed)
        }
    }

    private func thoughtRow(_ thought: Thought, ids: [ID], open: @escaping () -> Void) -> some View {
        Pressable(action: open, hold: {
            app.panel = ThoughtActions.panel(thought, app: app, context: ids, open: true)
        }) {
            ThoughtRow(thought: thought)
        }
        .accessibilityIdentifier("row.\(thought.id)")
        .plainRow()
    }
}

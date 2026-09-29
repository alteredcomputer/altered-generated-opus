import AlteredCore
import SwiftUI

/// What an agent wants to change, as a diff, with accept and reject in the thumb zone.
/// Accepted changes land as agent-authored and unvalidated, so they stay visible for review.
struct ProposalScreen: View {
    @Environment(AppModel.self) private var app
    @Environment(\.metrics) private var metrics
    let id: ID

    var body: some View {
        VStack(spacing: 0) {
            Header(title: "Proposal", back: true)
            if let proposal = app.library.proposal(id), let thought = app.library.thought(proposal.thoughtId) {
                ScrollView {
                    VStack(alignment: .leading, spacing: metrics.size * 1.5) {
                        Heading(level: 1, text: thought.title, dim: thought.isDraft)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("\(proposal.author.name) proposes").styled(.accent)
                            Text(proposal.rationale).styled(.body).fixedSize(horizontal: false, vertical: true)
                        }
                        Rule()
                        if thought.alias != proposal.edit.cleanAlias {
                            Heading(level: 2, text: "Alias")
                            DiffText(old: thought.alias ?? "", new: proposal.edit.alias, empty: "(draft)")
                        }
                        if thought.content != proposal.edit.content {
                            Heading(level: 2, text: "Content")
                            DiffText(old: thought.content, new: proposal.edit.content)
                        }
                        if thought.datasetIds != proposal.edit.datasetIds {
                            Heading(level: 2, text: "Datasets")
                            DatasetChanges(old: thought.datasetIds, new: proposal.edit.datasetIds)
                        }
                        if thought.locked {
                            Text("This thought is locked. Unlock it to accept.").styled(.accent)
                        }
                    }
                    .padding(.horizontal, metrics.px)
                    .padding(.vertical, metrics.py * 3)
                }
                BottomBar {
                    BarButton(label: "Reject", identifier: "bar.reject") {
                        if app.perform(.rejectProposal(id: id), done: "Rejected.") { app.router.pop() }
                    }
                    VHairline()
                    BarButton(label: "Accept", key: "↵", primary: true, enabled: !thought.locked, identifier: "bar.accept") {
                        if app.perform(.acceptProposal(id: id, at: Clock.now()), done: "Accepted. Validate it when you have read it.") {
                            Haptics.success()
                            app.router.pop()
                        }
                    }
                }
            } else {
                EmptyNote(text: "This proposal was already handled.")
                Spacer()
            }
        }
        .background(Theme.bg)
    }
}

/// Picks the other end of a relation: the kind as chips, then a searchable list.
struct LinkScreen: View {
    @Environment(AppModel.self) private var app
    @Environment(\.metrics) private var metrics
    let id: ID
    @State private var kind: RelationKind = .similar
    @State private var query = ""
    @FocusState private var searching: Bool

    var body: some View {
        let candidates = Search.run(query, in: app.library).filter { $0.id != id }
        VStack(spacing: 0) {
            Header(title: "Link to...", back: true)
            ScrollView(.horizontal) {
                HStack(spacing: metrics.ch) {
                    ForEach(RelationKind.allCases, id: \.self) { option in
                        Chip(text: option.label, on: kind == option, identifier: "kind.\(option.rawValue)") { kind = option }
                    }
                }
                .padding(.horizontal, metrics.px)
            }
            .scrollIndicators(.hidden)
            .frame(height: 52)
            Hairline()
            List {
                ForEach(candidates) { thought in
                    Pressable(action: { link(thought) }) {
                        ThoughtRow(thought: thought)
                    }
                    .accessibilityIdentifier("row.\(thought.id)")
                    .plainRow()
                }
            }
            .plainList()
            SearchBar(query: $query, focused: $searching, count: candidates.count, placeholder: "Find a thought...")
        }
        .background(Theme.bg)
    }

    private func link(_ other: Thought) {
        guard let thought = app.library.thought(id) else { return }
        if app.perform(.link(from: id, kind: kind, to: other.id), done: "Linked: \(other.title) is \(kind.phrase) \(thought.title).") {
            app.router.pop()
        }
    }
}

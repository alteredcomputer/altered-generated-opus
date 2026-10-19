import SwiftData
import SwiftUI

/// A Notes-style row: title, then the sort date and the next line, then the datasets. It reads
/// only precomputed fields, so scrolling never parses content or walks relationships.
struct ThoughtRow: View {
    let thought: Thought
    let sort: ThoughtSort

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(thought.title.isEmpty ? "New Thought" : thought.title)
                .font(.headline)
                .foregroundStyle(thought.title.isEmpty ? .secondary : .primary)
                .lineLimit(1)
            HStack(spacing: 6) {
                Text(RowDate.string(sort.date(of: thought)))
                    .foregroundStyle(.primary)
                Text(thought.snippet.isEmpty ? "No additional text" : thought.snippet)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
            .font(.subheadline)
            if !thought.datasetLine.isEmpty {
                Label(thought.datasetLine, systemImage: "square.stack")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
        }
        .padding(.vertical, 6)
        .frame(minHeight: 52)
        .accessibilityElement(children: .combine)
    }
}

/// The long-press preview: the whole thought, as it reads in the editor.
struct ThoughtPreview: View {
    let thought: Thought

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            if let alias = thought.alias {
                Text(alias).font(.headline)
            }
            Text(thought.content.isEmpty ? "No text" : thought.content)
                .font(.body)
                .foregroundStyle(thought.content.isEmpty ? .secondary : .primary)
            if !thought.datasetLine.isEmpty {
                Label(thought.datasetLine, systemImage: "square.stack")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(20)
        .frame(width: 340, alignment: .leading)
    }
}

/// A checkmark menu of datasets for one thought or a selection. A checkmark means every target
/// is in that dataset; choosing it adds them all, or removes them all when already checked.
struct DatasetsMenu: View {
    let datasets: [Dataset]
    let targets: [Thought]
    @Environment(Store.self) private var store
    @Environment(\.undoManager) private var undoManager

    var body: some View {
        Menu {
            ForEach(datasets) { dataset in
                Toggle(dataset.alias, isOn: binding(dataset))
            }
        } label: {
            Label("Datasets", systemImage: "square.stack")
        }
    }

    private func binding(_ dataset: Dataset) -> Binding<Bool> {
        Binding(
            get: { !targets.isEmpty && targets.allSatisfy { $0.datasetIDs.contains(dataset.id) } },
            set: { _ in store.toggle(dataset, for: targets, undo: undoManager) }
        )
    }
}

/// The sheet behind the Datasets swipe action: tap a dataset to add or remove the thought.
struct DatasetPicker: View {
    let thoughtIDs: [UUID]
    @Environment(Store.self) private var store
    @Environment(\.undoManager) private var undoManager
    @Environment(\.dismiss) private var dismiss
    @Query(sort: \Dataset.alias) private var datasets: [Dataset]

    var body: some View {
        let targets = store.thoughts(ids: thoughtIDs)
        NavigationStack {
            List(datasets) { dataset in
                let member = !targets.isEmpty && targets.allSatisfy { $0.datasetIDs.contains(dataset.id) }
                Button {
                    store.toggle(dataset, for: targets, undo: undoManager)
                } label: {
                    HStack {
                        Text(dataset.alias).foregroundStyle(.primary)
                        Spacer()
                        if member {
                            Image(systemName: "checkmark").foregroundStyle(.tint)
                        }
                    }
                    .contentShape(Rectangle())
                }
                .accessibilityAddTraits(member ? .isSelected : [])
            }
            .overlay {
                if datasets.isEmpty {
                    ContentUnavailableView("No Datasets", systemImage: "square.stack")
                }
            }
            .navigationTitle("Datasets")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                        .keyboardShortcut(.escape, modifiers: [])
                }
            }
        }
        .presentationDetents([.medium, .large])
    }
}

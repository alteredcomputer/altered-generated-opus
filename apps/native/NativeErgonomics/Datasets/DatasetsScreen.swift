import SwiftData
import SwiftUI

/// Every dataset with its thought count. Tap for its thoughts; swipe or long-press to rename or
/// delete; the bottom bar makes a new one.
struct DatasetsScreen: View {
    @Binding var path: [Route]

    @Environment(Store.self) private var store
    @Query(sort: \Dataset.alias) private var datasets: [Dataset]

    @State private var naming: Naming?
    @State private var name = ""
    @State private var problem: String?
    @State private var deleting: Dataset?

    /// What the name alert is for: a new dataset, or renaming one.
    private enum Naming: Identifiable {
        case create
        case rename(Dataset)

        var id: String {
            switch self {
            case .create: "create"
            case .rename(let dataset): dataset.id.uuidString
            }
        }
    }

    var body: some View {
        List {
            ForEach(datasets) { dataset in
                NavigationLink(value: Route.dataset(dataset.id)) {
                    DatasetRow(dataset: dataset)
                }
                .swipeActions(edge: .trailing) {
                    Button(role: .destructive) { deleting = dataset } label: {
                        Label("Delete", systemImage: "trash")
                    }
                    Button { startNaming(.rename(dataset)) } label: {
                        Label("Rename", systemImage: "pencil")
                    }
                    .tint(.gray)
                }
                .contextMenu {
                    Button("Rename", systemImage: "pencil") { startNaming(.rename(dataset)) }
                    Divider()
                    Button("Delete", systemImage: "trash", role: .destructive) { deleting = dataset }
                }
            }
        }
        .listStyle(.plain)
        .overlay {
            if datasets.isEmpty {
                ContentUnavailableView(
                    "No Datasets", systemImage: "square.stack",
                    description: Text("A dataset groups thoughts, like a tag.")
                )
            }
        }
        .navigationTitle("Datasets")
        .toolbar {
            ToolbarSpacer(.flexible, placement: .bottomBar)
            ToolbarItem(placement: .bottomBar) {
                Button("New Dataset", systemImage: "plus") { startNaming(.create) }
                    .keyboardShortcut("n", modifiers: .command)
                    .disabled(!path.isEmpty)
            }
        }
        .alert(naming.map(alertTitle) ?? "", isPresented: namingShown, presenting: naming) { naming in
            TextField("Name", text: $name)
                .textInputAutocapitalization(.never)
            Button("Cancel", role: .cancel) {}
            Button("Save") { finish(naming) }
        }
        .alert("Could not save", isPresented: problemShown) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(problem ?? "")
        }
        .confirmationDialog(
            deleting.map { "Delete \($0.alias)?" } ?? "",
            isPresented: deletingShown, titleVisibility: .visible, presenting: deleting
        ) { dataset in
            Button("Delete Dataset", role: .destructive) { store.deleteDataset(dataset) }
        } message: { dataset in
            Text(deleteMessage(dataset))
        }
        .undoBanner()
    }

    private func alertTitle(_ naming: Naming) -> String {
        switch naming {
        case .create: "New Dataset"
        case .rename: "Rename Dataset"
        }
    }

    private func deleteMessage(_ dataset: Dataset) -> String {
        let count = dataset.thoughts.count
        let thoughts = count == 1 ? "Its 1 thought stays" : "Its \(count) thoughts stay"
        return "\(thoughts), outside this dataset. Its field values stay as plain attributes."
    }

    private func startNaming(_ naming: Naming) {
        if case .rename(let dataset) = naming { name = dataset.alias } else { name = "" }
        self.naming = naming
    }

    private func finish(_ naming: Naming) {
        do {
            switch naming {
            case .create: try store.createDataset(alias: name)
            case .rename(let dataset): try store.rename(dataset, to: name)
            }
        } catch {
            problem = error.message
        }
    }

    private var namingShown: Binding<Bool> {
        Binding(get: { naming != nil }, set: { if !$0 { naming = nil } })
    }

    private var problemShown: Binding<Bool> {
        Binding(get: { problem != nil }, set: { if !$0 { problem = nil } })
    }

    private var deletingShown: Binding<Bool> {
        Binding(get: { deleting != nil }, set: { if !$0 { deleting = nil } })
    }
}

private struct DatasetRow: View {
    let dataset: Dataset

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 3) {
                Text(dataset.alias).font(.headline)
                if !dataset.summary.isEmpty {
                    Text(dataset.summary)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            }
            Spacer()
            Text(dataset.thoughts.count, format: .number)
                .font(.subheadline.monospacedDigit())
                .foregroundStyle(.secondary)
                .accessibilityLabel("\(dataset.thoughts.count) thoughts")
        }
        .padding(.vertical, 6)
        .frame(minHeight: 52)
    }
}

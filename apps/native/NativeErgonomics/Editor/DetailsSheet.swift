import SwiftData
import SwiftUI

/// Alias, datasets, and attributes in a half-height sheet. Each member dataset's fields come
/// first, then free attributes. Done validates like the web model and keeps the sheet open with
/// the problem shown when something is wrong.
struct DetailsSheet: View {
    let thought: Thought

    @Environment(Store.self) private var store
    @Environment(\.dismiss) private var dismiss
    @Query(sort: \Dataset.alias) private var datasets: [Dataset]

    @State private var alias: String
    @State private var members: Set<UUID>
    @State private var attributes: [ThoughtAttribute]
    @State private var problem: String?

    init(thought: Thought) {
        self.thought = thought
        _alias = State(initialValue: thought.alias ?? "")
        _members = State(initialValue: thought.datasetIDs)
        _attributes = State(initialValue: thought.attributes)
    }

    var body: some View {
        NavigationStack {
            Form {
                if let problem {
                    Section {
                        Label(problem, systemImage: "exclamationmark.triangle")
                            .foregroundStyle(.red)
                    }
                }
                Section {
                    TextField("Optional title", text: $alias)
                        .accessibilityLabel("Alias")
                } header: {
                    Text("Alias")
                } footer: {
                    Text("Shown as the title instead of the first line.")
                }
                Section("Datasets") {
                    ForEach(datasets) { dataset in
                        Toggle(dataset.alias, isOn: membership(dataset))
                    }
                }
                ForEach(datasets.filter { members.contains($0.id) && !$0.schemas.isEmpty }) { dataset in
                    Section(dataset.alias) {
                        ForEach(dataset.orderedSchemas) { schema in
                            LabeledContent(schema.name) {
                                TextField(schema.name, text: value(of: schema))
                                    .multilineTextAlignment(.trailing)
                            }
                        }
                    }
                }
                Section("Attributes") {
                    ForEach(attributes.filter(isFree)) { attribute in
                        HStack {
                            TextField("Name", text: field(attribute.id, \.name))
                            Divider()
                            TextField("Value", text: field(attribute.id, \.value))
                        }
                    }
                    .onDelete(perform: deleteFree)
                    Button("Add Attribute", systemImage: "plus") {
                        attributes.append(ThoughtAttribute(name: "", value: ""))
                    }
                }
                Section {
                    LabeledContent("Created", value: thought.createdAt.formatted(date: .abbreviated, time: .shortened))
                    LabeledContent("Modified", value: thought.updatedAt.formatted(date: .abbreviated, time: .shortened))
                    LabeledContent("Added", value: thought.addedAt.formatted(date: .abbreviated, time: .shortened))
                }
            }
            .navigationTitle("Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel", role: .cancel) { dismiss() }
                        .keyboardShortcut(.escape, modifiers: [])
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done", action: save)
                        .keyboardShortcut(.return, modifiers: .command)
                }
            }
        }
        .presentationDetents([.medium, .large])
        .interactiveDismissDisabled(dirty)
    }

    // MARK: - Draft

    private var dirty: Bool {
        alias != (thought.alias ?? "") || members != thought.datasetIDs || attributes != thought.attributes
    }

    /// A free attribute has no field, or its field's dataset is not checked (it would detach).
    private func isFree(_ attribute: ThoughtAttribute) -> Bool {
        guard let schemaId = attribute.schemaId else { return true }
        return !datasets.contains { members.contains($0.id) && $0.schemas.contains { $0.id == schemaId } }
    }

    private func membership(_ dataset: Dataset) -> Binding<Bool> {
        Binding(
            get: { members.contains(dataset.id) },
            set: { on in
                if on { members.insert(dataset.id) } else { members.remove(dataset.id) }
            }
        )
    }

    /// A field's value, creating its attribute on first edit.
    private func value(of schema: FieldSchema) -> Binding<String> {
        Binding(
            get: { attributes.first { $0.schemaId == schema.id }?.value ?? "" },
            set: { newValue in
                if let index = attributes.firstIndex(where: { $0.schemaId == schema.id }) {
                    attributes[index].value = newValue
                } else {
                    attributes.append(ThoughtAttribute(name: schema.name, value: newValue, schemaId: schema.id))
                }
            }
        )
    }

    private func field(_ id: UUID, _ keyPath: WritableKeyPath<ThoughtAttribute, String>) -> Binding<String> {
        Binding(
            get: { attributes.first { $0.id == id }?[keyPath: keyPath] ?? "" },
            set: { newValue in
                guard let index = attributes.firstIndex(where: { $0.id == id }) else { return }
                attributes[index][keyPath: keyPath] = newValue
            }
        )
    }

    private func deleteFree(at offsets: IndexSet) {
        let free = attributes.filter(isFree)
        let ids = Set(offsets.map { free[$0].id })
        attributes.removeAll { ids.contains($0.id) }
    }

    private func save() {
        do {
            try store.saveDetails(thought, alias: alias, datasetIds: members, attributes: attributes)
            dismiss()
        } catch {
            problem = error.message
        }
    }
}

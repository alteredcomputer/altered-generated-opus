import SwiftUI

/// A single-line input in the house style: no box, just text on the background.
struct LineField: View {
    @Environment(\.metrics) private var metrics
    let placeholder: String
    @Binding var text: String
    var identifier: String
    var keyboard: UIKeyboardType = .default
    var capitalization: TextInputAutocapitalization = .sentences
    var role: Role = .title
    var submit: SubmitLabel = .done
    var onSubmit: () -> Void = {}

    var body: some View {
        TextField("", text: $text, prompt: Text(placeholder).foregroundStyle(Theme.faint))
            .textFieldStyle(.plain)
            .font(metrics.font(role.bold))
            .foregroundStyle(role.color)
            .tint(Theme.accent)
            .keyboardType(keyboard)
            .textInputAutocapitalization(capitalization)
            .autocorrectionDisabled(keyboard != .default)
            .submitLabel(submit)
            .onSubmit(onSubmit)
            .accessibilityIdentifier(identifier)
    }
}

import SwiftUI

/// The palette from the Koa page and the desktop editor: #101010, one orange accent, greys for
/// hierarchy. Status colours exist only where they carry meaning.
enum Theme {
    static let bg = Color(hex: 0x101010)
    static let raised = Color(hex: 0x1A1A1A)
    static let pressed = Color(hex: 0x232323)
    static let line = Color(hex: 0x252525)
    static let tag = Color(hex: 0x222222)
    static let fg = Color(hex: 0xEDEDED)
    static let body = Color(hex: 0xA8A8A8)
    static let dim = Color(hex: 0x6F6F6F)
    static let faint = Color(hex: 0x444444)
    static let accent = Color(hex: 0xFF8000)
    static let danger = Color(hex: 0xFF5A4E)
}

extension Color {
    init(hex: UInt32) {
        self.init(
            red: Double((hex >> 16) & 0xFF) / 255, green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255
        )
    }
}

/// Type and spacing, all derived from one text size so the whole app scales together.
/// Geist Mono's advance is 0.6 em, so one `ch` is 0.6 of the size; rows are 1ch by 3ch.
struct Metrics: Equatable {
    var size: CGFloat = 13

    var ch: CGFloat { (size * 0.6).rounded(.toNearestOrAwayFromZero) }
    var px: CGFloat { ch * 3 }
    var py: CGFloat { ch }
    /// Line height 1.5, expressed as the gap SwiftUI adds between lines.
    var leading: CGFloat { size * 0.5 }
    var bar: CGFloat { max(48, size * 3.4) }

    func font(_ bold: Bool = false, scale: CGFloat = 1) -> Font {
        .custom(bold ? "GeistMono-SemiBold" : "GeistMono-Regular", fixedSize: (size * scale).rounded())
    }

    func uiFont(_ bold: Bool = false) -> UIFont {
        UIFont(name: bold ? "GeistMono-SemiBold" : "GeistMono-Regular", size: size)
            ?? .monospacedSystemFont(ofSize: size, weight: bold ? .semibold : .regular)
    }
}

private struct MetricsKey: EnvironmentKey {
    static let defaultValue = Metrics()
}

extension EnvironmentValues {
    var metrics: Metrics {
        get { self[MetricsKey.self] }
        set { self[MetricsKey.self] = newValue }
    }
}

/// Text roles, so every screen uses the same handful of styles.
enum Role {
    case title, body, dim, faint, accent, danger, strong

    var color: Color {
        switch self {
        case .title, .strong: Theme.fg
        case .body: Theme.body
        case .dim: Theme.dim
        case .faint: Theme.faint
        case .accent: Theme.accent
        case .danger: Theme.danger
        }
    }

    var bold: Bool { self == .title || self == .strong }
}

private struct Styled: ViewModifier {
    @Environment(\.metrics) private var metrics
    let role: Role
    let scale: CGFloat

    func body(content: Content) -> some View {
        content
            .font(metrics.font(role.bold, scale: scale))
            .foregroundStyle(role.color)
            .lineSpacing(metrics.leading)
    }
}

extension View {
    func styled(_ role: Role, scale: CGFloat = 1) -> some View {
        modifier(Styled(role: role, scale: scale))
    }
}

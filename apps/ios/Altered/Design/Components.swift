import SwiftUI

struct Hairline: View {
    var body: some View { Rectangle().fill(Theme.line).frame(height: 1) }
}

struct VHairline: View {
    var body: some View { Rectangle().fill(Theme.line).frame(width: 1) }
}

/// A terminal spinner. Shown only while something is actually waiting on the network.
struct Spinner: View {
    var role: Role = .accent
    private static let frames = ["|", "/", "-", "\\"]

    var body: some View {
        TimelineView(.periodic(from: .now, by: 0.12)) { context in
            let index = Int(context.date.timeIntervalSinceReferenceDate / 0.12) % Self.frames.count
            Text(Self.frames[index]).styled(role)
        }
        .accessibilityLabel("syncing")
        .accessibilityIdentifier("spinner")
    }
}

/// A key cap, as in the desktop footer: a small bordered box.
struct Kbd: View {
    @Environment(\.metrics) private var metrics
    let key: String

    init(_ key: String) {
        self.key = key
    }

    var body: some View {
        Text(key)
            .styled(.dim, scale: 0.85)
            .padding(.horizontal, metrics.ch * 0.6)
            .padding(.vertical, 1)
            .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))
    }
}

struct Tag: View {
    @Environment(\.metrics) private var metrics
    let text: String
    var role: Role = .body

    init(_ text: String, role: Role = .body) {
        self.text = text
        self.role = role
    }

    var body: some View {
        Text(text)
            .styled(role)
            .lineLimit(1)
            .padding(.horizontal, metrics.ch * 0.6)
            .padding(.vertical, 2)
            .background(Theme.tag)
    }
}

/// A selectable chip for choices, datasets, and query tokens.
struct Chip: View {
    @Environment(\.metrics) private var metrics
    let text: String
    var on = false
    var identifier: String?
    let action: () -> Void

    var body: some View {
        Button {
            Haptics.tap()
            action()
        } label: {
            Text(text)
                .styled(on ? .strong : .dim)
                .lineLimit(1)
                .padding(.horizontal, metrics.ch)
                .frame(minHeight: 34)
                .background(on ? Theme.pressed : Theme.raised)
                .overlay(Rectangle().stroke(on ? Theme.faint : Color.clear, lineWidth: 1))
        }
        .buttonStyle(Press(fill: Theme.line))
        .accessibilityIdentifier(identifier ?? "chip.\(text)")
        .accessibilityAddTraits(on ? .isSelected : [])
    }
}

/// The top bar of every screen: back, title, and one trailing slot. No system chrome.
struct Header<Trailing: View>: View {
    @Environment(\.metrics) private var metrics
    @Environment(AppModel.self) private var app
    let title: String
    var back = false
    @ViewBuilder var trailing: () -> Trailing

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 0) {
                if back {
                    Button {
                        Haptics.tap()
                        app.router.pop()
                    } label: {
                        Text("←").styled(.dim)
                            .frame(width: metrics.px + metrics.ch * 2, height: 44, alignment: .center)
                    }
                    .buttonStyle(Press())
                    .accessibilityIdentifier("back")
                    .accessibilityLabel("Back")
                } else {
                    Color.clear.frame(width: metrics.px, height: 44)
                }
                Text(title).styled(.strong).lineLimit(1)
                    .accessibilityIdentifier("header.title")
                Spacer(minLength: metrics.ch)
                trailing()
            }
            .frame(height: 48)
            Hairline()
        }
        .background(Theme.bg)
    }
}

extension Header where Trailing == EmptyView {
    init(title: String, back: Bool = false) {
        self.init(title: title, back: back) { EmptyView() }
    }
}

/// A plain text button for the header's trailing slot.
struct HeaderButton: View {
    @Environment(\.metrics) private var metrics
    let label: String
    var role: Role = .body
    var identifier: String?
    let action: () -> Void

    var body: some View {
        Button {
            Haptics.tap()
            action()
        } label: {
            Text(label).styled(role).lineLimit(1)
                .padding(.horizontal, metrics.ch * 1.5)
                .frame(minHeight: 44)
        }
        .buttonStyle(Press())
        .accessibilityIdentifier(identifier ?? "header.\(label)")
    }
}

/// The footer of a detail or form: one or two big targets in the thumb zone.
struct BottomBar<Content: View>: View {
    @Environment(\.metrics) private var metrics
    @ViewBuilder var content: () -> Content

    var body: some View {
        VStack(spacing: 0) {
            Hairline()
            HStack(spacing: 0) { content() }
                .frame(height: metrics.bar)
        }
        .background(Theme.bg)
    }
}

/// A footer target with an optional key cap, like "Edit Thought ↵".
struct BarButton: View {
    @Environment(\.metrics) private var metrics
    let label: String
    var key: String?
    var primary = false
    var enabled = true
    var identifier: String?
    let action: () -> Void

    var body: some View {
        Button {
            if enabled {
                Haptics.tap()
                action()
            } else {
                Haptics.warning()
            }
        } label: {
            HStack(spacing: metrics.ch) {
                Text(label).styled(enabled ? (primary ? .strong : .body) : .faint).lineLimit(1)
                if let key { Kbd(key) }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .buttonStyle(Press())
        .accessibilityIdentifier(identifier ?? "bar.\(label)")
    }
}

/// "# Title" and "## Section", with the marks left in, as on the Koa page.
struct Heading: View {
    @Environment(\.metrics) private var metrics
    let level: Int
    let text: String
    var dim = false

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: metrics.ch) {
            Text(String(repeating: "#", count: level)).styled(.faint, scale: level == 1 ? 1.15 : 1)
                .accessibilityHidden(true)
            Text(text).styled(dim ? .dim : .strong, scale: level == 1 ? 1.15 : 1)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .combine)
        .accessibilityAddTraits(.isHeader)
    }
}

/// The literal "---" divider.
struct Rule: View {
    var body: some View {
        Text("---").styled(.faint).frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// "created  Sep 6, 2026, 01:26 AM": a dim key column and a value.
struct KeyValue: View {
    @Environment(\.metrics) private var metrics
    let key: String
    let value: String
    var role: Role = .body
    var keyWidth: CGFloat = 9

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: metrics.ch) {
            Text(key).styled(.dim).frame(width: metrics.ch * keyWidth, alignment: .leading)
            Text(value).styled(role).fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
        }
    }
}

/// Wraps children onto new lines, for tags and chips.
struct FlowLayout: Layout {
    var spacing: CGFloat = 8
    var lineSpacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? .infinity
        var x: CGFloat = 0
        var y: CGFloat = 0
        var line: CGFloat = 0
        var widest: CGFloat = 0
        for view in subviews {
            let size = view.sizeThatFits(.unspecified)
            if x > 0, x + size.width > width {
                y += line + lineSpacing
                x = 0
                line = 0
            }
            x += size.width + spacing
            line = max(line, size.height)
            widest = max(widest, x - spacing)
        }
        return CGSize(width: proposal.width ?? widest, height: y + line)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX
        var y = bounds.minY
        var line: CGFloat = 0
        for view in subviews {
            let size = view.sizeThatFits(.unspecified)
            if x > bounds.minX, x + size.width > bounds.maxX {
                y += line + lineSpacing
                x = bounds.minX
                line = 0
            }
            view.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
            x += size.width + spacing
            line = max(line, size.height)
        }
    }
}

/// A quiet line for empty states.
struct EmptyNote: View {
    @Environment(\.metrics) private var metrics
    let text: String

    var body: some View {
        Text(text).styled(.dim)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, metrics.px)
            .padding(.vertical, metrics.py * 2)
            .accessibilityIdentifier("empty")
    }
}

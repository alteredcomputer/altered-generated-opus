import SwiftUI
import UIKit

/// Haptics are the only motion the app keeps, so they are consistent: a light tick on every
/// action, a firmer one for commits, a warning for refusals.
@MainActor
enum Haptics {
    static var enabled = true

    private static let light = UIImpactFeedbackGenerator(style: .light)
    private static let rigid = UIImpactFeedbackGenerator(style: .rigid)
    private static let notice = UINotificationFeedbackGenerator()

    static func tap() {
        guard enabled else { return }
        light.impactOccurred()
    }

    static func hold() {
        guard enabled else { return }
        rigid.impactOccurred()
    }

    static func success() {
        guard enabled else { return }
        notice.notificationOccurred(.success)
    }

    static func warning() {
        guard enabled else { return }
        notice.notificationOccurred(.warning)
    }
}

/// Flat press: the background steps up while a finger is down, with no animation. Dragging off
/// the control cancels, as with any system button.
struct Press: ButtonStyle {
    var fill: Color = Theme.pressed
    var base: Color = .clear

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .contentShape(Rectangle())
            .background(configuration.isPressed ? fill : base)
    }
}

/// A row or tile that answers both a tap and a hold. The hold opens the action panel, the
/// thumb's equivalent of Cmd-K, and swallows the tap that would otherwise follow it.
struct Pressable<Label: View>: View {
    var base: Color = .clear
    let action: () -> Void
    var hold: (() -> Void)?
    @ViewBuilder let label: () -> Label

    @State private var held = false

    var body: some View {
        Button {
            if held {
                held = false
                return
            }
            Haptics.tap()
            action()
        } label: {
            label()
        }
        .buttonStyle(Press(base: base))
        .simultaneousGesture(
            LongPressGesture(minimumDuration: 0.35).onEnded { _ in
                guard let hold else { return }
                held = true
                Haptics.hold()
                hold()
                // If no tap follows the hold (the finger slid off), stop swallowing taps.
                Task {
                    try? await Task.sleep(for: .seconds(1))
                    held = false
                }
            },
            isEnabled: hold != nil
        )
    }
}

import SwiftUI
import UIKit

/// Where the keyboard is, straight from UIKit's notifications.
///
/// Most screens let SwiftUI's own keyboard avoidance move their bottom bar, which follows the
/// keyboard frame for frame. The tab roots cannot: their tab bar must stay put under the
/// keyboard while the search bar rides on top of it. They ignore the keyboard safe area and use
/// `overlap` from here instead, animated with a spring that matches the keyboard's own curve.
@MainActor
@Observable
final class KeyboardObserver {
    static let shared = KeyboardObserver()

    /// How far the keyboard reaches up from the bottom of the screen, in points.
    private(set) var overlap: CGFloat = 0
    var visible: Bool { overlap > 0 }

    /// UIKit's keyboard curve (7) is a critically damped spring; this is the usual match for it.
    static let animation = Animation.interpolatingSpring(mass: 3, stiffness: 1000, damping: 500)

    private var observers: [NSObjectProtocol] = []

    private init() {
        let center = NotificationCenter.default
        observers.append(center.addObserver(
            forName: UIResponder.keyboardWillChangeFrameNotification, object: nil, queue: .main
        ) { note in
            let end = (note.userInfo?[UIResponder.keyboardFrameEndUserInfoKey] as? NSValue)?.cgRectValue
            MainActor.assumeIsolated { KeyboardObserver.shared.update(end) }
        })
        observers.append(center.addObserver(
            forName: UIResponder.keyboardWillHideNotification, object: nil, queue: .main
        ) { _ in
            MainActor.assumeIsolated { KeyboardObserver.shared.update(nil) }
        })
    }

    private func update(_ end: CGRect?) {
        let screen = UIApplication.shared.connectedScenes
            .compactMap { ($0 as? UIWindowScene)?.screen.bounds.height }
            .first ?? 0
        let next = end.map { max(0, screen - $0.minY) } ?? 0
        guard next != overlap else { return }
        withAnimation(Self.animation) { overlap = next }
    }

    /// The lift for a bar sitting `below` points above the screen's bottom edge.
    static func lift(overlap: CGFloat, below: CGFloat) -> CGFloat {
        max(0, overlap - below)
    }
}

extension UIApplication {
    /// Ends editing anywhere, for the explicit "hide keyboard" controls.
    func hideKeyboard() {
        sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
    }
}

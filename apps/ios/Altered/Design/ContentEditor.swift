import SwiftUI
import UIKit

/// The multi-line editor, a UITextView rather than SwiftUI's TextEditor, for three reasons:
///
/// 1. It fills the space it is given and scrolls itself, so there is never a text view nested in
///    a scroll view, which is where caret-following usually breaks.
/// 2. When the keyboard shrinks it, it scrolls the caret back into view on the same layout pass,
///    so the line being typed is never hidden behind the keyboard or the toolbar.
/// 3. Line height, insets, and smart punctuation are set exactly (no em dashes, per the copy
///    rules; smart dashes are off).
struct ContentEditor: UIViewRepresentable {
    @Binding var text: String
    @Binding var focused: Bool
    var placeholder: String
    var metrics: Metrics
    var identifier = "editor.content"

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    func makeUIView(context: Context) -> EditorTextView {
        let view = EditorTextView()
        view.delegate = context.coordinator
        view.backgroundColor = .clear
        view.tintColor = UIColor(Theme.accent)
        view.keyboardAppearance = .dark
        view.keyboardDismissMode = .none
        view.alwaysBounceVertical = true
        view.contentInsetAdjustmentBehavior = .never
        view.smartDashesType = .no
        view.smartQuotesType = .no
        view.autocapitalizationType = .sentences
        view.accessibilityIdentifier = identifier
        view.onCaret = { visible in TestProbe.shared.caretVisible = visible }
        apply(metrics, to: view)
        view.attributedText = NSAttributedString(string: text, attributes: view.attributes)
        view.placeholder.text = placeholder
        view.refreshPlaceholder()
        return view
    }

    func updateUIView(_ view: EditorTextView, context: Context) {
        context.coordinator.parent = self
        if view.metrics != metrics {
            apply(metrics, to: view)
            view.attributedText = NSAttributedString(string: view.text, attributes: view.attributes)
        }
        if view.text != text {
            view.attributedText = NSAttributedString(string: text, attributes: view.attributes)
            view.refreshPlaceholder()
        }
        if focused, !view.isFirstResponder {
            DispatchQueue.main.async { view.becomeFirstResponder() }
        } else if !focused, view.isFirstResponder {
            DispatchQueue.main.async { view.resignFirstResponder() }
        }
    }

    private func apply(_ metrics: Metrics, to view: EditorTextView) {
        view.metrics = metrics
        let paragraph = NSMutableParagraphStyle()
        paragraph.lineSpacing = metrics.leading
        view.attributes = [
            .font: metrics.uiFont(),
            .foregroundColor: UIColor(Theme.fg),
            .paragraphStyle: paragraph
        ]
        view.typingAttributes = view.attributes
        view.textContainer.lineFragmentPadding = 0
        view.textContainerInset = UIEdgeInsets(top: metrics.py * 2, left: metrics.px, bottom: metrics.py * 2, right: metrics.px)
        view.placeholder.font = metrics.uiFont()
        view.placeholder.textColor = UIColor(Theme.faint)
        view.setNeedsLayout()
    }

    final class Coordinator: NSObject, UITextViewDelegate {
        var parent: ContentEditor

        init(_ parent: ContentEditor) {
            self.parent = parent
        }

        func textViewDidChange(_ view: UITextView) {
            parent.text = view.text
            (view as? EditorTextView)?.refreshPlaceholder()
            (view as? EditorTextView)?.keepCaretVisible()
        }

        func textViewDidBeginEditing(_ view: UITextView) {
            if !parent.focused { parent.focused = true }
        }

        func textViewDidEndEditing(_ view: UITextView) {
            if parent.focused { parent.focused = false }
        }

        func textViewDidChangeSelection(_ view: UITextView) {
            (view as? EditorTextView)?.reportCaret()
        }
    }
}

final class EditorTextView: UITextView {
    var metrics = Metrics()
    var attributes: [NSAttributedString.Key: Any] = [:]
    let placeholder = UILabel()
    var onCaret: ((Bool) -> Void)?
    private var lastHeight: CGFloat = 0

    init() {
        super.init(frame: .zero, textContainer: nil)
        placeholder.numberOfLines = 0
        placeholder.isUserInteractionEnabled = false
        addSubview(placeholder)
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError("init(coder:) is not used") }

    override func layoutSubviews() {
        super.layoutSubviews()
        placeholder.frame = CGRect(
            x: textContainerInset.left, y: textContainerInset.top,
            width: max(0, bounds.width - textContainerInset.left - textContainerInset.right),
            height: placeholder.sizeThatFits(CGSize(width: bounds.width, height: .greatestFiniteMagnitude)).height
        )
        // The keyboard or a toolbar changed our height: bring the caret back into view now,
        // inside this layout pass, so it never flickers out of sight.
        if bounds.height != lastHeight {
            lastHeight = bounds.height
            if isFirstResponder { keepCaretVisible() }
        }
        reportCaret()
    }

    func refreshPlaceholder() {
        placeholder.isHidden = !text.isEmpty
    }

    func keepCaretVisible() {
        guard let range = selectedTextRange, bounds.height > 0 else { return }
        layoutManager.ensureLayout(for: textContainer)
        let caret = caretRect(for: range.end)
        guard !caret.isNull, !caret.isInfinite else { return }
        let margin = metrics.size * 1.5
        scrollRectToVisible(caret.insetBy(dx: 0, dy: -margin), animated: false)
        reportCaret()
    }

    /// Whether the caret is fully inside the visible text area. Read by UI tests through
    /// `TestProbe`; costs nothing otherwise.
    func reportCaret() {
        guard let onCaret, isFirstResponder, let range = selectedTextRange else { return }
        let caret = caretRect(for: range.end)
        let visible = CGRect(
            x: contentOffset.x, y: contentOffset.y,
            width: bounds.width, height: bounds.height - adjustedContentInset.bottom
        )
        onCaret(visible.contains(caret.insetBy(dx: 0.5, dy: 0.5)))
    }
}

/// A small observable the UI tests read through an invisible element, so a test can assert
/// things the accessibility tree cannot show, like whether the caret is on screen.
@MainActor
@Observable
final class TestProbe {
    static let shared = TestProbe()
    var caretVisible = false
}

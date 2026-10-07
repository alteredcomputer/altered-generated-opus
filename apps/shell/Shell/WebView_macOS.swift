//  Compiled for macOS only (XcodeGen filters `*_macOS.swift` by destination); the guard keeps the
//  file correct even if it is ever built without that filter.
#if os(macOS)
    import AppKit
    import SwiftUI
    import WebKit

    struct WebView: NSViewRepresentable {
        let controller: WebController

        func makeNSView(context: Context) -> WKWebView { controller.webView }
        func updateNSView(_ webView: WKWebView, context: Context) {}
    }

    /// Takes keyboard focus whenever it lands in a window, so Cmd keys go to the page from the
    /// first keystroke instead of falling through to the (stripped) menus with a beep.
    final class KeyWebView: WKWebView {
        override func viewDidMoveToWindow() {
            super.viewDidMoveToWindow()
            _ = window?.makeFirstResponder(self)
        }
    }

    extension WebController {
        /// App-bound domains gate the service worker on iOS only, so the Mac needs nothing extra.
        static func configurePlatform(_ configuration: WKWebViewConfiguration, for config: ShellConfig) {}

        /// Transparent until the page paints. An opaque WKWebView fills its frame with the system
        /// colour (white, or #1D1D1D in dark mode) for the first frames of a launch, which showed
        /// as a flash under the strip. There is no public switch for the Mac web view's own
        /// background, so this sets `drawsBackground` by key, as AppKit hosts commonly do; the
        /// window's #101010 shows through instead.
        static func makeWebView(configuration: WKWebViewConfiguration) -> WKWebView {
            let webView = KeyWebView(frame: .zero, configuration: configuration)
            webView.setValue(false, forKey: "drawsBackground")
            webView.underPageBackgroundColor = NSColor(Color.shellBackground)
            return webView
        }

        func openExternally(_ url: URL) {
            log.info("opening in the browser: \(url.absoluteString, privacy: .public)")
            if !NSWorkspace.shared.open(url) {
                log.error("the browser did not open \(url.absoluteString, privacy: .public)")
            }
        }
    }
#endif

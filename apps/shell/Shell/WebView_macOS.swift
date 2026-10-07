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

    extension WebController {
        /// App-bound domains gate the service worker on iOS only, so the Mac needs nothing extra.
        static func configurePlatform(_ configuration: WKWebViewConfiguration, for config: ShellConfig) {}

        static func makeWebView(configuration: WKWebViewConfiguration) -> WKWebView {
            let webView = WKWebView(frame: .zero, configuration: configuration)
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

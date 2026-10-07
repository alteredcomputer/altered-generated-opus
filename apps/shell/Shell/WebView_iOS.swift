//  Compiled for iOS only (XcodeGen filters `*_iOS.swift` by destination); the guard keeps the
//  file correct even if it is ever built without that filter.
#if os(iOS)
    import SwiftUI
    import WebKit

    struct WebView: UIViewRepresentable {
        let controller: WebController

        func makeUIView(context: Context) -> WKWebView { controller.webView }
        func updateUIView(_ webView: WKWebView, context: Context) {}
    }

    extension WebController {
        /// The production host is the one app-bound domain (Info.plist `WKAppBoundDomains`), which
        /// lets the editor's service worker run, so a cold open comes from cache. A dev server is
        /// not app-bound, so a Debug build pointed at one lifts the limit (no service worker there).
        static func configurePlatform(_ configuration: WKWebViewConfiguration, for config: ShellConfig) {
            configuration.limitsNavigationsToAppBoundDomains = config.isProduction
        }

        /// Full screen under the safe areas: the page pads itself with `env(safe-area-inset-*)`.
        /// Transparent until the page paints, so the launch colour shows instead of white.
        static func makeWebView(configuration: WKWebViewConfiguration) -> WKWebView {
            let webView = WKWebView(frame: .zero, configuration: configuration)
            let background = UIColor(Color.shellBackground)
            webView.isOpaque = false
            webView.backgroundColor = background
            webView.underPageBackgroundColor = background
            webView.scrollView.backgroundColor = background
            webView.scrollView.contentInsetAdjustmentBehavior = .never
            //  The editor scrolls its own panes; the page itself never should.
            webView.scrollView.bounces = false
            return webView
        }

        func openExternally(_ url: URL) {
            log.info("opening in Safari: \(url.absoluteString, privacy: .public)")
            UIApplication.shared.open(url) { opened in
                if !opened { log.error("Safari did not open \(url.absoluteString, privacy: .public)") }
            }
        }
    }
#endif

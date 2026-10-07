import SwiftUI
import WebKit
import os

let log = Logger(subsystem: "com.rileybarabash.altered-shell", category: "web")

/// The one web view, owned for the app's lifetime so a closed Mac window reopens on the same page
/// without a reload. Its phase drives what the root view shows.
@Observable
final class WebController: NSObject {
    enum Phase: Equatable {
        case loading
        case ready
        case failed(String)
    }

    private(set) var phase = Phase.loading
    let webView: WKWebView
    private let config: ShellConfig

    init(config: ShellConfig) {
        self.config = config
        webView = WKWebView(frame: .zero, configuration: Self.configuration(for: config))
        super.init()
        webView.navigationDelegate = self
        #if DEBUG
            webView.isInspectable = true
        #endif
        load()
    }

    /// The configuration both platforms share. The default website data store is persistent, so
    /// the editor's IndexedDB survives launches.
    static func configuration(for config: ShellConfig) -> WKWebViewConfiguration {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.applicationNameForUserAgent = config.userAgentName
        return configuration
    }

    func load() {
        log.info("loading \(self.config.startURL.absoluteString, privacy: .public)")
        phase = .loading
        webView.load(URLRequest(url: config.startURL))
    }

    /// Only the first load can fail the screen. Once the editor is showing, a failed background
    /// navigation (a service worker update while offline) leaves the page as it is.
    private func fail(_ error: any Error) {
        let error = error as NSError
        log.error("navigation failed: \(error.domain, privacy: .public) \(error.code) \(error.localizedDescription, privacy: .public)")
        if phase == .loading { phase = .failed(error.localizedDescription) }
    }
}

extension WebController: WKNavigationDelegate {
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        phase = .ready
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: any Error) {
        fail(error)
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: any Error) {
        fail(error)
    }
}

#if os(iOS)
    struct WebView: UIViewRepresentable {
        let controller: WebController

        func makeUIView(context: Context) -> WKWebView { controller.webView }
        func updateUIView(_ webView: WKWebView, context: Context) {}
    }
#elseif os(macOS)
    struct WebView: NSViewRepresentable {
        let controller: WebController

        func makeNSView(context: Context) -> WKWebView { controller.webView }
        func updateNSView(_ webView: WKWebView, context: Context) {}
    }
#endif

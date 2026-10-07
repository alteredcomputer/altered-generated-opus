import SwiftUI
import WebKit
import os

nonisolated let log = Logger(subsystem: "com.rileybarabash.altered-shell", category: "web")

/// The one web view, owned for the app's lifetime so a closed Mac window reopens on the same page
/// without a reload. Its phase drives what the root view shows. Platform details live in
/// `WebView_iOS.swift` and `WebView_macOS.swift`.
@Observable
final class WebController: NSObject {
    enum Phase: Equatable {
        case loading
        case ready
        case failed(String)
    }

    private(set) var phase = Phase.loading
    let webView: WKWebView
    let config: ShellConfig

    init(config: ShellConfig) {
        self.config = config
        webView = Self.makeWebView(configuration: Self.configuration(for: config))
        super.init()
        webView.navigationDelegate = self
        webView.uiDelegate = self
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
        configurePlatform(configuration, for: config)
        return configuration
    }

    func load() {
        log.info("loading \(self.config.startURL.absoluteString, privacy: .public)")
        phase = .loading
        webView.load(URLRequest(url: config.startURL))
    }

    /// Only the first load can fail the screen. Once the editor is showing, a failed background
    /// navigation (a service worker update while offline) leaves the page as it is. A navigation
    /// this shell cancelled itself (a link sent to the browser) is not a failure.
    private func fail(_ error: any Error) {
        let error = error as NSError
        let cancelled =
            (error.domain == NSURLErrorDomain && error.code == NSURLErrorCancelled)
            || (error.domain == "WebKitErrorDomain" && error.code == 102)
        if cancelled { return }
        log.error(
            "navigation failed: \(error.domain, privacy: .public) \(error.code) \(error.localizedDescription, privacy: .public)"
        )
        if phase == .loading { phase = .failed(error.localizedDescription) }
    }
}

extension WebController: WKNavigationDelegate {
    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction) async
        -> WKNavigationActionPolicy
    {
        guard let url = action.request.url else { return .cancel }
        switch config.route(url) {
        case .inApp:
            return .allow
        case .external:
            //  Only a top-level navigation leaves for the browser; an outside frame is just dropped.
            if action.targetFrame?.isMainFrame ?? true { openExternally(url) }
            return .cancel
        case .refused:
            log.error("refused navigation to \(url.absoluteString, privacy: .public)")
            return .cancel
        }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        phase = .ready
    }

    func webView(
        _ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!,
        withError error: any Error
    ) {
        fail(error)
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: any Error) {
        fail(error)
    }

    /// iOS reclaims the page's process under memory pressure, which leaves a blank view; reload
    /// so the editor comes back (it restores its own screen from local storage).
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        log.error("web content process terminated, reloading")
        if webView.url == nil { load() } else { webView.reload() }
    }
}

extension WebController: WKUIDelegate {
    /// `window.open` and `target=_blank` never make a second web view: the editor's own origin
    /// loads in place, anything else goes through the same routing as a link.
    func webView(
        _ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
        for action: WKNavigationAction, windowFeatures: WKWindowFeatures
    ) -> WKWebView? {
        guard let url = action.request.url else { return nil }
        switch config.route(url) {
        case .inApp: webView.load(action.request)
        case .external: openExternally(url)
        case .refused: log.error("refused new window for \(url.absoluteString, privacy: .public)")
        }
        return nil
    }
}

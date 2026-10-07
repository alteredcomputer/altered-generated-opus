import Foundation

/// Why the shell refused to start. Each case is shown on the failure screen, never papered over.
enum ConfigError: Error, CustomStringConvertible {
    case malformedURL(String)
    case missingVersion

    var description: String {
        switch self {
        case .malformedURL(let raw):
            "The start URL is not an http or https address with a host: \"\(raw)\"."
        case .missingVersion:
            "Info.plist has no CFBundleShortVersionString, so the user agent cannot name the shell."
        }
    }
}

/// Where a navigation goes: stay in the shell, hand to the system browser, or refuse.
enum Route {
    case inApp
    case external
    case refused
}

/// Everything the shell is pointed at, read once at launch (D175).
struct ShellConfig {
    /// The hosted thought editor. Every deploy to it is the update; nothing is bundled.
    static let productionHost = "generated-thought-editor-prototype.vercel.app"
    static let production = "https://\(productionHost)"

    let startURL: URL
    /// Appended to the user agent, so the page can tell it runs in the shell (Cmd keys).
    let userAgentName: String
    /// True when the start URL is the production host, the only app-bound domain on iOS.
    let isProduction: Bool

    /// Debug builds may point at a dev server through the scheme's `ALTERED_SHELL_URL`; Release
    /// builds never read it. A set but empty or malformed value is an error, not a fallback.
    static func load(bundle: Bundle = .main) throws(ConfigError) -> ShellConfig {
        #if DEBUG
            let override = ProcessInfo.processInfo.environment["ALTERED_SHELL_URL"]
        #else
            let override: String? = nil
        #endif
        let raw = override ?? production

        guard let url = URL(string: raw),
            let scheme = url.scheme?.lowercased(), scheme == "https" || scheme == "http",
            let host = url.host(), !host.isEmpty
        else { throw .malformedURL(raw) }

        guard let version = bundle.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String,
            !version.isEmpty
        else { throw .missingVersion }

        return ShellConfig(
            startURL: url,
            userAgentName: "AlteredShell/\(version)",
            isProduction: scheme == "https" && host.lowercased() == productionHost
        )
    }

    /// Only the start URL's own origin loads in the shell; other web addresses open in the
    /// system browser, and every other scheme (file, custom schemes) is refused.
    func route(_ url: URL) -> Route {
        switch url.scheme?.lowercased() {
        case "about":
            return .inApp
        case "http", "https":
            let sameOrigin =
                url.scheme?.lowercased() == startURL.scheme?.lowercased()
                && url.host()?.lowercased() == startURL.host()?.lowercased()
                && url.port == startURL.port
            return sameOrigin ? .inApp : .external
        default:
            return .refused
        }
    }
}

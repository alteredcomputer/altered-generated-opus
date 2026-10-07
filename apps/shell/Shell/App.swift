import SwiftUI

/// ALTERED: a thin native shell around the hosted thought editor (D175). One web view, no bridge,
/// no plugins; see README.md for what is deliberately not here yet.
@main
struct AlteredShellApp: App {
    @State private var launch = Launch.start()

    var body: some Scene {
        WindowGroup {
            ShellRoot(launch: launch)
                .preferredColorScheme(.dark)
        }
    }
}

/// The outcome of reading the configuration: a running web view, or the reason there is none.
enum Launch {
    case running(WebController)
    case refused(String)

    static func start() -> Launch {
        do throws(ConfigError) {
            return .running(WebController(config: try ShellConfig.load()))
        } catch {
            log.fault("shell refused to start: \(error.description, privacy: .public)")
            return .refused(error.description)
        }
    }
}

/// The page fills the window; until its first load finishes the background shows instead, so
/// there is never a white or black frame.
struct ShellRoot: View {
    let launch: Launch

    var body: some View {
        ZStack {
            Color.shellBackground.ignoresSafeArea()
            switch launch {
            case .refused(let message):
                FailureView(message: message, retry: nil)
            case .running(let controller):
                WebScreen(controller: controller)
            }
        }
    }
}

struct WebScreen: View {
    let controller: WebController

    var body: some View {
        WebView(controller: controller)
            .opacity(controller.phase == .ready ? 1 : 0)
            .ignoresSafeArea()
            .overlay {
                if case .failed(let message) = controller.phase {
                    FailureView(message: message, retry: controller.load)
                }
            }
    }
}

/// The loud failure screen: what went wrong, in words, and a retry when retrying can help.
struct FailureView: View {
    let message: String
    let retry: (() -> Void)?

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("ALTERED could not open.")
                .foregroundStyle(.white)
            Text(message)
                .foregroundStyle(.gray)
            if let retry {
                Button("Retry", action: retry)
                    .buttonStyle(.plain)
                    .foregroundStyle(.white)
            }
        }
        .font(.system(size: 13, design: .monospaced))
        .textSelection(.enabled)
        .padding(24)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(Color.shellBackground)
    }
}

extension Color {
    /// #101010, the editor's ground (asset `Background`, also the iOS launch screen colour).
    static let shellBackground = Color("Background")
}

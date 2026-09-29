import AlteredCore
import CoreTransferable
import SwiftUI

/// Settings, the simulated network, the outbox, and the log. Each setting is one tap that cycles
/// through its values: no pickers, no sheets.
struct SysScreen: View {
    @Environment(AppModel.self) private var app
    @Environment(\.metrics) private var metrics
    @State private var armedReset = false

    var body: some View {
        @Bindable var app = app
        let network = app.settings.network
        TabScaffold {
            Header(title: "Sys") { SyncStatus() }
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    heading("Network")
                    setting("status", network.online ? "online" : "offline", role: network.online ? .title : .accent, id: "online") {
                        app.settings.network.online.toggle()
                    }
                    setting("latency", "\(network.latencyMs) ms", id: "latency") {
                        app.settings.network.latencyMs = Settings.next(network.latencyMs, in: Settings.latencies)
                    }
                    setting("failures", "\(Int(network.failureRate * 100))%", role: network.failureRate > 0 ? .accent : .title, id: "failures") {
                        app.settings.network.failureRate = Settings.next(network.failureRate, in: Settings.failureRates)
                    }
                    setting("outbox", "\(app.store.outbox.count) queued  →", id: "outbox") { app.router.push(.outbox) }

                    heading("Display")
                    setting("text", "\(app.settings.textSize) pt", id: "text") {
                        app.settings.textSize = Settings.next(app.settings.textSize, in: Settings.textSizes)
                    }
                    setting("screens", app.settings.instantNavigation ? "instant" : "slide", id: "navigation") {
                        app.settings.instantNavigation.toggle()
                    }
                    setting("haptics", app.settings.haptics ? "on" : "off", id: "haptics") {
                        app.settings.haptics.toggle()
                    }

                    heading("Data")
                    setting("koa", app.agentRunning ? "reviewing..." : "run review  →", id: "koa") { app.runAgent() }
                    ShareLink(item: LibraryExport(library: app.store.library), preview: SharePreview("ALTERED library")) {
                        row("export", "share json  →", role: .title)
                    }
                    .buttonStyle(Press())
                    .accessibilityIdentifier("setting.export")
                    setting("reset", armedReset ? "tap again to reset" : "demo data", role: armedReset ? .danger : .title, id: "reset") {
                        if armedReset {
                            armedReset = false
                            app.resetDemo()
                        } else {
                            armedReset = true
                            Haptics.warning()
                        }
                    }
                    setting("log", "\(app.log.lines.count) lines  →", id: "log") { app.router.push(.log) }

                    Rule()
                        .padding(.horizontal, metrics.px)
                        .padding(.top, metrics.py * 3)
                    VStack(alignment: .leading, spacing: metrics.ch * 0.6) {
                        KeyValue(key: "build", value: Self.build)
                        KeyValue(key: "data", value: "on this phone; the network is simulated")
                        Text("This app is generated. It is a prototype of the ALTERED editor.")
                            .styled(.faint)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .padding(.horizontal, metrics.px)
                    .padding(.vertical, metrics.py * 2)
                }
            }
        }
    }

    static var build: String {
        let info = Bundle.main.infoDictionary ?? [:]
        let version = info["CFBundleShortVersionString"] as? String ?? "?"
        let build = info["AlteredBuild"] as? String ?? "dev"
        return "\(version) (\(build))"
    }

    private func heading(_ text: String) -> some View {
        Heading(level: 2, text: text)
            .padding(.horizontal, metrics.px)
            .padding(.top, metrics.py * 3)
            .padding(.bottom, metrics.py)
    }

    private func row(_ key: String, _ value: String, role: Role) -> some View {
        HStack(spacing: metrics.ch) {
            Text(key).styled(.dim).frame(width: metrics.ch * 10, alignment: .leading)
            Text(value).styled(role)
            Spacer(minLength: 0)
        }
        .padding(.horizontal, metrics.px)
        .frame(minHeight: 48)
        .contentShape(Rectangle())
    }

    private func setting(_ key: String, _ value: String, role: Role = .title, id: String, action: @escaping () -> Void) -> some View {
        Button {
            Haptics.tap()
            action()
        } label: {
            row(key, value, role: role)
        }
        .buttonStyle(Press())
        .accessibilityIdentifier("setting.\(id)")
    }
}

/// The whole library as JSON for the share sheet, encoded only when shared.
struct LibraryExport: Transferable {
    let library: Library

    static var transferRepresentation: some TransferRepresentation {
        DataRepresentation(exportedContentType: .json) { export in
            try Coding.encoder.encode(export.library)
        }
        .suggestedFileName("altered-library.json")
    }
}

/// Changes waiting for the server, oldest first; the first one is in flight.
struct OutboxScreen: View {
    @Environment(AppModel.self) private var app
    @Environment(\.metrics) private var metrics

    var body: some View {
        let now = Date()
        VStack(spacing: 0) {
            Header(title: "Outbox", back: true)
            List {
                ForEach(app.store.outbox) { envelope in
                    HStack(spacing: metrics.ch) {
                        if app.store.sending == envelope.id { Spinner() } else { Text("·").styled(.faint) }
                        Text(envelope.mutation.summary).styled(.title)
                        Spacer(minLength: metrics.ch)
                        Text(Format.age(envelope.queuedAt, now: now)).styled(.faint)
                    }
                    .padding(.horizontal, metrics.px)
                    .frame(minHeight: 44)
                    .plainRow()
                }
                if app.store.outbox.isEmpty {
                    EmptyNote(text: "Everything is confirmed.").plainRow()
                }
            }
            .plainList()
            Text(app.settings.network.online
                ? "Changes apply here at once and send one at a time. A rejected change rolls back; anything that depended on it rolls back too."
                : "Offline. Changes stay here, on disk, and send when the network is back.")
                .styled(.faint)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.horizontal, metrics.px)
                .padding(.vertical, metrics.py * 2)
        }
        .background(Theme.bg)
    }
}

struct LogScreen: View {
    @Environment(AppModel.self) private var app
    @Environment(\.metrics) private var metrics

    var body: some View {
        VStack(spacing: 0) {
            Header(title: "Log", back: true)
            List {
                ForEach(app.log.lines.reversed()) { line in
                    HStack(alignment: .firstTextBaseline, spacing: metrics.ch) {
                        Text(Self.time(line.at)).styled(.faint)
                        Text(line.text).styled(line.level == .info ? .body : .accent)
                            .fixedSize(horizontal: false, vertical: true)
                        Spacer(minLength: 0)
                    }
                    .padding(.horizontal, metrics.px)
                    .padding(.vertical, metrics.ch * 0.5)
                    .plainRow()
                }
            }
            .plainList()
        }
        .background(Theme.bg)
    }

    static func time(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm:ss"
        return formatter.string(from: date)
    }
}

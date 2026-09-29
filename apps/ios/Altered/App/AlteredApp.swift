import SwiftUI

@main
struct AlteredApp: App {
    @State private var app = AppModel.launch()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(app)
                .environment(\.metrics, app.metrics)
                .preferredColorScheme(.dark)
        }
    }
}

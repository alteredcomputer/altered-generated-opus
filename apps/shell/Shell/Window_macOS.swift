//  Compiled for macOS only (XcodeGen filters `*_macOS.swift` by destination); the guard keeps the
//  file correct even if it is ever built without that filter.
#if os(macOS)
    import AppKit
    import SwiftUI

    /// Keeps the app warm: closing the window does not quit, so the Dock icon reopens it on the
    /// same web view with no reload. No window tabs, so Cmd-T is the editor's.
    final class MacAppDelegate: NSObject, NSApplicationDelegate {
        func applicationWillFinishLaunching(_ notification: Notification) {
            NSWindow.allowsAutomaticWindowTabbing = false
        }

        func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
            false
        }
    }

    /// The thin native strip at the top of the window: it holds the stoplights (the title bar is
    /// hidden) and drags the window. The web view starts below it.
    struct WindowStrip: View {
        static let height: CGFloat = 28

        var body: some View {
            Color.shellBackground
                .frame(height: Self.height)
                .gesture(WindowDragGesture())
                .allowsWindowActivationEvents(true)
        }
    }
#endif

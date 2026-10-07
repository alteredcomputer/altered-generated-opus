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

    /// Strips the menus so Cmd-N, Cmd-T, Cmd-W, Cmd-K, Cmd-comma, Cmd-slash, and the rest reach
    /// the page (D175). Kept: Quit, Hide, Hide Others, Minimize, and the whole Edit menu (Undo,
    /// Redo, Cut, Copy, Paste, Select All) so text fields work. The tab items are already gone,
    /// with window tabbing.
    struct ShellCommands: Commands {
        var body: some Commands {
            CommandGroup(replacing: .newItem) {}  //  New Window, Cmd-N
            CommandGroup(replacing: .saveItem) {}  //  Close, Cmd-W
            CommandGroup(replacing: .appSettings) {}  //  Settings, Cmd-comma
            CommandGroup(replacing: .help) {}  //  Help search, Cmd-Shift-slash
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

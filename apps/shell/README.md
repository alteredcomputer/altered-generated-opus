# ALTERED shell for Mac and iPhone

A thin native wrapper around the hosted thought editor (D175): one SwiftUI multiplatform target
with one WKWebView, pointed at `https://generated-thought-editor-prototype.vercel.app`. Every
deploy of the editor is the update; nothing is bundled. Generated, and disclosed as such.

## Run it

On the Mac, once: `brew install xcodegen`. Then:

```sh
cd apps/shell
ALTERED_TEAM=<your team id> xcodegen   # makes AlteredShell.xcodeproj (gitignored)
open AlteredShell.xcodeproj             # pick a destination, press Run
```

- **Mac:** pick **My Mac** as the destination and press Run. The app is `ALTERED.app`; drag it
  from Xcode's Products folder to Applications to keep it.
- **iPhone:** plug it in (or pair it over Wi-Fi), pick it as the destination, press Run. The
  first time, trust the developer profile in Settings, General, VPN and Device Management.

The team id is in Xcode, Settings, Accounts. Passing it to xcodegen keeps signing across
regenerations. The bundle id is `com.rileybarabash.altered-shell`; the SwiftUI prototype in
`apps/ios` stays installed beside it as **ALTERED Swift**.

Deployment targets are iOS 26 and macOS 26. If the Mac is older, lower `macOS` in `project.yml`
(the window drag strip needs macOS 15).

## Pointing it at a dev server (Debug only)

1. Run the editor on the Mac: `pnpm --filter @opus/thought-editor dev --host`.
2. In Xcode, Product, Scheme, Edit Scheme, Run, Arguments: tick `ALTERED_SHELL_URL` and set it
   to `http://<the Mac's local IP>:5173` (`http://localhost:5173` works for the Mac app).
3. Run. A malformed value shows a failure screen instead of falling back to production.

Release builds never read the variable. A Debug build also allows local networking in App
Transport Security (a build script adds it); Release builds do not. On a dev server the iPhone
build lifts the app-bound domain limit, so there is no service worker there.

`Tools/keylog.html` is a key logger for checking that Cmd keys reach the page: serve it with
`python3 -m http.server 8000 --directory apps/shell/Tools` and point `ALTERED_SHELL_URL` at
`http://localhost:8000/keylog.html`.

## What it does

- **One web view** on the hosted editor, kept for the app's lifetime, with the default persistent
  website data store, so the editor's IndexedDB survives launches. That data is separate from the
  Chrome and Safari web apps' data.
- **User agent** ends in `AlteredShell/<version>`, which is how the editor knows to take Cmd as
  well as Ctrl for its creation, dataset, and delete shortcuts.
- **Navigation** stays on the start URL's origin. Other web addresses open in Safari or the
  default browser; other schemes are refused. On iOS the production host is the one app-bound
  domain, so the service worker runs and a cold open comes from cache.
- **iPhone:** full screen under the safe areas (the page pads itself), no root bounce, #101010
  launch screen, and the web view stays hidden until the page has painted.
- **Mac:** no title bar; a 28pt #101010 strip holds the stoplights and drags the window. No
  window tabs. Closing the window keeps the app running, and the Dock reopens the same page
  without a reload. The menus keep only Quit, Hide, Hide Others, Minimize, and the Edit menu, so
  Cmd-N, Cmd-T, Cmd-W, Cmd-K, Cmd-comma, and Cmd-slash reach the editor.
- **Failures are loud:** a bad start URL or a failed first load shows the reason on screen, with
  Retry where it can help. Logs go to the unified log under `com.rileybarabash.altered-shell`.

## Not here yet, on purpose

Each comes as its own change when it earns it (D175).

- **JavaScript bridge:** a `WKScriptMessageHandler` registered in
  `WebController.configuration(for:)`. Today there are no message handlers, so the page cannot
  call native code. When one arrives, every handler validates its input and is listed here.
- **Haptics:** a bridge message handled in `WebView_iOS.swift` (`UIImpactFeedbackGenerator`).
- **Push notifications:** an app delegate on iOS, the Push capability, and a server to send them.
- **Bundled web build:** the editor's `dist` copied into the app and served through a
  `WKURLSchemeHandler`, for a first launch with no network.
- **Over-the-air updates:** not needed while the shell loads the hosted deploy; every deploy is
  the update.

## Layout

| Path | What |
| --- | --- |
| `project.yml` | The XcodeGen spec: one target for iOS and macOS, the Info.plist keys, the Debug-only ATS script. |
| `Shell/App.swift` | The app, the root view, and the failure screen. |
| `Shell/Config.swift` | The start URL (the one place it lives), the debug override, and link routing. |
| `Shell/WebView.swift` | The one web view, its shared configuration, and the navigation delegate. |
| `Shell/WebView_iOS.swift` | iPhone: the representable, app-bound domains, safe areas, Safari. |
| `Shell/WebView_macOS.swift` | Mac: the representable, keyboard focus, the default browser. |
| `Shell/Window_macOS.swift` | Mac: the drag strip, the stripped menus, staying warm. |
| `Shell/Mac.entitlements` | Mac: App Sandbox with outgoing network only. |
| `Shell/Resources/` | The app icon (the editor's icon) and the #101010 background colour. |
| `Tools/keylog.html` | A development aid for checking Cmd key delivery; not part of the app. |

CI: `.github/workflows/shell.yml` builds unsigned for the iPhone Simulator and the Mac, in Debug
and in Release.

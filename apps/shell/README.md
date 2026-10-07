# ALTERED shell for Mac and iPhone

A thin native wrapper around the hosted thought editor (D175): one SwiftUI multiplatform target
with one WKWebView, pointed at `https://generated-thought-editor-prototype.vercel.app`. Every
deploy of the editor is the update; nothing is bundled. Generated, and disclosed as such.

## Run it

On the Mac, once: `brew install xcodegen`. Then:

```sh
cd apps/shell
ALTERED_TEAM=<your team id> xcodegen   # makes AlteredShell.xcodeproj (gitignored)
open AlteredShell.xcodeproj             # pick My Mac or your iPhone, press Run
```

The team id is in Xcode, Settings, Accounts. The bundle id is `com.rileybarabash.altered-shell`.

## Layout

| Path | What |
| --- | --- |
| `project.yml` | The XcodeGen spec: one target, iOS 26 and macOS 26. |
| `Shell/App.swift` | The app, the root view, and the failure screen. |
| `Shell/Config.swift` | The start URL (the one place it lives), the debug override, and link routing. |
| `Shell/WebView.swift` | The one web view, its shared configuration, and the navigation delegate. |
| `Shell/Resources/` | The app icon (the editor's icon) and the #101010 background colour. |

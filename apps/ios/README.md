# ALTERED for iPhone (prototype)

A native Swift and SwiftUI editor for thoughts, datasets, schemas, versions, and agent
proposals. Generated, and disclosed as such (D157). Local-first: the library lives on the phone
and the network is simulated, so every optimistic update, rollback, and offline queue can be
tried without a server.

## Run it

On the Mac, once: `brew install xcodegen`. Then:

```sh
cd apps/ios
ALTERED_TEAM=<your team id> xcodegen   # makes Altered.xcodeproj (gitignored)
open Altered.xcodeproj                  # pick your iPhone, press Run
```

The team id is in Xcode, Settings, Accounts. Passing it to xcodegen keeps signing across
regenerations. The bundle id is `com.rileybarabash.altered-editor`.

## Layout

| Path | What |
| --- | --- |
| `AlteredCore/` | Model, rules, search, diff, agent rules, seed, and the optimistic store. No UI; `swift test` runs it (also on Linux). |
| `Altered/Design/` | Tokens, type, press style, haptics, the keyboard layer, the content editor. |
| `Altered/Shell/` | Tabs, router, action panel, toasts. |
| `Altered/Thoughts`, `Sets`, `Views`, `Review`, `Sys` | The screens. |
| `AlteredTests/`, `AlteredUITests/` | App unit tests and Simulator UI tests. |

CI: `.github/workflows/ios.yml` runs the core tests, then the app's unit and UI tests on the
newest iPhone Simulator, and uploads the UI tests' screenshots as the `screenshots` artifact.

## Using it

- **Tabs**: Thoughts, Sets (datasets), Views (saved queries), Review, Sys. Tap the current tab
  again to go back to its root.
- **Rows**: tap to open, hold for the action panel (the phone's Cmd-K), swipe right to edit,
  swipe left to pin or for more.
- **Search** sits at the bottom and rides on the keyboard. While typing, query tokens appear
  above it: `#dataset`, `is:draft`, `is:incomplete`, `is:unvalidated`, `is:pinned`,
  `is:proposed`, `by:koa`, `field:value`, `sort:updated`, `sort:alias`, and `-` to negate.
  Return opens the first result.
- **Detail**: swipe sideways to step through the list you came from.
- **Default closed**: every new field is required unless you opt out. A thought with an alias
  must fill every required field of its datasets; a draft (no alias) may wait.
- **Authoring**: every revision records its author. Koa's proposals land only when you accept
  them, and stay marked `ai` until you validate them. Locked thoughts refuse edits and proposals.
- **Sys**: set latency, failure rate, or go offline to watch optimistic updates, rollbacks, and
  the outbox. Text size 13, 15, or 17. Instant or sliding screen changes.

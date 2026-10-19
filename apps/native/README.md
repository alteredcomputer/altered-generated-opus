# ALTERED Native (Native Ergonomics)

A separate native iPhone test UI for thoughts and datasets, built ergonomics first and aesthetics
second from stock SwiftUI and iOS 26 Liquid Glass (D198). Think Notes crossed with a database
editor: finger-wide rows, context menus, glass bars, and the desktop editor's power moves mapped to
touch. Generated, and disclosed as such.

Its library lives on the phone in its own SwiftData store, seeded on first launch with the web
editor's demo thoughts and datasets. No network, no sync, nothing shared with the web editor or the
Swift prototype (`apps/ios`).

## Run it

On the Mac, once: `brew install xcodegen`. Then:

```sh
cd apps/native
ALTERED_TEAM=<your team id> xcodegen   # makes NativeErgonomics.xcodeproj (gitignored)
open NativeErgonomics.xcodeproj         # pick your iPhone, press Run
```

The team id is in Xcode, Settings, Accounts. The bundle id is `com.rileybarabash.altered-native`
and the home screen name is ALTERED Native. iOS 26, iPhone.

CI: `.github/workflows/native.yml` builds Debug and Release for the Simulator, then runs the unit
tests and the compose UI test on the newest iPhone Simulator (screenshots in the
`native-screenshots` artifact).

## Cheat sheet

### Thoughts list

| Move | What it does |
| --- | --- |
| Tap a row | Open the thought |
| Long press | Preview plus every action: open, copy contents, datasets, duplicate, select, delete |
| Swipe left | Delete (full swipe), or Datasets |
| Swipe right | Copy contents |
| Two-finger swipe down the rows | Select a range (enters Select mode) |
| More menu, Select Thoughts | Select mode; Select All in the top left |
| Bulk bar (Select mode) | Datasets, Copy, Delete for the whole selection |
| Long press a selected row | The actions apply to the whole selection |
| Filter button | Show only thoughts in the checked datasets |
| More menu, Sort By | Date Modified, Date Created, Date Added, or Title |
| Search field (bottom bar) | Every word must match: alias, text, datasets, attributes |
| Dataset suggestions while searching | Tap one to filter by it as a token |
| Compose button (bottom right) | New thought, opened with the keyboard up |
| Undo in the banner, shake, or three-finger swipe left | Undo a delete or a dataset change |

### Editor

| Move | What it does |
| --- | --- |
| Just type | Saves as you type, no save button |
| Drag the text down | Lowers the keyboard as your finger goes |
| Keyboard bar, up and down arrows | Previous and next thought in the list you came from; the keyboard stays up |
| Keyboard bar, stack icon | Add to or remove from datasets |
| Keyboard bar, info | Details sheet: alias, datasets, fields, attributes, dates |
| Keyboard bar, keyboard icon (or the checkmark at the top) | Hide the keyboard |
| Bottom bar | Previous, next, and a new thought, when the keyboard is down |
| More menu | Copy contents, duplicate, delete |
| Leave a thought empty | It is discarded when you go back or move on |

### Datasets tab

Tap a dataset for its thoughts (compose there files the new thought in it). Swipe left or long
press to rename or delete; deleting asks first, keeps the thoughts, and turns their values for
its fields into plain attributes. The plus button makes a new dataset.

### Hardware keyboard

| Keys | What they do |
| --- | --- |
| Cmd-N | New thought (new dataset on the Datasets tab) |
| Cmd-F | Search |
| Cmd-[ and Cmd-] | Previous and next thought in the editor |
| Cmd-I | Details sheet in the editor |
| Cmd-E | Select mode on and off in a list |
| Cmd-Shift-A | Select all, in Select mode |
| Cmd-Delete | Delete the selection, in Select mode |
| Cmd-Return | Done in the details sheet |
| Escape | Back from the editor, out of Select mode or search, Cancel in a sheet |

Holding Cmd shows the list where iOS offers it.

## Design calls

- **Stock components.** `TabView` with the iOS 26 `Tab` API and a search-role tab, `List` with
  selection, `.searchable` with tokens, `.swipeActions`, `.contextMenu` with previews, toolbars
  with `ToolbarSpacer` glass groups, sheets with detents, and `TextEditor` with `@FocusState`.
- **Colour.** The system appearance, light and dark. The accent is one restrained gray from the
  D172 ramp: #404040 in light and #808080 in dark, so the glass, check marks, and selection
  circles read in both and stay monochrome. Red stays for destructive actions, as iOS expects.
- **Datasets are tags.** As on the web, a thought can be in many datasets, so "move" is a
  checkmark menu: choosing a dataset adds the thought (or the selection) to it, or removes it when
  every target is already in.
- **Speed.** Each thought stores its title, snippet, dataset line, and lowercased search text,
  updated on write, so rows and search never parse content while scrolling or typing. Typing is
  staged and saved after a short pause, so a keystroke never waits on a write.

## Where UIKit is used, and why

- `UIPasteboard` for Copy: SwiftUI on iOS can read the clipboard (`PasteButton`) but not write it.

Nothing else: no `UIViewRepresentable`, no custom text view.

## Deliberately not here

- Sync, sharing, or import from the web editor or the prototype (D198).
- Editing a dataset's fields (the seed's fields are there; adding new ones is the web editor's).
- Versions, relations, and saved views from the prototype.
- A settings screen: appearance follows the system.
- A custom app icon.

# Grid editor (`/grid`)

The thought editor TUI's round 2 screens (D174), ported to the web on a strict character grid
(D176). Generated. It lives in the thought editor app beside the classic editor at `/`, shares its
IndexedDB data and its deploy, and has its own stylesheet; neither editor imports the other's UI.
Each editor's action menu opens the other (Open Grid Editor, Open Classic Editor).

## Run

```sh
pnpm install                                   # once, from the repo root
pnpm --filter @opus/thought-editor dev         # then open http://localhost:5173/grid
```

`/grid?primitives` is a test page of every primitive. Logs are structured entries in the browser
console (`grid metrics`, `grid config`, `write`, `toast`).

## The grid

- **Type:** Geist Mono Medium (weight 500) at 12px, preloaded; nothing renders until that face
  has loaded, so the cell is never measured on a fallback font.
- **Cell width:** `--cw: round(1ch, 1px)` with `letter-spacing: calc(var(--cw) - 1ch)`, so every
  glyph advances exactly one cell (7px). At boot a run of 100 cells is measured; if it is not
  exactly 100 cells wide, the advance is measured in JS, rounded, and written as `--cw` in pixels
  (logged as `method: "js"`). Chromium uses the CSS path.
- **Line height:** `--lh: 15px`. Every row is exactly one `--lh` tall.
- **Size:** the grid is the window floored to whole cells; `useGridSize()` gives its columns and
  rows, the web equivalent of the terminal's dimensions.
- **Characters the font lacks** (↵ ⇧ ⌄ ✓ ← ⌘, the braille spinner, wide CJK) are pinned to their
  cells (two for wide ones), so they cannot push later glyphs off the grid.
- **Inputs:** native inputs keep focus, caret position, selection, IME, and the clipboard, but
  their glyphs are transparent; the text is drawn as ordinary grid text on top, because engines
  centre input text by their own rounding (Chromium drew it a pixel low). The block caret is drawn
  one cell wide and blinks.

## Closed styling

Views use only the primitives in `ui/` (`Box`, `Text`, `Span`, `Strong`, `ScrollBox`, `Input`,
`Textarea`): props in cells and rows, colours as theme tokens, no `className` or `style`.
`ui/closed-styling.test.ts` (part of `check:tests`) fails if any file under `src/grid/` outside
`ui/` has `className=`, `style=`, a CSS import, or a lowercase JSX element, if the stylesheet uses
a length other than cells, rows, or its tokens, or if either editor imports the other's UI.

## Settings: `config/grid.config.ts`

The TUI's settings under the same names and defaults (`config/schema.ts`), minus the terminal
palette. Save the file under `pnpm dev` and the page reloads; a bad value throws naming every bad
key. One addition: `inspector.hideBelow` (default 100 cells) opens the list with the inspector
hidden on narrow screens such as a phone.

## Keys

The TUI's app-style keys with one rule: the modifier is Cmd on Apple platforms and Ctrl
elsewhere. Chrome never delivers Cmd-N, Cmd-T, or Cmd-W, so there those three take Ctrl; Safari
and the Apple shell (user agent `AlteredShell`) take Cmd for all. The keyboard map (the modifier
and /, or F1) shows the keys that work in the current browser. In the form, suggestions also move with Ctrl-N
and Ctrl-P, Ctrl-Tab where the browser allows it, or Option-Up and Option-Down. With text
selected in a field, Cmd-X and Cmd-C cut and copy instead of running their actions. Keys are
ignored while an IME composition is in progress. Everything is clickable too.

## Routing and offline

`grid.html` is a second Vite entry. On Vercel, `vercel.json` (`cleanUrls`) serves it at `/grid`;
in dev and preview a small plugin in `vite.config.ts` does the same. The service worker precaches
it, so `/grid` opens offline after one visit. The installed app still opens `/`.

## Engine parity

`parity/capture.mjs` captures the main screens in Chromium and WebKit at 1280x800 and 390x844,
compares every grid element's box to the pixel, and reports a pixel diff per pair. The
`grid-parity` workflow runs it on macOS and uploads the screenshots.

## Differences from the TUI

- Data is the classic editor's Dexie store, not an in-memory demo: writes persist, Reset Demo Data
  asks first, and dataset names are the classic seed's (lower case).
- Schemas have no description in this store, so empty attribute fields show "Empty" as their
  placeholder, and only the text type exists.
- The form keeps attributes the classic editor stored without a schema (the inspector shows them).
- Content is a wrapping textarea; Quit is gone (the browser or the shell owns it); Open in Web
  became Open Classic Editor; Copy Content uses the clipboard API.

## Layout

```
main.tsx, app.tsx  entry and providers
config/            settings file, defaults and validation, light or dark
ui/                the primitives, metrics, theme tokens, the one stylesheet, the closed-styling test
shell/             key layers and host-aware keys, view stack, frame, palette, overlay, key map,
                   confirm, toasts, list and its selection state
views/             thoughts list, inspector, form; dataset picker and list; attribute list
demo/              the primitives test page
parity/            the Chromium and WebKit parity capture
```

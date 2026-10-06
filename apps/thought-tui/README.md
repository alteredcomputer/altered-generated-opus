# Thought editor TUI

A terminal edition of the ALTERED thought editor (D173, D174), generated. OpenTUI with its React
renderer on Bun, the D172 monochrome ramp (or your terminal's own colours), app-style keys. An
in-memory demo seeded with the web editor's thoughts; nothing is saved, every launch starts fresh.

## Run

```sh
pnpm install          # once, from the repo root
pnpm tui              # from the repo root (needs Bun; Ghostty or another truecolor terminal)
```

Logs go to `$TMPDIR/thought-tui.log` (JSON lines; the path prints on exit).

## Settings: `tui.config.ts`

Edit `apps/thought-tui/tui.config.ts` while the TUI runs; saving re-renders it. Every setting and
its default is in `src/config/schema.ts`. A bad value is refused with an orange toast naming it,
and the last good config stays in force; at startup a bad file stops the launch.

| Setting | What it changes |
| --- | --- |
| `topBar.paddingTop`, `header.paddingTop` / `paddingBottom` | rows around the ALTERED bar and the search |
| `footer.paddingTop` / `paddingBottom` | rows around the status bar (bottom is at least 1) |
| `list.gap`, `inspector.gap`, `palette.gap` | blank rows between rows (0 or 1) |
| `list.date` | the date at the right of each row: `added`, `modified`, `created` |
| `selection.mark` | the character inside `[ ]`: `×`, `x`, `X`, anything |
| `selection.extend` | Shift-arrows: `drag` or `range` (below) |
| `theme.palette`, `theme.mode` | `altered` or `terminal` colours; `dark` or `light` (Ctrl-Shift-D) |
| `form.datasets` | the datasets field: `text` (typed, with suggestions) or `picker` |
| `input.placeholderPrefix` | drawn before placeholders, so the block caret blinks on it |
| `glyphs.*` | key-cap and marker glyphs |

## Keys

The search is always focused: letters type into it. Ctrl-/ (or F1) shows every shortcut.

| Key | |
| --- | --- |
| ↑ ↓ / Tab, Shift-Tab | move |
| Enter | select or deselect the row |
| Shift-↑ ↓ | extend the selection (`selection.extend`) |
| Ctrl-S · Ctrl-D · Ctrl-G | select all · deselect all · select the gap |
| Ctrl-E · Ctrl-N · Ctrl-X | edit · new · delete |
| Ctrl-T · Ctrl-Y | datasets · copy content |
| Ctrl-K · Ctrl-L · Ctrl-, | actions · change view · account menu |
| Ctrl-I · Ctrl-Shift-I | inspector · its width |
| Ctrl-Shift-D | light or dark |
| Esc | clear the selection, then the search, then go back |

In the edit view: Tab, Shift-Tab, and the arrows move between fields; Ctrl-A selects a field's
text; Ctrl-Tab and Ctrl-Shift-Tab (or Ctrl-N, Ctrl-P) walk dataset suggestions, Enter takes one;
Ctrl-S saves. Everything in the chrome is clickable too (the back arrow, the view selector, the
account, the status bar actions, a toast to dismiss it), and a click outside a menu closes it,
for when a dictation tool has taken Escape.

Ctrl-I, Ctrl-Shift-I, Ctrl-Shift-D, Ctrl-/, Ctrl-, and Ctrl-Tab need the kitty keyboard protocol,
which Ghostty speaks and the app turns on. In Terminal.app, Ctrl-I arrives as Tab.

## Selection strategies

- **drag** (default, from the Raycast extension): Enter on a row selects or deselects it and
  remembers which. Shift-arrows then repeat that action on the row you leave and the row you
  enter, so you paint a run of rows, or erase one after a deselect. Reversing keeps painting.
- **range** (Finder's): Shift-arrows select from where the extend began to the cursor, on top of
  what was already selected; reversing shrinks the range.
- **Select Gap** (Ctrl-G, either mode): everything between the last row you toggled and the
  cursor. Selected if none were, deselected if all were, otherwise made consistent with your
  last action.

## Glyphs and fonts

A terminal app cannot choose its font. The web build's Geist Mono is a Latin subset with none of
↵ ⇧ ⌄ ✓, so terminals draw those from a fallback font, which is why they look different on each
machine. In Ghostty, send those code points to Apple's symbol font (the TUI equivalent of the web
editor's system-ui glyphs) by adding to `~/.config/ghostty/config`:

```
font-codepoint-map = U+2190-U+21FF,U+2300-U+23FF,U+2713,U+2715=Apple Symbols
```

Or set different characters under `glyphs` in `tui.config.ts`.

## Layout

```
tui.config.ts     live settings
src/
  config/         defaults, validation, hot reload, colour derivation
  data/           model, seed, search, pure writes, store
  shell/          key layers, view stack, frame, palette, overlay, key map, confirm, toasts
  ui/             theme, keys, list and its selection state, text field, row fitting
  views/          thoughts list, inspector, form; dataset picker and list; attribute list
```

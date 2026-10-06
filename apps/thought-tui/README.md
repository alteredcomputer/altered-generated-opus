# Thought editor TUI

A terminal edition of the ALTERED thought editor (D173), generated as an exploration: does a TUI mean
less code to own than the web editor (`apps/thought-editor`)? OpenTUI with its React renderer on
Bun, the D172 monochrome ramp in truecolor, vim-style keys. An in-memory demo seeded with the same
25 thoughts; nothing is saved, and every launch starts fresh.

## Run

```sh
pnpm install          # once, from the repo root
pnpm tui              # from the repo root (needs Bun; a truecolor terminal such as Ghostty)
```

Logs go to `$TMPDIR/thought-tui.log` (JSON lines; the path prints on exit), because the screen
belongs to the UI.

## Keys

Press `?` anywhere for a searchable list. Lists use the same keys everywhere.

| Key | |
| --- | --- |
| `j` `k` / arrows | move |
| `g` `G` · `^d` `^u` | top, bottom · half page |
| `v` · `J` `K` (or Shift-arrows) | toggle a row · extend the selection |
| `/` | search (Enter keeps the query, Esc clears it) |
| `Space` | actions for what is under the cursor |
| `Enter` | edit (or the view's primary action) |
| `n` `x` `t` `y` | new · delete · datasets · copy content (OSC 52) |
| `f` · `i` `I` · `D` | filter by dataset · inspector, its width · datasets view |
| `Esc` · `q` | clear, then back · back (quit at the root) |

In the edit view, `j` and `k` walk the fields, `Enter` or `i` types into one, `Esc` stops typing,
`Tab` moves while typing, `a` adds an attribute, `s` assigns it a schema, `x` removes it, and
`Ctrl-S` saves from either mode. Leaving with unsaved changes asks first.

## Layout

```
src/
  data/           model, seed, search (copied unchanged from the web editor), pure writes, store
  shell/          key layers, view stack, frame, palette, overlay, confirm, toast
  ui/             theme, key labels, list and its cursor state, end-ellipsis fitting
  views/          thoughts list, inspector, form; dataset picker and list; markdown blocks
```

One rule carries the whole keyboard: the newest mounted key layer owns the keys (`shell/keyboard.ts`).
A view declares its actions once (`shell/action.ts`), and the frame turns them into the action
menu, help, the footer's primary action, and key bindings.

## What it showed

Non-blank lines, tests excluded: **about 2,200 here against about 3,000 in the web editor**. The
web editor also has dataset create and edit forms, a root command list, IndexedDB persistence, and
offline install, so feature for feature the saving is closer to 15 to 25 percent. Most of it is the
web editor's 500 lines of CSS; the views and shell are each about a quarter shorter.

- **Cheaper:** no stylesheet and no box model to tune. Spacing is whole cells, colour is a prop,
  and once a row fits it cannot drift by a pixel. The layout bugs met here were all found by
  reading a text dump of the screen.
- **Not cheaper:** behaviour (actions, selection, forms, confirmations) costs the same lines as on
  the web; it is the same React.
- **New costs:** OpenTUI is pre-1.0. Its `truncate` elides the middle, so rows trim themselves
  (`ui/text.ts`); padding is ignored on `<text>`, so padded text needs a wrapping box; overlays
  need explicit sizes. Rows are one line, typography is the terminal's font at one size, and Cmd
  keys never reach the app, hence vim keys.

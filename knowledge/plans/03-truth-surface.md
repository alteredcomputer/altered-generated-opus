# Plan 03 - Truth surface

**Status:** waiting. **Blockers:** plan 01 merged; a GitHub fine-grained personal access token
with `contents: write` on `alteredcomputer/altered-generated-opus` only, added to Vercel as
`TRUTH_GITHUB_TOKEN` (the owner creates it; agents never create credentials).

**Depends on:** 01. **Unblocks:** nothing structurally; it is the owner's daily tool.

## Outcome

On his phone, the owner opens `/dashboard/truth` and sees the knowledge base as cards: every
decision, every open question, the compass, the plans and their statuses, the outreach brief and
rubric. He taps a decision, edits the text, and saves. The save is a commit to `main` with his
name on it and a message he can read in the git log. He answers an open question in place, and the
answer lands as a new decision entry with the question removed, in one commit. Every agent that
starts afterwards reads what he wrote, because it is the same file they always read.

## Locked inputs

- D068 the truth surface is a generated web app now; its data stays in git (architecture stated
  there so it can be challenged). D063 direction-level memory is preserved at the source. D054
  editing happens on the dashboard. D006 mobile-first. D009 dynamic over hard-coded. D004 git
  writes are scoped to this repo. D077 less re-typing of conclusions.
- Prior-art A6: one source per fact. This plan exists so that decisions are never copied into a
  second store.

## Scope

1. `packages/truth`: a `Knowledge` service that reads and writes the files under `knowledge/`
   through the GitHub contents API, with conditional writes on the file's blob SHA so a stale edit
   fails rather than overwriting. A `Documents` model that parses each markdown file into
   addressable sections (heading-delimited: a `### D0xx` block, a `### Qxx` block, a plan step
   list) and serialises them back without altering anything outside the edited section.
2. Views under `/dashboard/truth`:
   - **Decisions**: list, filter by round, search; card view; edit in place.
   - **Open questions**: list; an "answer" action that writes the verdict into `decisions.md` as
     the next `D` number in the current round's section, removes the question, and commits both
     files together.
   - **Compass**: rendered read-only with an edit button per section.
   - **Plans**: the status table from `plans/README.md` and each plan's steps with their
     checkboxes; toggling a checkbox or changing a status is a commit.
   - **Files**: any other knowledge file, rendered, editable as a whole.
3. History: each card links to the file's history on GitHub; the app does not reimplement diffs.
4. Structured facts: `knowledge/data/*.json` for anything tabular the owner wants as a table (the
   KPI log moves here from `plans/README.md` if the owner prefers a table view; the offer facts
   from `apps/web/src/site/content.ts` do not, see plan 04). Rendered as tables, edited as forms
   generated from a declared schema per file.
5. Guard rails: the copy rules are enforced on save - an em dash is rejected with the position
   named; a decision without a verdict line is rejected. No silent rewriting (quality bar).

## Not in scope

Writing to any repo but this one. Editing code files. Reimplementing git history or diffs. A
chat interface over the knowledge base. Anything the product will eventually do (D016, D026).

## Design

- **Why git and not Postgres**: agents read these files every session as plain markdown; the owner
  wants to edit the same thing they read. A database copy would need a sync in both directions
  and would drift within a week (prior-art A6). Git also gives history, blame, and rollback with
  no code. The cost is the GitHub API's latency on save, which is acceptable for a tool used a few
  times a day.
- **Writes go to `main` directly.** A branch-and-merge flow would be theatre: the owner is the
  authority on the truth, and agents are told to start from a fresh `main` for exactly this
  reason. Each commit message names the section edited and the surface: for example
  `truth(decisions): edit D065 via dashboard`.
- **Conflicts**: a save carries the SHA it read. If `main` moved, the API returns 409 and the
  screen shows "this changed since you opened it" with a reload; the owner's text is preserved in
  the form. No merge attempt.
- **Section addressing** is by heading id, computed the way GitHub computes anchors, so links are
  stable and human-readable.
- **Authority**: every action behind `requireOperator()`. The token is a server-only
  `Redacted` config; it never reaches the client. Read-only rendering also goes through the
  server so no token or raw API response is exposed.
- **Runtime write approval**: a commit to this repo from the deployed app is a write to GitHub.
  It is inside the approved scope (`constraints.md`, full git write in this repo) and it is gated
  by operator identity rather than a kill switch, because the actor is the owner himself. Record
  this reading in `constraints.md` when the plan starts; if the owner disagrees, it becomes a
  Round question.

## Steps

1. `Knowledge` service: read file, list folder, write file with SHA, typed errors for not found,
   conflict, rate limit, and auth. Tests against recorded fixtures. Commit.
2. `Documents` parser and serialiser with a round-trip test on every file currently in
   `knowledge/`: parse then serialise must be byte-identical. Commit.
3. Decisions view, read-only, then edit. Commit.
4. Open questions view with the answer flow and the two-file commit. Commit.
5. Compass, plans, and files views. Commit.
6. Structured facts with schema-generated forms, starting with the KPI log if the owner wants
   it there. Commit.
7. Save-time copy rules. Commit.
8. Reconcile the feature graph, security pass, `state.md`, merge.

## Verification

- Round-trip test passes on every knowledge file.
- Editing a decision from a phone results in one commit on `main` whose diff touches only that
  section.
- A stale save is refused and the typed text is still in the form after reload.
- An em dash in an edit is refused with its position.
- A fresh agent session, started after an edit, reads the edited text with no extra step.

## Security pass specifics

- `TRUTH_GITHUB_TOKEN` is server-only, `Redacted`, absent from bundle, logs, and errors.
- All routes behind `requireOperator()`; there is no read-only public view.
- Rendered markdown is sanitised; the knowledge files are trusted authors today but the renderer
  must not become a script injection path if a source archive ever contains hostile text.
- Commit author is the operator's identity from the session, not a hard-coded name.

## Feature graph nodes

`truth` (root) with `truth-knowledge-service`, `truth-documents`, `truth-decisions-view`,
`truth-questions-view`, `truth-plans-view`, `truth-facts`, `truth-copy-rules`.

## Agent notes

- 2026-09-04 (planning agent): the owner floated an alternative, a markdown-in-Cursor workflow
  with query tables and diffs. This plan is the "hands on" version he preferred. If it proves
  heavier than expected, the fallback in D068 is typed constants plus scripts, not a database.

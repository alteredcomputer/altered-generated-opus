# Plan 02 - Outreach bench

**Status:** ready. Paste-in sourcing needs nothing new. Automatic sourcing needs `X_BEARER_TOKEN`
in Vercel once the owner opens a developer account and buys pay-per-use credits (Q53). Both
modes need `DATABASE_URL` and `OPENROUTER_API_KEY`, which exist in Vercel and are pulled with the
command in `constraints.md`.

**Depends on:** nothing for the first slice; plan 01 for the web review. **Unblocks:** the Sept 8
number.

## Outcome

The owner says, in a Cursor chat, "source fifty from @seed" or pastes twenty handles. The agent
runs the bench. Minutes later the chat shows a ranked list: handle, one-paragraph reasoning for
the score, and a drafted conversation opener for each. He replies with approvals, edits, and
declines. He copies each approved opener into X from his personal account (D070) and says "sent".
When replies come in he says "replied, interested" or "replied, no". Every one of those becomes a
row, and the daily KPI is a query, not a memory. Once plan 01 lands, the same review happens on
his phone at `/dashboard/outreach` with approve, edit, decline, copy, and mark-sent buttons.

## Locked inputs

- D043 outreach runs; D064 the Sept 8 checkpoint and daily KPIs; D066 friends do not count; D069
  sourcing, drafting, and review are built, sending is manual, revisit automation after fifty;
  D070 personal account sends, brand account is the fallback; D073 chat closes, not calls; D018
  the buyer and the disqualification list (Q51 may widen it; build the rubric as data so it can
  change without code); D019 outcome-led, never revenue; D003 no automated sends.
- The direction record's demand-test shape: fifty named humans, DMed as conversation openers, not
  pitches.

## Scope

1. `packages/outreach`: a feature package with four services - `Sourcing`, `Scoring`, `Drafting`,
   `Ledger` - over the tables below, plus a non-interactive CLI (`pnpm bench <command>`) that an
   agent runs on the owner's behalf and that prints phone-readable output for the chat.
2. Tables in `packages/db`: `sourcing_runs`, `prospects`, `prospect_posts`, `drafts`,
   `funnel_events` (append-only; stages per Q55, held as data so a definition change is a
   migration of a lookup, not a rewrite).
3. Sourcing modes:
   - **paste**: handles, or handles with pasted bio and recent-post text when there is no API.
   - **seed**: a seed handle, expand through `following` (who a good prospect follows is a better
     signal than who follows them), optionally `followers`, with a hard cap on users returned and
     a cost estimate printed before the first paid call.
   - **category**: recent-post search on locked keyword sets, authors collected and deduplicated.
4. Scoring: one model call per prospect reading bio and recent posts against a rubric stored in
   `knowledge/outreach-rubric.md` (qualify and disqualify criteria from D018, plus what the
   compass names as the buyer's pain). Output is a 0-100 score, a one-paragraph reasoning, and a
   list of disqualifiers hit. Reasoning is stored and shown; the owner fine-tunes the rubric file,
   not the code.
5. Drafting: one model call per prospect above `outreach.scoreThreshold`, reading the profile and
   `knowledge/outreach-brief.md` (intent, tonality, the one question the opener asks, what it
   never does). Output is one opener under X's DM length, first person, no link, no pitch, no
   price. Every draft stores model, prompt version, tokens, and cost.
6. Review, first slice: `pnpm bench review` prints the pending batch; `pnpm bench decide` records
   approve, decline, or an edited body per prospect; `pnpm bench sent <handle>` and
   `pnpm bench replied <handle> --interested|--not` write funnel events. Output is formatted for a
   phone: short lines, one prospect per block, no wide tables.
7. Review, second slice (after plan 01): `/dashboard/outreach` with the same actions and a copy
   button. Both slices call the same `Ledger` functions; neither contains logic of its own.
8. KPI: `pnpm bench kpi [date]` computes openers sent, interested replies, committed, and
   reserved from `funnel_events`. The dashboard home card reads the same query.
9. Budget: `outreach.dailyBudgetCents` in settings caps X plus model spend per day; a run that
   would exceed it stops before the paid call and says so.

## Not in scope

Sending anything. Posting. Any write to X other than reads. Instagram. Automated follow-ups.
Offering the bench as a product (direction record parking lot; same rule as D049).

## Design

- **X access** through the official v2 API with an app-only bearer token, pay-per-use. Followers
  and following lookups and user lookups bill at $0.01 per user returned (verified 2026-09-04;
  re-verify at build time). Use a maintained client library or plain `fetch` against the
  documented endpoints; do not scrape. Every paid call logs endpoint, count, and estimated cost,
  and increments the run's cost.
- **Rubric and brief are files, not prompts in code.** They live in `knowledge/` so the truth
  surface (plan 03) can edit them and so they are versioned with the decisions they derive from.
  The prompt template in code only assembles them with the profile.
- **Personal data stays out of git.** Prospects, bios, and drafts live only in Postgres. Nothing
  the bench produces is written into the repo except code, the rubric, and the brief.
- **Scoring is explainable or it is useless.** The reasoning paragraph is the product of this
  plan; a score without it is a bug. Store the model's raw output alongside the parsed fields.
- **Funnel stages** per Q55 (candidate, lead, qualified, committed, reserved, lost) plus the
  bench's own pre-lead states (candidate, approved, declined, sent). A prospect becomes a lead on
  first reply. Stage transitions are events with a reason; current stage is derived, not stored.
- **Internal traffic cannot contaminate the numbers** (D058): the owner's own handles and any
  handle listed in `outreach.excludedHandles` are refused at sourcing.
- **Friends are flagged, not excluded**: `pnpm bench flag <handle> --friend` marks a prospect so
  the KPI query can report strangers separately (D066).

## Steps

1. Add the tables and migration in `packages/db` (create the package if plan 01 has not; follow
   its design exactly so the two merge cleanly). Commit.
2. Write `knowledge/outreach-rubric.md` and `knowledge/outreach-brief.md` from the locked
   decisions and the compass. Both are drafts until the owner has read three real outputs; say so
   at the top of each. Commit.
3. `Sourcing`: paste mode first, then seed and category behind the X client, with the cost
   estimate and the budget check. Tests for deduplication, exclusion, and the budget refusal.
   Commit.
4. `Scoring` with the AI SDK through OpenRouter, model name from settings, structured output
   parsed and validated, raw output stored. Test the parser on a malformed response. Commit.
5. `Drafting`, same shape, with the length guard: too long is a retry with the length named, never
   a truncation (prior-art A2). Commit.
6. `Ledger`: approve, decline, edit, sent, replied, flag, and the KPI query. Tests for the stage
   derivation and the KPI counts. Commit.
7. The CLI: one file per command, one shared output formatter. Add `bench` to the root
   `package.json` scripts. Commit.
8. Run a real batch against the pulled development environment on whatever mode the credentials
   allow. Show the owner the first three drafts in chat before anything else. Record his edits as
   changes to the brief, not to the code. Commit.
9. If plan 01 is merged: the dashboard review screen. Otherwise leave a note and stop here.
10. Reconcile the feature graph, run the security pass, update `state.md` and the KPI log in
    `plans/README.md`, merge.

## Verification

- `pnpm check` and `pnpm build` pass.
- A run with an unset `X_BEARER_TOKEN` in seed mode fails before any call with a message naming
  the variable; paste mode works without it.
- A run whose estimate exceeds the daily budget stops before the first paid call.
- Every draft in the batch is under the DM length and contains no link, no price, and no product
  name unless the brief allows it.
- The KPI query for today matches a hand count of the events written during the test.

## Security pass specifics

- The bearer token is `Redacted`, never logged, never in an error message.
- Prompt injection: a prospect's bio and posts are untrusted input to the scoring and drafting
  prompts. The template places them in a clearly delimited data block and instructs the model to
  treat them as content, never instructions; the parser rejects any output that is not the
  expected shape. Test with a bio that contains an instruction.
- Nothing in this plan sends anything. Confirm there is no code path that calls a write endpoint
  on X.
- Dashboard review (slice two) is behind `requireOperator()` from plan 01.

## Feature graph nodes

`outreach` (root) with `outreach-sourcing`, `outreach-x-client`, `outreach-scoring`,
`outreach-drafting`, `outreach-ledger`, `outreach-cli`, `outreach-review-screen`; `data-layer`
additions for the tables; `governance-knowledge-base` gains the rubric and brief as sources or
they get their own `outreach-brief` node. Controls: `outreach.scoreThreshold`,
`outreach.dailyBudgetCents`, `outreach.excludedHandles`, `ai.model.scoring`, `ai.model.drafting`.

## Agent notes

- 2026-09-04 (planning agent): the owner does not run commands himself; the CLI exists so that an
  agent in a Cursor chat can run it and paste the output. Design the output for that: no colour
  codes, no interactive prompts, short lines. Interactive Clack review from the direction record
  is superseded by this for the same reason.
- 2026-09-04: legacy Basic and Pro X tiers are closed to new developers; pay-per-use is the only
  entry. Do not plan around a monthly subscription.

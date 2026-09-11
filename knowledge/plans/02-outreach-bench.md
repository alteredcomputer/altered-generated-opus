# Plan 02 - Outreach bench

**Status:** ready. Re-planned 2026-09-11 around D095: the owner does not scroll, paste, or type
sends. The system sources by scraping public Instagram data, scores, drafts, and queues; he
reviews and approves each send in a control panel. Sourcing, scoring, drafting, and the queue
need nothing beyond `DATABASE_URL` and `OPENROUTER_API_KEY`, which exist in Vercel and are pulled
with the command in `constraints.md`. The physical send step waits on Q65; paid scraping services
wait on Q67; both have safe defaults below. X sourcing through Zernio's pass-through remains a
later, gated mode.

**Depends on:** nothing for the first slice; plan 01 for the web control panel. **Unblocks:** the
Sept 14 number.

## Outcome

The owner says "run sourcing" in a chat (or later taps it in the dashboard). The system expands
from seed accounts - creators he named and accounts he follows - collects candidate profiles,
scrapes bios, recent posts, and reel transcripts where useful, scores each against the rubric,
drafts an opener for each above threshold, and presents a ranked review batch: profile summary,
score with one-paragraph reasoning, the draft. He approves, edits, or declines each. Approved
openers land in a send queue. Until Q65 closes, sending is one-tap manual: each queued item gives
him the text on his clipboard and the profile link; he pastes and sends from his personal
account and the queue records it. Replies he reports (or, after plan 06, Zernio webhooks) become
funnel events, and the daily KPI is a query, not a memory.

## Locked inputs

- D095 the machine: automated sourcing, control-panel approval, no scrolling, no automation
  logged in as his personal account, paste-in demoted to fallback. Seeds: @inducingchaos's
  following, Dan Koe, Alex Hormozi, Zach Kravitz, and similar; the Dan Koe-style audience leads.
- D043 outreach runs; D064, D085, D091 the Sept 14 checkpoint (leads and validation) and daily
  KPIs; D066 friends flagged, not counted; D069 HITL approval per send, automation of sending
  revisited after fifty (now Q65's option c); D070 and D083 his accounts hold the conversations,
  Instagram first; D073 chat closes; D081 the buyer and D018's disqualification list, held as
  data in the rubric; D019 outcome-led, never revenue; D003 no send without his explicit
  approval, ever.
- Platform facts (verified 2026-09-11): the official API cannot start an Instagram conversation;
  Zernio handles replies inside Meta's 24-hour window; public viewers are Cloudflare-gated
  against plain fetches but pass with a real headless browser; grey-market senders exist with
  real account risk (Q65 option b, burner accounts only).
- The offer the opener eventually leads to is `knowledge/offer.md`.

## Scope

1. `packages/outreach`: a feature package with five services - `Sourcing`, `Scraper`, `Scoring`,
   `Drafting`, `Ledger` - plus a non-interactive CLI (`pnpm bench <command>`) that an agent runs
   on the owner's behalf and that prints phone-readable output for the chat.
2. Tables in `packages/db`: `sourcing_runs`, `prospects`, `prospect_posts`, `drafts`,
   `send_queue`, `funnel_events` (append-only; stages per Q55, held as data so a definition
   change is a migration of a lookup, not a rewrite).
3. Sourcing modes:
   - **scrape** (primary): expand from seed handles held in `outreach.seedHandles`. Candidate
     discovery uses whatever public surface yields: followers and following where a public
     viewer exposes them, engagers on seed accounts' recent posts (likers and commenters),
     and suggested or related accounts. For each candidate: handle, bio, follower count, recent
     captions; reel transcripts pulled through public transcript tools when captions are thin.
   - **paste** (fallback): the Round 6 loose-text parser stays; anything he happens to paste is
     scored the same way.
   - **seed** and **category** (X only, later): unchanged, gated behind `outreach.xSourcingEnabled`.
4. `Scraper`: a Playwright-driven headless browser service. Talks only to public, logged-out
   surfaces: instagram.com public pages where they render logged-out, public viewer sites, and
   transcript tools, rotating between them on failure. Global rate limit from
   `outreach.scrapeDelayMs`, per-run page cap from `outreach.scrapeMaxPages`, every fetch logged
   with source and outcome. **It never holds, asks for, or stores a login of any kind** - that
   is the hard line D095 draws; a surface that demands login is skipped, not defeated. If Q67
   approves a paid scraping API, it becomes an alternative fetch backend behind the same
   interface, named in `constraints.md` on first use.
5. Scoring: one model call per prospect reading bio, posts, and any transcript against
   `knowledge/outreach-rubric.md` (qualify and disqualify criteria from D018 and D081, plus the
   compass's pains). Output: 0-100 score, one-paragraph reasoning, disqualifiers hit. Reasoning
   is stored and shown; the owner fine-tunes the rubric file, not the code.
6. Drafting: one model call per prospect above `outreach.scoreThreshold`, reading the profile
   and `knowledge/outreach-brief.md`. One opener under the DM length, first person, no link, no
   pitch, no price; may reference a specific recent post, which is the native way a stranger's
   DM gets read. Every draft stores model, prompt version, tokens, and cost.
7. Review and the send queue, first slice: `pnpm bench review` prints the pending batch;
   `pnpm bench decide` records approve, edit, or decline; approving enqueues.
   `pnpm bench queue` lists queued sends with the text and profile URL ready to copy;
   `pnpm bench sent <handle>` and `pnpm bench replied <handle> --interested|--not` write funnel
   events. Output is phone-readable: short lines, one prospect per block, no wide tables.
8. Review, second slice (after plan 01): `/dashboard/outreach` - the control panel D095
   describes - with profile card, reasoning, editable draft, approve and decline, and a send
   button whose behaviour follows Q65 (copy-and-open until then). Both slices call the same
   `Ledger` functions; neither contains logic of its own.
9. KPI: `pnpm bench kpi [date]` computes openers sent, interested replies, committed, and
   reserved from `funnel_events`. The dashboard home card reads the same query.
10. Budget: `outreach.dailyBudgetCents` caps model plus paid-scraping spend per day; a run that
    would exceed it stops before the paid call and says so.

## Not in scope

Automated sending of any kind (Q65; even option c's later automation is a separate approved
build on a burner account). Posting. Any write to X. Automated follow-ups. Offering the bench as
a product.

## Design

- **The personal-account line is absolute.** The scraper works logged out; the send queue's
  manual mode is the only thing that touches his account, through his own fingers. If Q65 lands
  on option b or c, the automation runs on a dedicated account that is not @inducingchaos, and
  that build gets its own approval and kill switch (`outreach.autoSendEnabled`, default off).
- **Scraping is best-effort by design.** Public surfaces change and block; the scraper treats
  every source as unreliable, records what failed, and reports partial results honestly rather
  than retrying into a ban. A day where scraping yields five good candidates instead of fifty is
  a working day, not an error. The owner approved scraping public data explicitly (D095, source
  archive 2026-09-11); it stays within logged-out, publicly visible surfaces.
- **Rubric and brief are files, not prompts in code**, in `knowledge/`, versioned with the
  decisions they derive from.
- **Personal data stays out of git.** Prospects, bios, transcripts, and drafts live only in
  Postgres.
- **Scoring is explainable or it is useless.** The reasoning paragraph is the product; store the
  raw model output alongside the parsed fields.
- **Funnel stages** per Q55 plus pre-lead states (candidate, approved, declined, queued, sent).
  A prospect becomes a lead on first reply. Transitions are events with a reason; current stage
  is derived, not stored.
- **Internal traffic cannot contaminate the numbers** (D058): his own handles and
  `outreach.excludedHandles` are refused at sourcing. **Friends are flagged, not excluded**
  (D066): `pnpm bench flag <handle> --friend`.
- **X access**, when enabled, is unchanged from the Round 6 plan: Zernio pass-through at X's
  rates, every paid call logged with cost.

## Steps

1. Tables and migration in `packages/db` (create the package if plan 01 has not; follow its
   design exactly so the two merge cleanly). Commit.
2. `knowledge/outreach-rubric.md` and `knowledge/outreach-brief.md` from the locked decisions
   and the compass, marked draft until the owner has read three real outputs. Commit.
3. `Scraper` with two or three public sources behind one interface, rate limiting, and honest
   partial-result reporting. Verify logged-out reachability of each source from the deploy
   environment, not just the dev VM. Commit.
4. `Sourcing`: scrape mode over the scraper, paste mode from Round 6, X modes as gated stubs.
   Seed handles start as the named creators; pulling @inducingchaos's following automatically is
   attempted, and if no public surface exposes it, the fallback is asking him once for a
   screenshot or export, recorded in the notes. Commit.
5. `Scoring`, structured output parsed and validated, raw output stored, malformed-response
   test. Commit.
6. `Drafting` with the length guard: too long is a retry with the length named, never a
   truncation (prior-art A2). Commit.
7. `Ledger` and the send queue: approve, decline, edit, queue, sent, replied, flag, KPI. Tests
   for stage derivation and KPI counts. Commit.
8. The CLI: one file per command, one shared formatter. Commit.
9. Run a real sourcing run from the seed handles. Show the owner the first three scored
   profiles and drafts in chat before anything else. His edits change the brief, not the code.
   Commit.
10. If plan 01 is merged: the control panel screen. Otherwise leave a note and stop here.
11. Reconcile the feature graph, security pass, `state.md` and the KPI log in `plans/README.md`,
    merge.

## Verification

- `pnpm check` and `pnpm build` pass.
- The scraper, pointed at a seed account, returns candidates with bios on at least one source,
  and reports cleanly when all sources fail.
- No code path stores or transmits a credential for any Instagram account.
- X modes refuse cleanly while `outreach.xSourcingEnabled` is false.
- A run whose estimate exceeds the daily budget stops before the first paid call.
- Every draft in the batch is under the DM length with no link, no price.
- The KPI query for today matches a hand count of the events written during the test.

## Security pass specifics

- The OpenRouter token is `Redacted`, never logged, never in an error message.
- Prompt injection: bios, captions, and transcripts are untrusted input. The template delimits
  them as data, the parser rejects unexpected shapes, and there is a test with a bio containing
  an instruction.
- Nothing in this plan sends anything anywhere. Confirm there is no code path that calls a write
  endpoint on any social platform, and no login flow exists in the scraper.
- Scraped personal data is publicly visible data, but it is still personal: it stays in
  Postgres, never in logs above debug, never in git.
- Dashboard control panel (slice two) is behind `requireOperator()` from plan 01.

## Feature graph nodes

`outreach` (root) with `outreach-sourcing`, `outreach-scraper`, `outreach-x-client`,
`outreach-scoring`, `outreach-drafting`, `outreach-ledger`, `outreach-cli`,
`outreach-review-screen`; `data-layer` additions for the tables. Controls:
`outreach.seedHandles`, `outreach.scoreThreshold`, `outreach.dailyBudgetCents`,
`outreach.excludedHandles`, `outreach.xSourcingEnabled`, `outreach.scrapeDelayMs`,
`outreach.scrapeMaxPages`, `outreach.autoSendEnabled`, `ai.model.scoring`, `ai.model.drafting`.

## Agent notes

- 2026-09-04 (planning agent): the owner does not run commands himself; the CLI exists so that
  an agent in a Cursor chat can run it and paste the output. No colour codes, no interactive
  prompts, short lines.
- 2026-09-04: legacy Basic and Pro X tiers are closed to new developers; pay-per-use is the only
  entry.
- 2026-09-07 (planning agent): re-planned Instagram-first after D083. Reading Instagram replies
  through Zernio belongs to plan 06; the bench records what the owner reports.
- 2026-09-11 (planning agent): re-planned around D095. Paste-in demoted to fallback; the
  `Scraper` service and the send queue added; the "do not scrape" line from the Round 6 plan is
  superseded by the owner's explicit directive, with the personal-account line kept absolute.
  Verified the same day: official API cannot cold-DM (Zernio docs), public viewers pass only
  with a real browser (imginn returned a Cloudflare JS challenge to a plain fetch).

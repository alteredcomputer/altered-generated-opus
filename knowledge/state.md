# Current state

Updated 2026-09-15. Read this first, then `decisions.md`, `compass.md`, `offer.md`,
`plans/README.md`, `open-questions.md`, `direction-record.md`, `macro-plan.md`,
`feature-graph.md`, `prior-art.md`, `constraints.md`, `product-primitives.md`,
`design-reference.md`.

## Where the project stands

**Round 8 (2026-09-15) is the generation flip.** Recorded as D100 to D111; archived verbatim in
`sources/chats/2026-09-15-round-8-the-generation-flip.md`. The structural changes:

- **The MVP is generated (D100).** The Koa product buyers touch is built by agents in this repo
  under binding guardrails, with an escalation ladder (generate, correct, hand-coded primitive,
  thinnest slice) and an inverted challenge protocol: concerns about generation get fixed before
  any flip back to hand code. The hard wall around `usealtered/altered` stands untouched; the
  hand-written core is the long-term V1 with data migrating by transform. AGENTS.md is amended.
- **The outbound-only runway is scrapped (D101).** Full interactive Koa - persistent vector
  memory, self-scheduled reach-outs by agent judgment, no fixed cadence - ships on the paid
  Sendblue number. Plan 08 (`plans/08-koa-mvp.md`) carries the proposed six-phase scope.
- **The close is the full $12,500 (D102).** No reservation framing. Financing via an accredited
  provider once Stripe works; $2,500 is the hidden floor tier (same product, no one-to-one),
  never mentioned unless full price and financing both fail. Paying in full earns priority, not
  extras (D106).
- **The funnel is inbound-led (D103, D104):** every call to action is "text Koa";
  `altered.computer/go` opens the thread; Koa sells at about half lean until the wall (Q70
  open); outbound Instagram openers stay manual from his personal account.
- **Model and cost governance (D107),** now in AGENTS.md: explicit models always, Opus 5 minimum
  for coding, Fable 5 only with explicit approval, Sonnet-class for proceduralised light tasks
  (D105, $25 sourcing budget), roughly 300k context then summarise or restart, save every turn,
  series execution, cost reported against progress.
- **The checkpoint is Sept 17 (D108):** meaningful lever-moving action. He moves into the new
  apartment Sept 16. Honest financial runway: roughly end of December.
- **Standing response format (D109):** every chat turn ends with his TODO list, then a deployed
  assets list.
- **Content (D110):** he is the demonstration user (his own Koa, screen recordings, talking
  head); client 1 is the feedback loop, not public content. The "Video content strategy" chat
  (id `bc-01a0937b-4169-7495-a3a5-d4647fd8e3a9`) holds his @inducingchaos transcripts for the
  content plan.

Round 9 (Q69 to Q75) is asked - the last round before generation: MVP scope confirmation, the
wall design, the standing monthly burn and Sendblue timing, pre-purchase access policy, public
naming of the early build, the weekly generation budget, and the interim page. After the
answers, the flow becomes generate-answer cycles: a build slice between every Q&A round, in
series, fresh-context subagents on explicit models.

Live at `generated.altered.computer`, deployed from `main`, not indexed. The landing page still
shows the **retired** $100/$499 offer; Q75 proposes a minimal interim page pointing at the
thread. Eight plans exist; plan 08 (Koa MVP) leads the order. The feature graph passes with the
new `koa` node planned.

## What is blocking

- **Round 9 answers** gate plan 08's go signal (scope Q69, wall Q70, Sendblue Q71, access Q72)
  and the interim page (Q75). Phase 1 can build against a mock Sendblue adapter regardless.
- **Sendblue credentials** gate the loop going live; **Neon database** provisioning comes with
  plan 08 phase 1 (the data-layer slice it needs).
- **Owner actions** are listed in `open-questions.md` under "Waiting on the owner"; the plan-08
  items lead now.
- **Copy approval** before any page is indexed (plan 04).

## What can proceed without answers

Plan 08 phase 1 against the mock adapter (webhook shape, store, agent turn, CLI conversation,
allowlist, kill switches) - everything except the live line. Plan 07's script and run-sheets.
Plan 02's sourcing procedure inside the $25 budget (D105).

## Working notes for a fresh session

- **Always branch from a freshly fetched `origin/main`.** A restarted session can resume with an
  older branch checked out; cutting from it silently reverts merged work. This has happened once.
- **Pick up a plan by the protocol in `plans/README.md`.** Set status before coding; append dated
  notes when something meaningful happens; a blocker is a status change plus a chat question.
- **Pull environment values** with the Vercel CLI command in `constraints.md`. The REST API returns
  ciphertext even with `decrypt=true`. The file must live at `apps/web/.env.local`.
- **Run the site locally** with `cd apps/web && pnpm exec next dev`.
- **Next 16 writes its own `AGENTS.md` and `CLAUDE.md`** into the app directory unless
  `agentRules: false` is set in `next.config.ts`. It is set. Do not remove it: a nested instruction
  file would dilute the operating contract.
- **Verify claims about the rendered page with the browser console**, not with screenshots.
  `document.fonts.check` and a glyph-width measurement both proved the font was loading when a
  subagent's screenshot said otherwise.
- **Recovering an unreachable Cursor chat:** `GET https://api.cursor.com/v0/agents/{id}/conversation`
  with the `READ_ONLY__CURSOR_TOKEN` bearer works regardless of scope. That is how the Aug 16-24
  chat was recovered.
- **The org rename is transparent to git:** the existing remote URL redirects, and this clone
  already points at `alteredcomputer/altered-generated-opus`.
- **X API is pay-per-use only for new developers** (verified 2026-09-04): $0.01 per user returned
  on follower, following, and user lookups; legacy Basic and Pro are closed to new signups.
  Zernio passes these through at cost (verified 2026-09-07).
- **Instagram has no cold-DM API, re-verified 2026-09-11 against Zernio's own docs** after the
  owner believed otherwise: the send endpoint requires a recipient-scoped id that only exists
  once the user messages first, on any account type; Zernio's 10,000 free monthly messages are
  replies inside Meta's 24-hour window (plus the HUMAN_AGENT support tag to 7 days). Cold
  sending exists only through grey-market browser-automation tools (Slide Cold, InstaOutreach)
  with real suspension risk - their own copy says to use accounts you can afford to lose.
- **Public Instagram data is scrapeable with a real browser, not with plain fetches** (verified
  2026-09-11): imginn returned a Cloudflare JS challenge to a fetch; a headless browser passes.
  Reel transcripts come from public transcript tools the same way. Sourcing therefore needs
  Playwright, and the owner has explicitly approved scraping public surfaces (D095) - logged
  out only, never as his account.
- **Write questions in full sentences.** He said Q60's brevity made it hard to understand;
  phone-readable means short lines, not clipped grammar.
- **Sendblue mechanics from his own account of the docs (2026-09-15, to verify against Sendblue
  before building):** replies are free within 24 hours of the person's last message; messages
  beyond that window count against a 150-per-day follow-up cap; the first message of any thread
  must be inbound; the line costs about $100 USD a month; FaceTime features need a sales call.
- **Concurrency prior art:** the previous attempt's iMessage concurrency failure was first an
  observability failure - no event data existed to diagnose duplicate sends. Plan 08 designs the
  event ledger in phase 1. His Redis interrupt-and-continue sketch is recorded in D111 as design
  input, not a commitment.

## Verified facts

Berkeley Mono Variable: 644 glyphs, fixed pitch, all advances 600 per 1000 units, axes `wght`
100-900, `wdth` 60-100, `slnt` -16-0. Loads and renders as true monospace in the browser.

Registry as of 2026-08-15: `effect` rc 4.0.0-rc.109, `ai` 7.0.63, `next` 16.3.0, `drizzle-orm` rc
1.0.0-rc.4, `@biomejs/biome` 2.5.8, `turbo` 2.10.10. TypeScript pinned at 5.9.3 though 7.0.2 exists.

Registry as of 2026-09-04, for the plans: `drizzle-orm` 0.45.2 (latest stable; the 1.0 line is
still a release candidate), `drizzle-kit` 0.31.10, `@neondatabase/serverless` 1.1.0, `better-auth`
1.7.2, `ai` 7.0.92, `@openrouter/ai-sdk-provider` 3.0.0, `vitest` 5.0.0. Re-verify before pinning.

Effect v4 API notes, verified against the installed source: services live in `Context` via
`Context.Service<Self, Shape>()("Key")`. `Config.literals` takes the array first, the name second.
`Config.redacted(name)` accepts an empty string, so secrets are built as
`Config.nonEmptyString(name).pipe(Config.map(Redacted.make))` to stay fail-closed. `Config.option`
wraps a config so absence is an `Option` rather than a failure. `Logger.layer([...])` installs
loggers.

Node 22 provides `path.matchesGlob` and `--experimental-strip-types`, which is how the graph check
runs with no build step and no glob dependency.

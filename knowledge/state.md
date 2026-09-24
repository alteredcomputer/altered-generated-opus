# Current state

Updated 2026-09-24 (after plan 04 interim step). Read this first, then `decisions.md`, `compass.md`,
`offer.md`, `plans/README.md`, `open-questions.md`, `direction-record.md`, `macro-plan.md`,
`feature-graph.md`, `prior-art.md`, `constraints.md`, `product-primitives.md`,
`design-reference.md`.

## Where the project stands

**Round 9 (2026-09-24) starts generation.** Recorded as D112 to D123; archived verbatim in
`sources/chats/2026-09-24-round-9-back-from-the-move.md`. Nine days of silence for the move, then
every Round 9 answer in one message:

- **Scope confirmed (D112):** plan 08's six phases, in order, plus iMessage voice notes saved
  as source data and transcribed from day one.
- **The wall is a threshold, not a feature gate (D113):** free Koa is the full product, memory
  and reach-outs included; time, cost, or milestone gates it. Never a crippled free version.
- **Burn approved, Sendblue live when phase 1 deploys (D114).** Sendblue, Neon, Redis, and
  OpenRouter values are already present in the Vercel development environment (names-only
  check). Whether the Sendblue subscription is active is his to confirm.
- **Access (D115):** allowlist, then invited warm prospects, then public.
- **Label (D116):** "Koa - early access"; the generated disclosure stays on purpose.
- **Budget (D117):** about $100 a week while the MVP generates, then about $50.
- **Interim page (D118):** strip price and date now, monochrome palette (no blue tint), keep a
  short explainer, refine toward minimal. Plan 04's interim step is specified.
- **Context cap 150k (D119); Opus 5.5 for all subagents (D124).** AGENTS.md updated.
- **Checkpoint (D120):** Oct 10, first payment collected. Markers Sept 28 (Koa live for him)
  and Oct 1 (outreach daily). Oct 15 stays the floor decision; November rent is $1,600 before
  student funding lands Nov 5 to 10.
- **Outreach is the primary lead channel (D121);** the bench gets a send-time tracker.
- **The hand-coded mirror is part of what $12,500 buys (D122);** `offer.md` states three things.
- Challenges logged, not acted on (D123): the hand-coding pull, B2B automation, ALTERED RAW.

Round 10 (Q76 to Q83) is asked: Koa's first reply, the onboarding intents, the threshold
numbers, behaviour past the wall, the interim explainer's sections, which number, outreach
pacing, and the HITL surface. Phase 1 builds with fail-closed placeholders for all of them.

**Plan 08 phase 1 (the loop) is done** (2026-09-24). A verified Sendblue webhook persists every
inbound, an empty allowlist refuses everyone, voice notes are saved and transcribed, one agent
turn replies through OpenRouter, and every step lands in the event ledger. Sending stays off:
`OUTBOUND_ENABLED` and `koa.sendEnabled` are both false, so a live inbound today is stored and
skipped. Proven by CLI conversation on the dev database and a local run of the route. Phase 2
(memory) is next. Live at `generated.altered.computer`, deployed from `main`, not indexed.

**Plan 04's interim page step is done** (2026-09-24, D118). The live page no longer shows the
retired offer: no price, no date, no deliverables. It shows the interim page - headline, what Koa
is, a "Text Koa" button under "Koa - early access" opening the `sms:` link to
`SENDBLUE_PHONE_NUMBER`, who it is for, and the generated-and-disclosed footer - on a zero-chroma
monochrome palette with the amber accent untouched (Q39). The explainer is existing traced copy
only, pending Q80; plan 04's full rewrite (steps 1 to 6) waits on Q80 and copy review.

## What is blocking

- **Sendblue subscription confirmation** (D114) gates the loop going live. Going live also
  needs: the production deploy of phase 1, migrations applied to the database the deploy uses,
  the webhook secret configured in Sendblue matching `SENDBLUE_SIGNING_SECRET`, the owner's number
  on `koa.allowlist`, then both switches on. None of that is done; each is an owner approval.
- **No real voice note has been transcribed yet.** If Sendblue delivers `.caf`, OpenRouter
  refuses it and the ledger records the error; the first real one decides whether conversion is
  needed.
- **Round 10 answers** gate anyone outside the allowlist texting Koa (Q76 to Q79, Q83) and the
  interim explainer's section set (Q80).
- **Owner actions** are listed in `open-questions.md` under "Waiting on the owner".

## What can proceed without answers

Plan 08 phases 1 to 4 in full (the loop, memory, scheduling, concurrency and the ledger) with the
allowlist closed. Plan 02's send-
time tracker and sourcing procedure inside the $25 budget (D105). Plan 07's script and run-sheets.

## Working notes for a fresh session

- **Koa and database commands** (run from the repo root; they read `apps/web/.env.local`, and a
  missing value fails loudly): `pnpm run db migrate` applies committed migrations;
  `pnpm run db settings list|get <key>|set <key> <json>|seed`; `pnpm run koa chat --as <E.164>
  [--say "text"]` talks to Koa through the real pipeline with the mock messenger (the number must
  be on `koa.allowlist` first, and should be removed after); `pnpm run koa ledger --person
  <E.164>` prints every event. Use `pnpm run`, not the `pnpm db` shorthand, which pnpm rejects.
- **Schema changes:** edit `packages/db/src/schema.ts`, then `pnpm --filter @opus/db generate
  --name <what>`, commit the SQL and the snapshot, then `pnpm run db migrate`. Never edit an
  applied migration.
- **The app bundler cannot see `new URL(..., import.meta.url)` to a directory.** That is why the
  migration runner lives in `packages/db/src/migrate.ts`, which the app never imports.

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
  subagent's screenshot said otherwise. Headless Chrome is at `/usr/local/bin/google-chrome`;
  drive it over the DevTools protocol (Node 22's global `WebSocket`) to read `getComputedStyle`
  at 390px and desktop in both colour schemes. Chrome reports the oklch neutrals as `lab(...)`;
  zero chroma shows as a and b of 0 (or float noise around 1e-5).
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

# Current state

Updated 2026-09-07. Read this first, then `decisions.md`, `compass.md`, `offer.md`,
`plans/README.md`, `open-questions.md`, `direction-record.md`, `macro-plan.md`,
`feature-graph.md`, `prior-art.md`, `constraints.md`, `product-primitives.md`,
`design-reference.md`.

## Where the project stands

Live at `generated.altered.computer`, deployed from `main`, not indexed. The application builds
and runs. The landing page still shows the **retired** $100/$499 offer and the Nov 5 deliverables
as a promise; plan 04 is `ready` to replace it from `offer.md`, and an interim one-line change is
proposed in that plan pending the owner's word.

Round 6 was answered on 2026-09-07 and recorded as D078 to D087; the message is archived
verbatim in `sources/chats/2026-09-07-round-6-and-the-build-slot.md`. The offer is now fixed and
stated in full in `offer.md`:

- One custom build slot, one offer, no tiers. Weekly sessions, six to twelve months, one to ten
  clients. $2,500 deposit toward $12,500.
- Deposit week: onboarding inside 24 hours, a hand-built care package, the Koa runway (his,
  hand-written, outbound-only), a personal "1/10" page when scoped.
- No hard product date; soft "Est. November". The buyer is the solo hyper-committed builder,
  technical or not. Instagram first, through Zernio; sourcing and first messages are manual there
  by Meta's rule. The room is iMessage. The checkpoint is Sept 14.
- The long-form video is the primary informer; script generated, shoot his.

Round 7 (Q56 to Q62) is asked: balance timing, refund timing under no date, care package
contents and budget, video timing, how much of his hands go to code before the first deposit,
runway cadence, personal page timing.

Seven plans exist. Three are `ready` with no owner action needed: 02 outreach bench (Instagram
paste-in), 04 offer and page, 07 offer assets. The feature graph passes: 40 nodes, every file
accounted for.

## What is blocking

- **Round 7 answers.** Plans 04 and 07 proceed with placeholders for Q56 and Q57; plan 05's
  balance schedule and plan 07's package and page wait.
- **Owner actions**, in `open-questions.md` under "Waiting on the owner": Resend plus
  `OPERATOR_EMAILS` (plan 01), Zernio with his Instagram connected (plan 06), a GitHub
  contents-write token (plan 03), an interim payment link (plan 05), Autumn (plan 05).
- **Copy approval** before the page can be indexed (plan 04).

## What can proceed without answers

Plans 02, 04, and 07 in full, minus the gated parts each names. Plan 01 up to the point where a
real login must be tested.

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
- **Instagram has no sourcing or cold-DM API** (verified 2026-09-07): Meta exposes no follower
  lists of other accounts, no user search, and only allows API replies within 24 hours of the
  user's last message. Zernio reads and sends Instagram DMs inside that rule; first two connected
  accounts free.
- **The Instagram reel he linked is not fetchable** without a login. Ask him to paste a
  transcript if his content is needed as source material.

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

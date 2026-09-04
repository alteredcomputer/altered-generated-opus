# Current state

Updated 2026-09-04. Read this first, then `decisions.md`, `compass.md`, `plans/README.md`,
`open-questions.md`, `direction-record.md`, `macro-plan.md`, `feature-graph.md`, `prior-art.md`,
`constraints.md`, `product-primitives.md`, `design-reference.md`.

## Where the project stands

Live at `generated.altered.computer`, deployed from `main`, not indexed. The application builds
and runs. The landing page still shows the **retired** $100/$499 offer and the Nov 5 deliverables
as a promise; plan 04 replaces it once Round 6 lands, and an interim one-line change is proposed
in that plan pending the owner's word.

Round 5 was answered on 2026-09-04 and recorded as D064 to D077. The owner's message is archived
verbatim in `sources/chats/2026-09-04-offer-reshaping-and-generation-first.md`. Headlines:

- Layer 1 is now the founding program: three to eight seats, $1,000 deposit (agent pick from his
  list), anchored at $12,500 for a service-related offer. What the $12,500 buys is open (Q49).
- Golden rule: no hand-written code until there are sales. The core stays his, afterwards.
- Generation-first, plans-first. Six end-to-end plans exist in `knowledge/plans/`. The owner opens
  a fresh chat per plan and says "next" or "finish". He user-tests; he does not review code.
- Sept 8 is a money checkpoint: minimum one named commitment with a date, target one paid deposit.
- Tagline locked: "Knowledge orchestration infrastructure. Never lose your best thinking again."
- Sell in chat; the human-in-the-loop sales desk is the long-term shape. Personal X account
  sends outreach; the bench sources, scores, drafts, and reviews; sending is manual.
- Truth surface is a generated web app whose data stays in git (D068).

The feature graph is enforced and passes: 39 nodes, every file accounted for. The six workstreams
exist as `planned` roots; each plan names the children it will add.

## What is blocking

- **Round 6 answers** (asked 2026-09-04): Q49 what the $12,500 buys, Q50 what arrives at deposit,
  Q51 buyer width, Q52 the product date rule under the golden rule, Q53 X API credits, Q54 the
  room, Q55 funnel stage definitions. Full text in `open-questions.md`. Plans 04 and 05 wait on
  these.
- **Owner actions**: Resend credentials plus `OPERATOR_EMAILS` in Vercel (plan 01); a GitHub
  contents-write token for this repo (plan 03); X developer credits if Q53 says so (plan 02
  auto-sourcing); Autumn (plan 05); an interim payment link he creates (plan 05, Sept 8 path).
- **Copy approval** before the page can be indexed (plan 04, Round 7).

## What can proceed without answers

Plan 02, paste-in slice, in full: tables, rubric and brief drafts, scoring, drafting, ledger, CLI.
Plan 01 up to the point where a real login must be tested. Both are marked accordingly in
`plans/README.md`.

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

## Verified facts

Berkeley Mono Variable: 644 glyphs, fixed pitch, all advances 600 per 1000 units, axes `wght`
100-900, `wdth` 60-100, `slnt` -16-0. Loads and renders as true monospace in the browser.

Registry as of 2026-08-15: `effect` rc 4.0.0-rc.109, `ai` 7.0.63, `next` 16.3.0, `drizzle-orm` rc
1.0.0-rc.4, `@biomejs/biome` 2.5.8, `turbo` 2.10.10. TypeScript pinned at 5.9.3 though 7.0.2 exists.
Re-verify before pinning anything new.

Effect v4 API notes, verified against the installed source: services live in `Context` via
`Context.Service<Self, Shape>()("Key")`. `Config.literals` takes the array first, the name second.
`Config.redacted(name)` accepts an empty string, so secrets are built as
`Config.nonEmptyString(name).pipe(Config.map(Redacted.make))` to stay fail-closed. `Config.option`
wraps a config so absence is an `Option` rather than a failure. `Logger.layer([...])` installs
loggers.

Node 22 provides `path.matchesGlob` and `--experimental-strip-types`, which is how the graph check
runs with no build step and no glob dependency.

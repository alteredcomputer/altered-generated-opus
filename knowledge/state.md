# Current state

Updated 2026-09-11. Read this first, then `decisions.md`, `compass.md`, `offer.md`,
`plans/README.md`, `open-questions.md`, `direction-record.md`, `macro-plan.md`,
`feature-graph.md`, `prior-art.md`, `constraints.md`, `product-primitives.md`,
`design-reference.md`.

## Where the project stands

Live at `generated.altered.computer`, deployed from `main`, not indexed. The application builds
and runs. The landing page still shows the **retired** $100/$499 offer and the Nov 5 deliverables
as a promise; plan 04 is `ready` to replace it from `offer.md`.

Round 7 was answered on 2026-09-11 and recorded as D088 to D099; the message is archived
verbatim in `sources/chats/2026-09-11-round-7-anger-and-the-path.md`. The offer's edges are
closed: balance due at product access with pay-in-full asked first (D088), refundable any time
before product access (D089), care package locked and produced after the first reservation
(D090), video near the end of marketing setup (D091), his hands write the runway only (D092),
weekly 30 to 45 minute sessions (D093), the "1/10" page after the first reservation (D094).

The structural changes from Round 7:

- **The outreach machine (D095):** he does not scroll, paste, or type sends. The system sources
  by scraping public logged-out Instagram surfaces from seed accounts (Dan Koe, Hormozi, Zach
  Kravitz style, plus his following at @inducingchaos), scores, drafts, and queues; he approves
  each send in a control panel. Verified 2026-09-11 against Zernio's own docs: no official API
  can send a first Instagram message on any account type, so the send step is one-tap manual
  until Q65 closes. No automation ever logs into his personal account.
- **Plans run in series (D096):** one chat, one plan, one merge, review between.
- **Payments reality (D097):** Stripe is limited until he proves incorporation (Ownr, roughly
  $500, after the first reservation funds it). Interim rail: Interac e-transfer with a small
  discount, proof by screenshot, recorded by hand. PayPal for card buyers.
- **Provisioning is batched (D098):** no credentials until the alignment rounds settle.
- **The checkpoint re-scoped (D091):** Sept 14 stays but its realistic content is validated ICP
  and collected leads; the reservation experience needs another week or two of design (plan
  07's run-sheets and touchpoints) before deposits are confidently accepted.

Round 8 (Q63 to Q68) is asked: full-ticket versus reservation-led close (he is fifty-fifty and
this is the load-bearing one), runway message cadence (Q61 was misread as call cadence), the
physical send mechanism, the runway channel (Twilio SMS versus Sendblue iMessage), the sourcing
budget and business-account conversion, and the pay-in-full bonus.

Seven plans exist. Three are `ready`: 02 outreach bench (re-planned 2026-09-11 around the
sourcing machine), 04 offer and page, 07 offer assets. They execute in series; "next" takes 02
first. The feature graph passes: 40 nodes, every file accounted for.

## What is blocking

- **Q63** shapes plan 04's price framing, plan 05's checkout, and plan 06's close script. Plans
  02 and 07 do not wait on it.
- **Q65 and Q67** gate only plan 02's send mechanics and paid scraping backends; sourcing,
  scoring, drafting, and the queue build now.
- **Owner actions** are batched by D098 and listed in `open-questions.md` under "Waiting on the
  owner"; nothing is chased until the rounds settle.
- **Copy approval** before the page can be indexed (plan 04).

## What can proceed without answers

Plan 02 minus the send mechanism, plan 04 minus the price framing line, plan 07 in full, in that
series order. Plan 01 up to the point where a real login must be tested.

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

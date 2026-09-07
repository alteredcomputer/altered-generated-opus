# Plan 07 - Offer assets

**Status:** ready for the ungated parts. The video script and the session run-sheets need nothing.
The care package (Q58), the personal page (Q62), and anything touching the runway's cadence
(Q61) wait on Round 7.

**Depends on:** `knowledge/offer.md`. **Unblocks:** the shoot (his), fulfilment of the first
deposit week, and the sales brief in plan 06.

## Outcome

Everything a buyer touches in the deposit week that is not product exists as a finished,
owner-approved artifact: the long-form video script he can shoot from, the onboarding session
run-sheet and the weekly session template he runs from, the care package design and print-ready
files, and the personal page. The first deposit does not trigger a scramble.

## Locked inputs

`knowledge/offer.md` and the decisions behind it, especially D078 (the program), D079 (the
deposit), D080 (the deposit week and its authorship rule), D082 (no hard date), D086 (the video),
D022 (proof is staged truth), D047 (generated and disclosed), D052 (two narratives), D060
(distillation is not clarity), D059 and `design-reference.md` (the visual system).

## Scope

1. **Video script.** Long-form, VSL in structure, "short film" in energy (D086). Story, the pain
   in the buyer's language, what ALTERED is, the build slot, the deposit week, the honest reason
   we sell before it exists, the price, the call to action into the thread. Written in his voice
   from the source archives (his phrasing is on file in the direction record and the two Round
   messages), every claim traced to a decision in a margin note. Also renders as the page's
   article text until the video exists (plan 04).
2. **Onboarding run-sheet.** The 24-hour session (D080): purpose, the question set that
   unravels the goal and the blockers, the conflict-resolution pass, expectation setting, and the
   takeaway they leave with. Time-boxed. Feeds the care package's tailoring and the runway's
   first answers.
3. **Weekly session template.** The ask, resolve, deliver or report, next-step cycle (D080) as a
   one-page sheet with a pre-session checklist and a post-session note format that lands in the
   ledger as an event.
4. **Care package** (after Q58): contents list, unit cost, supplier options in Edmonton and
   online, print files for the mailer, the numbered plate, and the runway card in the visual
   system, and the hand-written letter's prompts (not its text; the letter is his).
5. **Personal page** (after Q62): the "1/10" page in the blackout-with-warm-lamp aesthetic, one
   route per buyer behind an unguessable path plus a signed token, no personal data beyond first
   name and number of ten, generated here and disclosed in its footer.

## Not in scope

The Koa runway in any form - code, intents, or message copy. It is product-shaped and his by rule
(D080). If he wants a research digest of the frameworks he named to draw from, he asks; it is
not produced unprompted. The sales brief (plan 06). Anything that states a balance or refund
timing before Q56 and Q57 close.

## Design

- **Script format:** numbered beats, each with the spoken line, the on-screen text if any, and
  the decision it traces to. Reading time and a target runtime. Two lengths: the full script and
  a ninety-second cut for reels.
- **Run-sheets are documents in `knowledge/`**, so the truth surface can edit them and so the
  ledger can reference their version. They are his to approve; the first real session will
  rewrite them, and the plan says so at the top of each.
- **Package files** live in `assets/` in this repo as source (SVG or PDF), never as photos of
  someone else's product. The visual system applies: Berkeley Mono, the neutral ramp, the one
  accent.
- **Personal page** is a static route under the existing web app, its data in a small JSON file
  per buyer that the truth surface can edit, no database dependency.

## Steps

1. Video script, full and ninety-second cut. Present beat by beat in chat for his edits. Commit
   after each pass.
2. Onboarding run-sheet and weekly template. Present in chat. Commit.
3. After Q58: care package spec, supplier shortlist with prices, print files. Commit.
4. After Q62: personal page. Verify at 390px. Commit.
5. Reconcile the feature graph, security pass (the page is the only code), `state.md`, merge.

## Verification

- Every claim in the script has a decision reference; a claim without one is removed, not
  softened.
- No em dash anywhere.
- The run-sheets fit on one phone screen each without scrolling more than twice.
- The personal page renders with no data other than first name and the number.

## Security pass specifics

- The personal page route is not enumerable and carries no email, phone, or answers.
- Print files contain no personal data; the tailoring is hand-written by him.

## Feature graph nodes

`assets` (root) with `assets-video-script`, `assets-run-sheets`, `assets-care-package`,
`assets-personal-page`. Documents under `knowledge/` are claimed by the knowledge base node.

## Agent notes

- 2026-09-07 (planning agent): the script is the truth artifact the direction record asked for
  in August, in the shape D086 chose. Write it once, well; the page and the reels are cuts of it.

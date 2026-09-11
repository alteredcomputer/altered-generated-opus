# Plan 07 - Offer assets

**Status:** ready. Round 7 closed its gates: the care package contents are locked (D090), the
personal page is built after the first reservation (D094), the session cadence is weekly 30 to
45 minutes (D093), and the video is scripted now and shot near the end of marketing setup
(D091). The run-sheets carry extra weight after D091: they are the "deposit experience" design
the owner said needs a week or two before reservations are confidently accepted.

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
   one-page sheet for the weekly 30 to 45 minute session at the client's locked time (D093),
   with a pre-session checklist and a post-session note format that lands in the ledger as an
   event. Include the reservation-week touchpoint schedule (D091): what happens on day one, the
   first week, and the weeks to the package's arrival, so there is never radio silence.
4. **Care package** (contents locked, D090): print files for the custom bubble mailer, the
   weathered-paper letter design (prompts only; the text is his), the hard-woven jet tag artwork,
   and the sticker pack, in the visual system; a supplier shortlist in Edmonton and
   print-on-demand with sample lead times; a costed bill of materials inside the $100 to $200
   batch budget. Production runs only after the first reservation, in his 2 to 3 day sprint;
   this plan makes that sprint a matter of ordering, not designing.
5. **Personal page** (after the first reservation, D094): the "1/10" page in the
   blackout-with-warm-lamp aesthetic, one route per buyer behind an unguessable path plus a
   signed token, personalised from the payment's details, collecting the shipping address for
   the package when the payment rail did not (see plan 05's 2026-09-11 note), no other personal
   data, generated here and disclosed in its footer.

## Not in scope

The Koa runway in any form - code, intents, or message copy. It is product-shaped and his by rule
(D080, D092). If he wants a research digest of the frameworks he named to draw from, he asks; it
is not produced unprompted. The sales brief (plan 06). Anything that states how the close leads
(full ticket versus reservation) before Q63 closes, or the pay-in-full bonus before Q68 closes.

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
   after each pass. The shoot itself waits for marketing setup to be near done (D091).
2. Onboarding run-sheet, weekly template, and the reservation-week touchpoint schedule. Present
   in chat. Commit.
3. Care package print files, supplier shortlist with prices, bill of materials (D090). Commit.
4. Personal page scaffold, built so the first reservation's details drop in (D094). Verify at
   390px. Commit.
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

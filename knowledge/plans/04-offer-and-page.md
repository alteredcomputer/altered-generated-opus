# Plan 04 - Offer and page

**Status:** ready. Round 6 fixed the offer; `knowledge/offer.md` is the source. Two lines wait on
Round 7 and are rendered as placeholders until then: the balance timing (Q56) and the refund
timing (Q57). Copy review with the owner happens section by section in chat before indexing.

**Depends on:** decisions only. **Unblocks:** 05 (the checkout needs the stated offer) and 06 (the
sales desk sells what the page says).

## Outcome

`generated.altered.computer` states the build slot exactly as locked in `offer.md`: the tagline,
what ALTERED is in plain words, who it is for, what Layer 1 is, what the $12,500 buys, what
arrives the week of the deposit, the soft product estimate, the price, the refund process, and
the disclosure that everything around the core is generated. It has a place for the long-form
video (D086) that renders the script as text until the video exists. Every fact on the page is read from one data file that
the truth surface can edit, so a price or date changes with a commit and a deploy, not a code
change. Once the owner approves the copy, indexing is switched on.

## Locked inputs

`knowledge/offer.md` in full, and behind it: D015 pre-selling and the honest framing; D016 and
D080 nothing product-shaped is generated; D019 outcome-led, never revenue; D020 the name; D022
proof is staged truth; D023 refund through a process; D042 the page informs, the thread closes;
D047 generated and disclosed; D052 two narratives; D060 distillation is not clarity; D067 the
tagline; D071 the page is the single truth artifact, article-shaped; D075 what ALTERED is; D078
the build slot; D079 $2,500 deposit; D081 the buyer; D082 no hard date, "Est. November"; D084
the room; D086 the video.

## Scope

1. Move the offer facts out of `apps/web/src/site/content.ts` into `knowledge/data/offer.json`
   with a schema (`packages/truth` or a small `packages/offer` module validates it at build and
   fails the build on a missing or malformed field). Facts: program name, seats, deposit, total,
   balance rule, service description, deposit-week deliverables, product clock rule, refund
   process summary, the soft product estimate.
2. Rewrite `content.ts` for the founding program. Article-shaped: it reads top to bottom as one
   argument, with the section labels the visual system already uses. Section list, in order:
   tagline and headline; what ALTERED is; the pain, in the buyer's language (compass); who this
   is for and who it is not for; what Layer 1 is; what the build slot is and how the program
   runs (D078); what happens the week you reserve (D080); the product and its soft estimate
   (D082); why we sell it before it exists (D015, D052); price and refund (D079, D023, with Q56
   and Q57 placeholders); frequently asked questions (seeded from the direction record's
   objections, grown from real ones); generated, and said so. The video sits between the pain
   and the program once it exists.
3. Call to action: keeps opening the text thread (D042). Wording per Q32 once answered; until
   then the current wording stays.
4. Remove the D040 launch-day deliverables section as a dated promise. The mechanism list moves
   to "what the product is" under the soft estimate, with no date attached (D082).
5. Indexing: `robots` stays `noindex` until the owner approves the copy in chat. The approval is
   recorded as a decision, and the flag flips in the same commit.
6. Koa sub-statement about pressure pivots (D067): drafted here, approved in Round 7, placed in
   the mechanism section.

## Not in scope

Proof assets (Q33, later plan). Payments (05). The hero visual treatment (Q40). Any statement
about revenue, about the core's timeline beyond what Q52 locks, or about features beyond D040.

## Interim, if the owner approves it in chat

The live page still shows the retired $100 deposit and $499 total, and the Nov 5 deliverables as
a promise. It is not indexed, but at least one person has read it. Proposed interim commit, small
and reversible: replace the price and date sections with one line, "Pricing and dates are shared
in the thread," until the rewrite lands. This is copy, so it ships only on his word.

## Steps

0. Interim change above, if approved. Commit.
1. `knowledge/data/offer.json` and its schema; build fails on a bad file; `content.ts` reads from
   it. Commit.
2. Rewrite the sections in the order above from `offer.md`. Every sentence that states a
   fact cites its decision in a code comment next to it, so the trace is checkable. Commit.
3. FAQ seeded from the direction record's recorded objections. Commit.
4. Verify at 390px and desktop; verify the font still loads with `document.fonts.check`, not a
   screenshot (state.md working note). Commit.
5. Present the page section by section in chat as Round 7. Apply his edits. Commit.
6. On approval: record the decision, flip indexing, merge.

## Verification

- `pnpm check` and `pnpm build` pass; the build fails when a required offer field is removed.
- Every number and date on the rendered page appears in `offer.json` and nowhere else in source.
- No em dash anywhere in the rendered text.
- Each stated claim has a decision reference in `content.ts`.

## Security pass specifics

- The page is static and public; it reads no secret. Confirm the contact number is the only
  environment value it touches and that a missing number still renders the honest disabled state.

## Feature graph nodes

Update `web-site-copy` and `web-landing-page`; add `offer-facts` (the data file and schema) under
`truth` or `web`, with `controls` naming the offer fields.

## Agent notes

- 2026-09-04 (planning agent): do not write the $12,500 total onto the page before Q49 locks what
  it buys. A price with no contents is exactly the fabricated-proof failure D022 forbids in another
  form.
- 2026-09-07 (planning agent): Q49 is locked (D078); the total may now be stated with its
  contents. The balance and refund timing lines stay as honest placeholders ("shared in the
  thread") until Q56 and Q57 close.

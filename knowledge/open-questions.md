# Open questions

Questions are asked in the Cursor chat, in dependency order, in rounds of six to eight. Never in a
file.

This register carries the **full text** of every outstanding question, not a summary, so that a
fresh session can correlate answers given later against exactly what was asked. Answered questions
move to `decisions.md` and are removed from here.

---

## Rounds 1 to 3 and 5 to 8

**Answered.** Round 1 on 2026-08-12 (D015 to D039), round 2 on 2026-08-14 (D040 to D051), round 3 on
2026-08-15 (D052 to D061), round 5 on 2026-09-04 (D064 to D077), round 6 on 2026-09-07 (D078 to
D087), round 7 on 2026-09-11 (D088 to D099), round 8 on 2026-09-15 (D100 to D111).

---

## Round 9 - the last round before generation (asked 2026-09-15)

Round 8 flipped the MVP to generated (D100), scrapped the outbound-only runway for full Koa
(D101), and set the close at the full $12,500 (D102). He asked for one more round, then
generation begins with a build cycle between answers. These are the questions generation cannot
proceed past without guessing. Plan 08 carries the proposed scope these refer to.

### Q69 - the MVP scope: confirm or trim the proposed cut

Plan 08 proposes six phases: 1) the reply loop on Sendblue behind an allowlist, 2) vector
memory, 3) self-scheduled reach-outs, 4) concurrency and the event ledger, 5) the wall and
sales mode, 6) public number with the `/go` redirect and per-user cost tracking. Everything
else - voice, the thought editor, group features, the dashboard views beyond a minimal
conversation log - is explicitly out of v1.

- a) Build phases 1 to 6 as proposed, in order, nothing else.
- b) Trim phase 5 or 6 for now: stop at a private Koa he uses himself and demos on camera, and
  open it to the public only after his own daily use proves it.
- c) Add something the plan missed, named in his reply.

**Recommendation:** a, with the note that b is embedded anyway: the phases ship in order, so his
private daily-use Koa exists at the end of phase 3 and the public wall only opens when phases 5
and 6 land. Nothing is public until the allowlist is deliberately widened.

### Q70 - where the wall sits for a prospect texting Koa

D104: Koa is genuinely useful, leans about half toward the program, and free riders must hit a
wall. He asked for options and a recommendation.

- a) A message wall: a fixed number of Koa exchanges (say 30 to 50 messages), then the thread
  shifts to program-only until they book or pay. Predictable, gameable, blunt.
- b) A capability wall: conversation stays unlimited, but the product features - persistent
  memory across days and self-scheduled reach-outs - activate only for program members. Free
  Koa is a great conversation that forgets and never texts first; paid Koa remembers and
  initiates. The wall is the product's own value, not a meter.
- c) A milestone wall: the onboarding intents complete (goal, blocker, context collected), Koa
  delivers one genuinely useful synthesis of what it heard, then gates: the next step is the
  call or the program. Naturally personal, needs judgment, hardest to game.
- d) A cost wall only: a per-user daily token budget, silent until hit. Protects spend but sells
  nothing.

**Recommendation:** c layered on d, with one element of b. The milestone wall is the sales
process (their own words, synthesised, is the strongest pitch Koa can make); the token budget
underneath protects spend from day one and is needed regardless; and self-scheduled reach-outs
staying member-only keeps the most expensive, most magical feature as the thing they are
buying. A pure message count (a) punishes the exact person we want - the one who goes deep.

### Q71 - the standing monthly burn, and when Sendblue gets bought

The MVP's real costs: Sendblue about $100 USD a month, a Twilio number a few dollars if ported,
OpenRouter usage (his $25 sourcing budget plus Koa's own generation, protected by per-user
budgets), Neon and Vercel free tiers to start. Roughly $150 to $200 a month all in.

- a) Approve the standing burn now; buy Sendblue when phase 1 is deployed and the webhook is
  ready to receive (a few days in), so the paid month starts when messages can actually flow.
- b) Approve and buy Sendblue today as the commitment stake, per his own "signal to move fast".
- c) Hold Sendblue until the loop works against a mock; approve only token spend now.

**Recommendation:** a. It honours the stake without paying for dead days: the moment the
webhook deploys, the line goes live. b costs the same money for the same outcome minus a few
days of unusable line; c saves nothing meaningful and loses the momentum he named.

### Q72 - who can text Koa before the program opens

- a) Allowlist only (him, Kiera, one or two friends) until phases 4 and 5 are verified, then
  public.
- b) Public from the moment the loop works, wall from day one.
- c) Allowlist plus a manually invited handful of warm prospects as the first real test.

**Recommendation:** a moving to c: the allowlist is the fail-closed default the codebase already
mandates, his own daily use is the demo content engine (D110), and the first strangers should
be invited on purpose, not discovered by accident before the event ledger proves the system
does not double-send.

### Q73 - how the early build is named in public

D047 requires disclosure of generated work; his Sept 13 framing was "a very experimental state".
The public surface needs one consistent term.

- a) "Koa - early access": confident, honest about maturity, no engineering detail on the
  label; the page's fine print carries the generated-and-disclosed line as it already does.
- b) "Koa beta" or "experimental": more hedged, invites forgiveness, costs authority.
- c) No qualifier at all.

**Recommendation:** a. "Early access" matches the Layer 1 founding story, keeps D047 honest in
the footer where it belongs, and does not undersell a product that works.

### Q74 - the weekly generation budget

D107 makes cost an active duty; a number makes it operable. His one bad day cost about $100.

- a) About $50 a week of Cursor and token spend for the build, reported against progress each
  turn.
- b) About $100 a week while the MVP is actively generating, dropping after phase 6.
- c) No weekly cap; per-task judgment with the D107 rules (explicit models, 300k context cap,
  save-and-restart).

**Recommendation:** b during the MVP push, then a. The MVP is the revenue gate; underfunding
its two or three build weeks to save $50 delays the $12,500. The D107 rules are what keep
either number honest.

### Q75 - the live page in the meantime

The live landing page still shows the retired $100/$499 offer. Plan 04's full rewrite waits on
copy approval, but the page is wrong today and the funnel is changing to "text Koa".

- a) Ship a minimal interim page now: one screen, the tagline, "Koa - early access", one
  button that opens the thread (`/go`), no prices, no dates. Full page (plan 04) follows once
  Koa is live and copy is approved.
- b) Take the price and date lines off the current page, change nothing else.
- c) Leave it; nobody is being sent there yet.

**Recommendation:** a. It is a one-day generated task, it makes every surface point at the same
funnel, it removes a page that is actively wrong, and it gives his daily reels somewhere to
send people the moment Koa can receive them.

---

## Round 4 - still open, lower priority (asked 2026-08-15)

Q30 to Q34 and Q37 to Q40 stay open. None of them blocks the plans in `knowledge/plans/`. The
copy questions (Q31, Q32, Q33, Q34) are re-asked in copy review once Round 6 fixes the offer,
because the page is being rewritten around it. The design questions (Q37 to Q40) wait for copy.
Q35 was folded into Q55 and answered in D085; Q36 was answered in D084.

### Q30 - the posting account

Under D053 marketing volume goes to a dedicated alternate account. Two things are undecided: the
handle, and which platforms it runs on first. D070 answers the DM sender (personal, for now); this
question is about volume posting.

- a) A person-extended handle, in the spirit of `@morehormozi`: the owner's voice, obviously his,
  clearly the overflow channel.
- b) A brand-extended handle in the `alteredcomputer` family.
- c) Both, with the person-extended one leading.

Platforms: X only to start, or X and Instagram together.

**Recommendation:** a, on X only to start. The narrative is first person, so the account should read
as a person. One platform done properly beats two done thinly, and the demographic is on X.

### Q31 - the headline

The draft currently on the page is: **"You already know what to build. You keep un-deciding it."**
with the subhead "Koa is an always-on iMessage agent that holds every decision you have made and the
reasoning behind it, so you stop re-deriving your own conclusions and start shipping."

- a) Keep it.
- b) Lead on the outcome instead: "Ship the thing you keep circling."
- c) Lead on the mechanism: "It remembers every decision you made, and why."
- d) Something else, described.

**Recommendation:** a. It names the failure mode in the reader's own language, and un-deciding is a
word he will recognise as his own behaviour. The outcome then arrives in the subhead, which keeps
the promise outcome-led per D019.

### Q32 - what "start an application" actually means

The call to action currently reads "Start an application", chosen for status and positioning. That
word sets an expectation, and we have to honour it.

- a) It is genuinely an application: the agent qualifies against the disqualification list and can
  decline someone.
- b) It is a framing device: everyone who texts is welcome, and the agent sells.
- c) Different wording that does not imply screening, for example "Text to reserve".

**Recommendation:** a. We already wrote a disqualification list into the offer, so screening is real.
Being able to say no is what makes the seat feel scarce, and it protects the refund rate. With
three to eight seats it is more true, not less.

### Q33 - the first proof assets

Under D022, proof is staged reconstruction of things that genuinely happened in the owner's own use
of Koa. Which scenarios get built first, in order?

- a) An alignment save: Koa pulling him back from a shiny-object pivot.
- b) Memory recall: an old voice-noted idea resurfacing to power a present decision.
- c) A consistency directive: self-scheduled reach-outs that would not let something drop.
- d) A clarity session: many scattered thoughts narrowed to a few that a product was built from.

**Recommendation:** d, then a. The clarity session is the outcome the offer actually promises, and
it is the one this whole project is a live example of. The alignment save is the most emotionally
recognisable second, and the ten-flip loop in the direction record is its script.

### Q34 - content pillars and cadence

What do we actually post about, and how often?

- a) Build-in-public: what got shipped, what broke, what the system did this week.
- b) The ethos: human truth first, machines on top, why the core is hand-written.
- c) The pain: pressure pivots, re-deciding, perfectionism against time.
- d) Teardowns and craft: opinions about product, systems, and generated software.

Cadence: daily, five a week, or three a week.

**Recommendation:** c and a as the two main pillars, b as the occasional manifesto post, d
opportunistically. Five a week. Pain posts attract the buyer, build-in-public posts are the proof,
and the ethos posts are what make people follow rather than just read.

### Q37 - dark first, or follow the reader's setting

The page currently resolves both themes through `light-dark()`, which follows the operating system.
That is exactly what Pierre's own site does. His notes, however, specify a dark grey background and
monochrome as the default, with colour as a toggle.

- a) Follow the reader's system setting, as now.
- b) Dark only.
- c) Dark by default, with a manual toggle.

**Recommendation:** b for the marketing page. His one self-written specification says dark grey, the
brand reads darker, and a single theme is one fewer thing to keep correct. Keep the system-following
behaviour for the dashboard, where he will use it in daylight.

### Q38 - the border radius rule

Zero radius everywhere is currently asserted in the code as a brutalist default. He has never stated
a radius rule anywhere in the notes. That was an agent assumption and should be his call.

- a) Zero everywhere, hard rule.
- b) A single small radius, applied consistently.
- c) Zero on the marketing page, small radius in the dashboard where controls need affordance.

**Recommendation:** c. Sharp corners suit the brutalist marketing surface; interactive controls read
as more tappable with a small radius, which matters more on a phone.

### Q39 - the accent

There is no locked accent. His semantic map assigns orange or yellow to "human", blue or black to
"controlled", purple to "knowledge", red to "agents". The page currently uses a warm amber for
selection and focus only.

- a) Keep the warm amber, justified as the "human" colour, which matches the ethos.
- b) Pick from the semantic map deliberately, and use each colour for its meaning.
- c) No accent at all, pure monochrome.

**Recommendation:** a. It is already consistent with the map, and one accent used sparingly is the
most brutalist option that still gives focus states somewhere to live. Option b becomes interesting
later, on a page that explains the platform's layers.

### Q40 - the hero treatment

ASCII, dithering, CRT and pixel-distortion effects, and black-and-white height maps are among his
most repeated visual requests across the notes. The hero is currently plain text.

- a) Keep it plain text.
- b) Add a restrained ASCII or dither element to the hero.
- c) Go further: an animated monochrome treatment as the page's signature.

**Recommendation:** b, but only after the copy is approved. Getting the words right is worth more
than the visual, and an effect built around copy that then changes is wasted work.

---

## Planned later rounds

- **Round 9 - copy and design detail.** Section-by-section copy review of the rewritten page, the
  Layer 1 explainer, the Koa pressure-pivot sub-statement, proof placement, the
  frequently-asked-questions set built from real objections, and Q37 to Q40.
- **Round 10 - sales conversation.** The qualification script, objection handling, escalation
  triggers, follow-up cadence and timing, and the DM opener tonality for the bench.

---

## Waiting on the owner

Actions, not questions. Each unblocks a plan in `knowledge/plans/`. **Deferred as a batch by
D098** except where Round 9 or plan 08 names them; the plan-08 items lead now.

- **Round 9 answers** (Q69 to Q75), then generation starts.
- **Sendblue account and `SENDBLUE_API_KEY` + `SENDBLUE_SIGNING_SECRET`** in Vercel, per Q71's
  timing. Blocks plan 08 phase 1 going live (the loop builds against a mock until then).
- **Instagram converted to a business account** (D105), his action, before plan 06's inbox.
- **Resend credentials, `AUTH_EMAIL_FROM`, and `OPERATOR_EMAILS`** in Vercel, for dashboard
  login. Blocks the operator dashboard (plan 01), and therefore everything the dashboard hosts.
- **Zernio API key with his Instagram connected**, in Vercel as `ZERNIO_API_KEY` plus the
  account id. Free for the first two accounts. Lets the sales desk read Instagram replies
  (plan 06) and publishing land later (D044).
- **A GitHub fine-grained token with contents write on this repo only**, in Vercel, so the truth
  surface can commit edits. Blocks plan 03.
- **His e-transfer instruction** (the receiving email or phone and the exact wording buyers get);
  Stripe is limited until incorporation (D097); Interac e-transfer is the only live rail
  (plan 05), and financing (D102) waits on Stripe.
- **Incorporation through Ownr, then Stripe verification**, once the first sale funds it (D097).
- **Autumn credentials**, for checkout (plan 05), after Stripe works.
- **X credits through Zernio**, only once a lead source on X proves worth paying for (D083).
- **Approval to submit the domain for categorisation** with URL-filtering vendors, if we want to
  address the TLS-inspection issue in D061. Outbound write, so it needs explicit approval.

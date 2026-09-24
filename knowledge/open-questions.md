# Open questions

Questions are asked in the Cursor chat, in dependency order, in rounds of six to eight. Never in a
file.

This register carries the **full text** of every outstanding question, not a summary, so that a
fresh session can correlate answers given later against exactly what was asked. Answered questions
move to `decisions.md` and are removed from here.

---

## Rounds 1 to 3 and 5 to 10

**Answered.** Round 1 on 2026-08-12 (D015 to D039), round 2 on 2026-08-14 (D040 to D051), round 3 on
2026-08-15 (D052 to D061), round 5 on 2026-09-04 (D064 to D077), round 6 on 2026-09-07 (D078 to
D087), round 7 on 2026-09-11 (D088 to D099), round 8 on 2026-09-15 (D100 to D111), round 9 on
2026-09-24 (D112 to D124), round 10 on 2026-09-24 (D125 to D137).

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

- **Round 11 - copy and design detail.** Section-by-section copy review of the rewritten page, the
  Layer 1 explainer, the Koa pressure-pivot sub-statement, proof placement, the
  frequently-asked-questions set built from real objections, and Q37 to Q40.
- **Round 12 - sales conversation.** The qualification script, objection handling, escalation
  triggers, follow-up cadence and timing, and the DM opener tonality for the bench.
- **Content guidance (D129):** which organic content style to lean on if outreach throughput is
  short (philosophical, tech-build, ALTERED information value); he asked to be guided.
- **The memorable-number search schemes (D128)** and the auto-responder's exact text.

---

## Waiting on the owner

Actions, not questions. Each unblocks a plan in `knowledge/plans/`. The plan-08 and outreach
items lead (D120).

- **Verify his own number in the Sendblue dashboard** (free plan, D133) so Koa can reply to
  him; then say the word to apply the migrations to the production database (D135) and to turn
  the switches on for the allowlist.
- **The Sendblue paid plan** (about $160 CAD) before any real customer texts (D133).
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

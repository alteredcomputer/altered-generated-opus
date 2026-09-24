# Open questions

Questions are asked in the Cursor chat, in dependency order, in rounds of six to eight. Never in a
file.

This register carries the **full text** of every outstanding question, not a summary, so that a
fresh session can correlate answers given later against exactly what was asked. Answered questions
move to `decisions.md` and are removed from here.

---

## Rounds 1 to 3 and 5 to 9

**Answered.** Round 1 on 2026-08-12 (D015 to D039), round 2 on 2026-08-14 (D040 to D051), round 3 on
2026-08-15 (D052 to D061), round 5 on 2026-09-04 (D064 to D077), round 6 on 2026-09-07 (D078 to
D087), round 7 on 2026-09-11 (D088 to D099), round 8 on 2026-09-15 (D100 to D111), round 9 on
2026-09-24 (D112 to D123).

---

## Round 10 - what Koa says and where the threshold sits (asked 2026-09-24)

Round 9 confirmed the scope (D112), redefined the wall as a threshold on the real product (D113),
and started generation. These are the things Koa will say or do to a real person that no decision
covers yet. Phase 1 builds with placeholder values that fail closed; the answers replace them
before anyone outside the allowlist texts.

### Q76 - how Koa introduces itself on the first reply

The first iMessage is always inbound (D103). The first reply sets the whole tone, and it is copy
Koa speaks in his name.

- a) Koa says what it is in one line - an alignment agent built by him, early access, remembers
  what it is told - then asks what they are working on. No name-asking yet.
- b) Same, and it also asks for their name so the thread is personal from message two.
- c) Koa just talks: no self-description, disclosure lives on the page only.

**Recommendation:** b. Honest about being an agent (the page's disclosure does not travel into a
thread someone reached by scanning a reel), and a name is the cheapest way to make memory visible
on the very next message. c risks a person discovering they were talking to software after
sharing something real.

### Q77 - the onboarding intents Koa collects as guidelines

D101 says the intents are guidelines, not a script. Plan 08 names goal, blocker, and context.
Confirm the set Koa steers toward over the first days.

- a) Goal, the blocker they have been stuck on, and the context around it (what they have tried,
  what they use today).
- b) a plus one qualifying signal: how they currently use AI or notes, which tells Koa and him
  whether the program fits.
- c) a plus b plus an explicit budget or "would you invest in this" signal early.

**Recommendation:** b. The AI-and-notes question is natural in conversation and doubles as
qualification. A budget question early (c) reads as a pitch and breaks the half-lean rule
(D104); the price surfaces at the wall, not before.

### Q78 - the threshold numbers behind D113

The wall is time, cost, or milestone, on the full product. Numbers are needed to build phase 5.

- a) Cost: about $1 USD of model spend per person per day, fail-closed. Time: 14 days from their
  first message. Milestone: the intents collected and one synthesis delivered. Any of the three
  reached puts the thread past the wall.
- b) Looser: about $2 a day, 30 days, same milestone.
- c) Tighter: about $0.50 a day, 7 days, same milestone.

**Recommendation:** a. Fourteen days is long enough for reach-outs to prove themselves (D113)
and short enough that a free rider costs under $15. The milestone will usually arrive first for
an engaged person, which is the point: the synthesis is the pitch.

### Q79 - what Koa does past the wall

- a) Koa keeps replying, but only about the program and the next step (a call or payment), one
  reply per inbound, no reach-outs, until they book or pay. Memory is kept.
- b) Koa sends one closing message with the synthesis and the program, then goes silent until
  they pay or he re-opens the thread by hand.
- c) Koa keeps working normally but tells them plainly it is now on his time and asks them to
  decide within a few days.

**Recommendation:** a. It stays useful as a sales conversation without consuming the product,
and it never leaves a person unanswered. b feels like a shutter coming down; c is unbounded
spend.

### Q80 - what the interim page explainer says (D118)

Price and date come off now. The refined minimal page keeps a short explainer. Which sections?

- a) Koa only: what it is in two lines, what happens when you text, who it is for. The program
  is not mentioned on the page; Koa raises it in the thread.
- b) a plus one line that a founding program exists for people who want a custom build, with no
  price, so the thread's pitch does not come out of nowhere.
- c) a plus the program and the $12,500 stated plainly on the page.

**Recommendation:** b. The page is the door (D103, D104) and the thread is the funnel; one
honest line about the program makes the wall unsurprising without turning the page into a sales
page before copy review (plan 04).

### Q81 - the number: use the carried-over line or hunt a memorable one first

The Vercel environment already holds a Sendblue number and credentials (D114). D104 preferred a
memorable number, possibly ported from Twilio.

- a) Go live on the existing number now; never change it once a single stranger has it, so the
  memorable-number idea is dropped unless it happens before D115 widens the allowlist.
- b) Hold the public launch until a memorable number is found and ported.
- c) Live on the existing number now, port a memorable one later and keep both.

**Recommendation:** a. Every day matters more than the digits, and a number that changes
breaks every reel, DM, and card that carried the old one. If a memorable number is found while
the allowlist is still closed, swap then; after that, the number is fixed.

### Q82 - outreach pacing for the send-time tracker (D121)

He asked for help tracking send times to maximise output and avoid a ban. The tracker needs a
starting rule.

- a) Warm up: 10 DMs a day spread across the day, at least three minutes apart, rising by 5
  every three days to a ceiling of 30 to 40, only to accounts that follow back or engaged first
  where possible. The tracker warns when the pace or the daily count is exceeded.
- b) Start at the D064 target (10 a day) and hold there until the first reply rates are known.
- c) Push harder from day one: 30 to 50 a day.

**Recommendation:** a. Instagram's limits are undocumented and enforced by behaviour; a
rising, spaced pace from a personal account with real history is the known-safe pattern. c is
how accounts get action-blocked in week one, which would end the primary channel (D121).

### Q83 - the HITL hold before the dashboard exists

Sensitive turns hold a draft for approval (D104, plan 08 phase 5). Plan 01's dashboard is not
built, so the approval surface has to be something he can reach from his phone.

- a) Koa texts him, on the same Sendblue line, a one-line notice with the held draft, and he
  replies approve or a rewrite. A runtime outbound to his own number; needs the same kill switch
  and his approval here.
- b) CLI only, checked from Cursor; slower, nothing new to approve.
- c) No hold: Koa replies to sensitive turns with a fixed compassionate line and points at him
  directly, no generated content on those topics.

**Recommendation:** a, with c's fixed line as the immediate acknowledgement to the person so no
one waits in silence. a is the only phone-usable path until plan 01, and the recipient is him.

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

---

## Waiting on the owner

Actions, not questions. Each unblocks a plan in `knowledge/plans/`. The plan-08 and outreach
items lead (D120).

- **Confirm the Sendblue subscription is active** behind the credentials already in Vercel
  (D114). Blocks the loop going live the moment phase 1 deploys.
- **Round 10 answers** (Q76 to Q83) before anyone outside the allowlist texts Koa.
- **Instagram converted to a business account** (D105, D121), his action, before outreach
  starts and before plan 06's inbox.
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

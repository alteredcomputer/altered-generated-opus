# Open questions

Questions are asked in the Cursor chat, in dependency order, in rounds of six to eight. Never in a
file.

This register carries the **full text** of every outstanding question, not a summary, so that a
fresh session can correlate answers given later against exactly what was asked. Answered questions
move to `decisions.md` and are removed from here.

---

## Rounds 1 to 3

**Answered.** Round 1 on 2026-08-12 (D015 to D039), round 2 on 2026-08-14 (D040 to D051), round 3 on
2026-08-15 (D052 to D061).

---

## Round 4 - finishing the offer, then volume (asked 2026-08-15)

Q30 to Q36 cover the offer and go-to-market. Q37 to Q40 are design questions raised by the notes
research, and three of them correct assumptions an agent made rather than decisions he stated. See
`design-reference.md` for the evidence behind each.

### Q30 - the posting account

Under D053 marketing volume goes to a dedicated alternate account. Two things are undecided: the
handle, and which platforms it runs on first.

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
Being able to say no is what makes the seat feel scarce, and it protects the refund rate.

### Q33 - the first proof assets

Under D022, proof is staged reconstruction of things that genuinely happened in the owner's own use
of Koa. Which scenarios get built first, in order?

- a) An alignment save: Koa pulling him back from a shiny-object pivot.
- b) Memory recall: an old voice-noted idea resurfacing to power a present decision.
- c) A consistency directive: self-scheduled reach-outs that would not let something drop.
- d) A clarity session: many scattered thoughts narrowed to a few that a product was built from.

**Recommendation:** d, then a. The clarity session is the outcome the offer actually promises, and
it is the one this whole project is a live example of. The alignment save is the most emotionally
recognisable second.

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

### Q35 - funnel stage definitions

Under D058 our database is the source of truth, constructed so internal traffic cannot contaminate
it. I need the definitions locked before writing the schema, because these become the numbers we
optimise against.

- Lead: anyone who sends a first inbound message that is not the owner or an operator.
- Qualified: confirmed to be a technical founder actively building, and not disqualified.
- Reserved: deposit paid.
- Lost: explicit no, or no reply after the follow-up sequence completes.

**Recommendation:** adopt as written, with one addition: every stage transition is stored as an
append-only event with a timestamp and a reason, so the funnel can be recomputed later when the
definitions change, rather than being lost.

### Q36 - Discord

Buyers get Discord access immediately on deposit (D017), so it has to exist before the first sale.

- a) Set it up now, minimal: one channel for the cohort, one for build updates.
- b) Set it up now, structured: several channels by topic.
- c) Wait until the first deposit.

**Recommendation:** a. An empty structured server signals a dead community; two channels with the
builder actually in them signals a small one, which is the truth and is attractive at this stage.
Creating it is the owner's action, since it is an external resource.

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

## Round 5 - path anchoring and outreach (asked 2026-08-27)

Asked in chat after the direction record was saved. Q41 to Q48. Background for all of them:
`knowledge/direction-record.md` and `knowledge/compass.md`.

### Q41 - the demand test

The prior chat's final ruling was a demand test: one article, one honest reservation offer, fifty
named ICP humans DMed as conversations, with pre-committed pass thresholds (10 real replies, 5
problem conversations, 3 booked calls or 1 unprompted "how do I pay"). It was never explicitly
confirmed, and its Sept 8 end date has nearly arrived unstarted.

- a) Adopt it with re-anchored dates: outreach live within a week, test ends Sept 12.
- b) Adopt it exactly as written, ending Sept 8, accepting the compressed window.
- c) Skip the test; ALTERED is locked by D062 regardless, so spend the time building instead.

**Recommendation:** a. The test is the only instrument that answers the one question every flip
pivoted on - whether the ICP is reachable at current audience size - and D062 makes ALTERED the
path either way, so the test now measures reach, not direction.

### Q42 - the founding tier

D021 locks Layer 1 at $100/$499. The owner has repeatedly gravitated to a higher tier: a $1,000
deposit toward a program anchored near $12,500, one to three clients a month at $4,000-8,000
total, with unscalable founder access as the premium (the Hormozi single-client logic).

- a) Add a founding tier above Layer 1: 3-8 seats, $1,000 deposit, total priced only after five
  real ICP conversations, anchored at $12,500 only if that is the genuine future price. Layer 1
  stays unchanged underneath.
- b) Replace Layer 1 with the high-ticket program entirely.
- c) Stay $499-only for now.

**Recommendation:** a. Three closes at $1,000 is closable by hand where thirty at $100 is not, it
adds no product promise beyond D040, and the premium is access, which is deliverable now.

### Q43 - the first-seat special

If the first buyer doubles as the proof asset, the discount is the price of a written testimonial
plus case-study rights.

- a) One named seat, steeply discounted or free, testimonial and case-study rights agreed in
  writing before delivery starts.
- b) No special; first buyer pays the same as everyone.
- c) A friend (for example Tino) gets it free as a delivery test and case study, explicitly not
  counted as demand validation.

**Recommendation:** a, with c allowed in parallel as a delivery rehearsal - a friend proves
fulfilment, never price.

### Q44 - the X profile tagline for alteredcomputer

Needed now for the profile. Candidates drawn from locked narrative only:

- a) "Never lose your best thinking again." (the product narrative, D052)
- b) "You already know what to build. You keep un-deciding it." (the draft headline, Q31)
- c) "Human truth, preserved. Machines on top, never underneath." (the ethos, D052)
- d) "Thought to action. Distilling complexity, systematically." (his own fragment, direction
  record)

**Recommendation:** a for the brand account bio - it is the benefit statement and already locked
as narrative. b stays the landing headline candidate; c is manifesto material.

### Q45 - the source-of-truth surface

Where the locked truth lives so it is usable from a phone.

- a) A typed TypeScript constants package in this repo with pnpm scripts to query and render it,
  as ruled in the prior chat; a read-only web view later once it is in daily use.
- b) A generated shadcn PWA dashboard now.
- c) Both now.

**Recommendation:** a. The PWA is the tenets-renderer trap until the data is in daily use;
constants are versioned, typed, phone-readable through Cursor, and zero infrastructure.

### Q46 - the outreach bench scope

The DM pipeline the owner described: niche in, reasoned lead list out; per-profile personalized
drafts against locked intent and tonality; Clack approve/decline; then send.

- a) Build sourcing, drafting, and review now; sending stays fully manual - the human pastes each
  approved message into X by hand.
- b) Build the full pipeline including automated sending behind a kill switch.
- c) No tooling yet; do the first fifty by hand and build from what that teaches.

**Recommendation:** a. Automated DM sending on X is both an external write (default deny, D003)
and a real account-suspension risk on a brand-new profile; the expensive part of the work is
sourcing and drafting quality, which tooling accelerates safely. Revisit b after the first fifty.

### Q47 - which account does the outreach

Q30 (the posting account) is still unanswered, and DMs need a sender identity now.

- a) The owner's personal account: warm, human, highest reply odds for conversation-openers.
- b) The alteredcomputer brand account.
- c) A new person-extended alt per Q30's recommendation.

**Recommendation:** a for the fifty test DMs - the narrative is first person and reply rate is the
whole experiment. The Q30 alt remains the volume-posting answer.

### Q48 - the generation batch

Nothing generates without explicit approval. Proposed batch, each part small and hand-reviewable:
the truth constants package (Q45a), the outreach bench (Q46a), and the article scaffold on the
existing landing stack. Proposed model: the strongest available thinking model, one agent per
part, sequenced rather than parallel so each lands reviewed.

- a) Approve the batch as proposed.
- b) Approve a subset (name which).
- c) Hold; nothing generates yet.

**Recommendation:** a, sequenced: constants package first (everything else reads from it), then
the outreach bench, then the article scaffold.

---

## Planned later rounds

- **Round 5 - copy and design detail.** Section-by-section copy review, the Layer 1 explainer, proof
  placement, the frequently-asked-questions set built from real objections, and the accent colour.
- **Round 6 - sales conversation.** The qualification script, objection handling, escalation
  triggers, follow-up cadence and timing.

---

## Waiting on the owner

- **Resend credentials**, for dashboard login email.
- **Autumn credentials**, for payments.
- **Zernio credentials**, for publishing.
- **Final confirmation of the 2026-11-05 launch date**, once sales are consistent.
- **Approval to submit the domain for categorisation** with URL-filtering vendors, if we want to
  address the TLS-inspection issue in D061. Outbound write, so it needs explicit approval.

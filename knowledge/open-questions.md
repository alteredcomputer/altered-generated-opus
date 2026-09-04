# Open questions

Questions are asked in the Cursor chat, in dependency order, in rounds of six to eight. Never in a
file.

This register carries the **full text** of every outstanding question, not a summary, so that a
fresh session can correlate answers given later against exactly what was asked. Answered questions
move to `decisions.md` and are removed from here.

---

## Rounds 1 to 3 and 5

**Answered.** Round 1 on 2026-08-12 (D015 to D039), round 2 on 2026-08-14 (D040 to D051), round 3 on
2026-08-15 (D052 to D061), round 5 on 2026-09-04 (D064 to D077).

---

## Round 6 - the offer, re-anchored (asked 2026-09-04)

Round 5 moved Layer 1 to a founding program anchored at $12,500 with a $1,000 deposit (D065) and
ruled that nothing depends on hand-written code before the first sale (D072). These questions
finish the offer so the page, the sales script, and payments can be built without guessing.
Background: `decisions.md` Round 5 and the source archive for 2026-09-04.

### Q49 - what the $12,500 buys

The premium over the product is founder access. Its shape decides the workload and the copy.

- a) Weekly working session: one sixty-minute session a week for the six months, plus the
  product, plus permanent influence over the platform's direction. Three to eight seats.
- b) The daily-touch model he described: thirty minutes a day with one or two clients only,
  priced above the anchor to reflect it. Everyone else waits for a later layer.
- c) Done-with-you truth setup: a kickoff week where he installs their source of truth with
  them (the method friends already ask him for), then a weekly session, then migration onto
  ALTERED when it is stable.

**Recommendation:** c. It is deliverable the week it is bought with nothing hand-coded, it is the
thing people are already asking him for, and it is literally the on-ramp to the product. Option b
is the highest-value version and should be held as the single premium seat if a buyer appears who
wants it.

### Q50 - what arrives at deposit, before the product exists

D017 promised Discord and bonuses at deposit; the program itself started on launch day. With a
service inside the offer, the service can start immediately.

- a) The service starts the week of the deposit; the product arrives when it arrives. The deposit
  buys the seat and the first session.
- b) Deposit buys the seat only; everything, including the service, waits for the launch date.
- c) A generated Koa demonstration (memory over iMessage, generated in this repo and disclosed)
  is delivered at deposit as a taste, alongside the service start.

**Recommendation:** a. Starting the service immediately is what makes a $1,000 deposit feel like a
purchase rather than a pledge, and it produces the proof assets D022 needs. Option c is worth
doing as a sales asset regardless, but not as a delivery promise.

### Q51 - how wide the buyer is

D018 locks detail-obsessed technical founders. The Sept 4 message describes a different person in
detail: solo, hyper-committed, restarting repeatedly, willing to be homeless for the idea, and
non-technical. "The solo scale system."

- a) Keep D018 as the buyer. The friend is the story we tell, not the person we sell to.
- b) Widen to solo hyper-committed builders, technical or not, who have a direction and cannot
  hold it. Disqualification list unchanged.
- c) Two segments with two pages.

**Recommendation:** b. The pain is identical and the disqualification list already excludes the
people we cannot help. The budget rule does the rest: someone who can pay $1,000 to reserve a
$12,500 program is qualified by that act. One page, one voice.

### Q52 - the launch date and the promise under the golden rule

D040 promises memory, self-scheduled reach-outs, voice notes, and notes import on 2026-11-05,
hand-written by the owner. D072 says hand-writing starts only after sales.

- a) Keep Nov 5. The clock starts on the first deposit; if fewer than three seats are sold by
  Oct 1, the date moves and buyers are told before they are asked for anything more.
- b) Replace the fixed date with a relative one: the mechanism core ships within ninety days of
  the third seat closing.
- c) Drop the product date from the offer entirely. The service is the promise; the product is
  the bonus when it lands.

**Recommendation:** b. It keeps a real, checkable promise on the page, and it makes the promise
depend on the thing that funds it, which is the honest framing D015 already uses.

### Q53 - paying for X API reads

Follower and following lookups are pay-per-use at $0.01 per user returned, and only the owner can
open the developer account and buy credits. Fifty validated leads from a few thousand scanned
profiles costs tens of dollars.

- a) Buy credits now (suggest $50) and let the bench source automatically.
- b) No API. The bench takes a pasted list of handles he collects by scrolling, and does the
  validation and drafting from there.
- c) Both: paste-in works from day one, API sourcing lands when credits exist.

**Recommendation:** c. Paste-in means outreach starts tomorrow with no purchase; the API path is
built behind it and switches on when the key arrives.

### Q54 - the room

D017 gave buyers Discord access at deposit. With three to eight seats and a service inside, a
Discord server may be the wrong room.

- a) Discord, one channel, as decided.
- b) A group iMessage or a small group chat on the platform they already use, plus the direct
  thread with Koa.
- c) No shared room; direct threads only until there are three buyers.

**Recommendation:** c, then b. An empty server signals a dead cohort; three people in a direct
thread with him signals exactly what is being sold.

### Q55 - funnel stage definitions (carried from Round 4, needed for the schema)

The outreach bench and the sales desk both write funnel events, so these become the numbers.

- Lead: anyone who sends a first inbound message that is not the owner or an operator, or who
  replies to an outreach message.
- Qualified: confirmed to be building something real with a direction, and not disqualified.
- Committed: has said they will pay the deposit and named a date.
- Reserved: deposit paid.
- Lost: explicit no, or no reply after the follow-up sequence completes.

**Recommendation:** adopt as written. Every stage transition is stored as an append-only event with
a timestamp and a reason, so the funnel can be recomputed when definitions change. "Committed" is
new; it is the Sept 8 minimum in D064 and has to be countable.

---

## Round 4 - still open, lower priority (asked 2026-08-15)

Q30 to Q34 and Q36 to Q40 stay open. None of them blocks the plans in `knowledge/plans/`. The
copy questions (Q31, Q32, Q33, Q34) are re-asked in copy review once Round 6 fixes the offer,
because the page is being rewritten around it. The design questions (Q37 to Q40) wait for copy.
Q35 has been folded into Q55 above.

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

### Q36 - Discord

Superseded by Q54 above.

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

- **Round 7 - copy and design detail.** Section-by-section copy review of the rewritten page, the
  Layer 1 explainer, the Koa pressure-pivot sub-statement, proof placement, the
  frequently-asked-questions set built from real objections, and Q37 to Q40.
- **Round 8 - sales conversation.** The qualification script, objection handling, escalation
  triggers, follow-up cadence and timing, and the DM opener tonality for the bench.

---

## Waiting on the owner

Actions, not questions. Each unblocks a plan in `knowledge/plans/`.

- **Resend credentials** in Vercel, for dashboard login codes. Blocks the operator dashboard
  (plan 01), and therefore everything the dashboard hosts.
- **A GitHub fine-grained token with contents write on this repo only**, in Vercel, so the truth
  surface can commit edits. Blocks plan 03.
- **X developer account and pay-per-use credits**, if Q53 lands on a or c. Blocks automatic
  sourcing in plan 02; paste-in sourcing does not need it.
- **Autumn credentials**, for the deposit checkout (plan 05). Until then, an interim payment link
  he creates himself is the only way a deposit can be taken.
- **Zernio credentials**, for publishing. Not on the Sept 8 path.
- **Approval to submit the domain for categorisation** with URL-filtering vendors, if we want to
  address the TLS-inspection issue in D061. Outbound write, so it needs explicit approval.

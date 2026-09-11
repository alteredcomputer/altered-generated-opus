# Open questions

Questions are asked in the Cursor chat, in dependency order, in rounds of six to eight. Never in a
file.

This register carries the **full text** of every outstanding question, not a summary, so that a
fresh session can correlate answers given later against exactly what was asked. Answered questions
move to `decisions.md` and are removed from here.

---

## Rounds 1 to 3 and 5 to 7

**Answered.** Round 1 on 2026-08-12 (D015 to D039), round 2 on 2026-08-14 (D040 to D051), round 3 on
2026-08-15 (D052 to D061), round 5 on 2026-09-04 (D064 to D077), round 6 on 2026-09-07 (D078 to
D087), round 7 on 2026-09-11 (D088 to D099).

---

## Round 8 - the structure of the money, and the machine's edges (asked 2026-09-11)

Round 7 closed the offer's edges but reopened the biggest one: he is fifty-fifty on dropping the
deposit and closing the full $12,500 up front, and asked for the comparison. The rest are the
runway's two mechanical choices and the outreach machine's two mechanical choices, all of which
gate code that is otherwise ready to build.

### Q63 - the $2,500 start, or closing the full $12,500 up front

He is fifty-fifty and asked for the comparison (source archive 2026-09-11). Both models sell the
same $12,500 program. The difference is what is asked for at the close, what is owed before the
product exists, and what the first payment is called.

- a) **Keep the $2,500 start as the standard path, and always ask for full payment first.** The
  close presents the full ticket with the pay-in-full incentive (D088); the $2,500 start is the
  fallback offered in the same breath, framed as "start now, balance at product access." Light
  pre-launch obligations: onboarding call, runway, care package, page - all refundable-safe
  (D089). His build hours stay his until launch.
- b) **Full $12,500 only, with payment plans as the workaround.** Strongest cash and commitment;
  requires a stated maximum product timeline (he floated "nine months maximum") and a scheduled
  pre-launch service calendar heavy enough to justify holding the full amount, which spends his
  build hours on fulfilment before the product exists.
- c) **$2,500 only at close, full ticket raised later at product access.** Simplest close,
  weakest cash, and re-opens the price conversation at the worst moment.

**Recommendation:** a. It is what he described himself when he said "you might as well ask for
the full amount up front" and "close on the twelve five, and then figure out how to deliver" -
but it keeps the escape hatch that protects the build: a buyer who balks at $12,500 today can
still say yes to $2,500 today, and D088 already makes the balance due at access. Option b's real
cost is the one he named: 50% of his focus sold to pre-launch fulfilment before the product that
makes fulfilment cheap exists. If a is chosen, the first payment is not called a deposit; call
it what it is - reserving the slot and starting the program - and the page says "Start for
$2,500" against the $12,500 program price. Instalment mechanic when a buyer cannot pay the
balance in full: accredited provider first (cash up front, their credit risk), self-managed
splits only at his discretion for an exceptional buyer.

### Q64 - how often the runway messages arrive (re-asked; Q61 was answered as call cadence)

This is about the automated outbound-only messages the runway sends, not calls. They are
generated and sent by the system at fixed times; they cost him no live time regardless of
frequency. The weekly 30-45 minute session is already locked (D093) and is separate.

- a) One message every weekday at a time the person picks at onboarding, quiet on weekends.
- b) One a day including weekends.
- c) Two or three a week.

**Recommendation:** a. Daily is the Koa habit the program sells, a chosen time is the first act
of personalisation, and weekend silence keeps it from becoming noise.

### Q65 - how an approved opener physically reaches a stranger's Instagram inbox

Verified 2026-09-11: the official Instagram API cannot start a conversation with someone who has
not messaged the account first, on any account type - Zernio's own docs state it. Zernio still
reads replies and sends inside the 24-hour window, so everything after the first message is
automatable. The first message has three honest options:

- a) **One-tap manual:** the control panel queues approved sends; on his phone, each is a tap
  that copies the text and opens the profile, he pastes and sends from his personal account.
  Zero account risk, roughly 20 seconds per send, and the DM comes from a real person's profile,
  which is also why it gets read.
- b) **A grey-market sender** (browser automation, warmed accounts, proxies) wired to our control
  panel, running on a dedicated business or burner account, never his personal one. True
  hands-off sending; real suspension risk (the vendors themselves say to use accounts you can
  afford to lose), a warmup period before volume, and roughly $50 to $100 a month.
- c) **a now, b when volume proves out:** manual one-tap until fifty sends and a conversion
  signal exist (the D069 revisit line), then a burner-account automation for scale while his
  personal account only ever holds conversations that came back.

**Recommendation:** c. It matches the automation-after-fifty rule already locked in D069, it
never risks the personal account that his content and credibility live on, and it spends money
on automation only after the list it automates is proven to convert.

### Q66 - the runway's channel: SMS through Twilio, or iMessage through Sendblue

The runway is outbound-only either way, and the answer store is identical. This decides sender
identity, cost, and feel.

- a) Twilio SMS: cheapest (fractions of a cent per message), simplest integration, he named it
  himself; green bubble, sender is a bare number, A2P registration paperwork in North America.
- b) Sendblue iMessage: blue bubble, real iMessage identity, the same channel Koa will live on,
  so the runway literally becomes Koa's number later; roughly $50+ a month and an onboarding
  step.
- c) Twilio now, migrate the number experience to iMessage at Koa's launch.

**Recommendation:** b. The runway is sold as "Koa before Koa" - the blue bubble is part of the
product's identity (D080 pre-loads Koa from the runway's answers), the buyer count is one to
ten so per-message cost is irrelevant, and paying for it out of the first deposit is exactly
what the deposit is for. If the monthly cost before the first deposit matters, a is a fine
start, but the switch cost later is a number change for every client.

### Q67 - the sourcing machine's budget and the business-account conversion

Sourcing will scrape public data (seed accounts' followers and engagers, candidate bios, posts,
reel transcripts) with a headless browser and, where it saves days, a paid scraping service.
Public viewers are Cloudflare-gated against plain fetches but pass with a real browser (verified
2026-09-11), so a pure self-built scraper is possible but slower to harden.

- a) Pre-approve up to $50 a month for scraping infrastructure (a scraping API or proxy service),
  spent only when the self-built path stalls, each service named in `constraints.md` when first
  used.
- b) Self-built headless browser only, no paid services; accept slower and flakier sourcing.
- c) Decide per-service in chat as each need arises.

Attached: converting his Instagram to a business account unlocks Zernio's inbox for replies
(plan 06). It is his account, so the conversion is his action; the known trade-off chatter is
about reach on business accounts, which Meta denies and which matters less for a DM-first motion.

**Recommendation:** a for the budget - it is inside the $20 to $50 he already said he would
spend when justified (D083), and naming each service on first use keeps default-deny honest.
Convert the account whenever convenient before the sales desk lands; nothing before plan 06
needs it.

### Q68 - what paying in full at the start actually earns

D088 says the incentive is added delivery, not a discount. It needs a number and a name before
the page and the sales brief can state it.

- a) Two additional sessions in the first month (an intensive start), named plainly.
- b) A permanent price lock on every future ALTERED layer, named as founding status.
- c) Both, since neither costs cash today.

**Recommendation:** a. It is concrete, immediately valuable, and costs only hours that a
full-paying client has already funded. b promises pricing of products that do not exist yet,
which is a claim we cannot trace to anything.

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
D098:** he provisions everything at once after the current alignment rounds settle what is
needed. Nothing here is chased until he says the rounds are done.

- **Resend credentials, `AUTH_EMAIL_FROM`, and `OPERATOR_EMAILS`** in Vercel, for dashboard
  login. Blocks the operator dashboard (plan 01), and therefore everything the dashboard hosts.
- **Zernio API key with his Instagram connected** (converted to a business account, Q67), in
  Vercel as `ZERNIO_API_KEY` plus the account id. Free for the first two accounts. Lets the
  sales desk read Instagram replies (plan 06) and publishing land later (D044).
- **A GitHub fine-grained token with contents write on this repo only**, in Vercel, so the truth
  surface can commit edits. Blocks plan 03.
- **His e-transfer instruction** (the receiving email or phone and the exact wording buyers get),
  recorded in settings once plan 01 exists; until then it lives in the sales script. Stripe is
  limited until incorporation (D097); Interac e-transfer is the only live rail (plan 05).
- **Incorporation through Ownr, then Stripe verification**, once the first deposit funds it
  (D097).
- **Autumn credentials**, for the deposit checkout (plan 05), after Stripe works.
- **X credits through Zernio**, only once a lead source on X proves worth paying for (D083).
- **Approval to submit the domain for categorisation** with URL-filtering vendors, if we want to
  address the TLS-inspection issue in D061. Outbound write, so it needs explicit approval.

# Decision ledger

Binding decisions, newest section last. Each entry records the verdict, the reason, and what it
would cost to re-open, so that no future session re-litigates a settled question from scratch.

A decision is only in this file once the owner has stated it. Agent recommendations that have not
been accepted live in `open-questions.md`.

---

## Round 0 - founding directives (2026-08-12)

Stated by the owner when commissioning this repo. These are operating-level, not product-level.

### D001 - Development happens in Cursor, not iMessage

**Verdict:** All development, code, and architecture conversation happens in Cursor cloud agent
chats. There is no development iMessage integration.

**Why:** The previous attempt routed build work through iMessage, which produced a fragile bridge
and pushed dev conversation into a channel unsuited to it.

**Re-open cost:** High. The iMessage surface design inherits from this.

### D002 - iMessage is a human-facing agent only

**Verdict:** iMessage exists so the system can reach the owner and so the owner can reach it. Scope:
notifications, small user-land decisions and questions, and longer voice notes that feed the
knowledge base. Knowledge captured this way may inform development, but development conversation
does not happen there.

**Re-open cost:** Medium.

### D003 - External writes are default deny

**Verdict:** No writes to external APIs, services, or accounts without explicit owner approval per
operation. Reads are fine. See `constraints.md`.

**Why:** The previous attempt auto-created Vercel projects that the owner had to clean up manually.
Owner assets are protected by staying away from them, not by careful use.

**Re-open cost:** Never re-opened wholesale. Individual operations get approved one at a time.

### D004 - GitHub writes are scoped to this repo

**Verdict:** Git and GitHub writes only within `usealtered/altered-generated-opus`.

**Re-open cost:** High.

### D005 - No ambiguity, no assumptions

**Verdict:** Agents do not decide on stack, code structure and design, scope, timeframe, feature
depth, roadmap, offer and funnel structure, user-facing copy, or visual design. Those are asked in
rounds in the Cursor chat, with multiple choice and a recommendation, ordered so that no answer
invalidates an earlier one. Minor local implementation choices are the agent's.

**Re-open cost:** High. This is the core working agreement.

### D006 - Mobile-first everywhere

**Verdict:** Every human surface is designed for a phone first: the Cursor chat updates, iMessage
output, and above all the secure web dashboard for drafts, scheduled posts, lead flow, and metrics.
PWA affordances are worth adding where they earn their place, so the dashboard can live on the
owner's home screen.

**Re-open cost:** High.

### D007 - Cleanliness, minimalism, composability

**Verdict:** Code quality, runtime safety, and output quality are the top priority, above speed.
Take the simplest solution that works until a real edge forces more. No invented hacks, no one-off
custom implementations that duplicate a well-known library. Quality, refactor, reliability, and
observability passes at the end of every turn, plus a whole-branch pass before merge.

**Why:** Without a strong source of truth in code, the product, the dev process, the marketing, and
reliability all degrade together.

**Re-open cost:** Never.

### D008 - The owner does not touch git, PRs, or code

**Verdict:** Agents own the entire git lifecycle including merging their own pull requests.

**Re-open cost:** Low, but it changes the reporting protocol.

### D009 - Dynamic over hard-coded

**Verdict:** Values that a human might reasonably want to change belong in a database, a settings
store, or a CMS - not in source. Hard-code only what is structural.

**Re-open cost:** Low.

### D010 - Presale / reservation approach is retained

**Verdict:** The reservation or presale motion stays as the commercial approach, but its shape,
price, and mechanics are to be re-optimised rather than copied from the previous attempt.

**Re-open cost:** Medium. Owner has asked for optimisation, not preservation.

### D011 - Prepare for extractable packages, do not build them yet

**Verdict:** Module boundaries should be drawn so that vetted packages could later be published and
installed privately into the hand-written `altered` repo. No packages are extracted or published
now.

**Re-open cost:** Low.

### D012 - Nothing from the prior repos is treated as truth

**Verdict:** `altered` and `altered-generated` are "before" references. Every offer component,
phrase, product claim, and operational assumption is re-confirmed top-down in this repo.

**Re-open cost:** Never.

### D013 - Stop and ask on blocking constraints

**Verdict:** On a mostly-blocking constraint such as missing access to a resource or repository,
stop and ask. Continue only on genuinely independent work.

**Re-open cost:** Never.

### D014 - Effect.ts is permitted, popular libraries are preferred at the edges

**Verdict:** Effect may be used for dependency injection, error tracking, and logging where the
agent is confident in it. Where a more popular library is the better-understood choice, wrap it
rather than replacing it - the stated example is using the AI SDK over `effect/ai`.

**Status:** Adopted. See D033.

**Re-open cost:** High once code exists.

---

## Round 1 - strategy, offer, and operating protocol (2026-08-12)

### D015 - Pre-selling is the strategy, and it is a skill

**Verdict:** We pre-sell. Revenue comes before a shipped product, deliberately.

**Why (the owner's reasoning, preserved because it overturns an earlier position):** speed is the
single biggest leverage point in software - time to money, time to revenue, time to capital. Capital
buys the time to build the real thing and ends the day job. Pre-selling converts lower than selling
a tangible product on a like-for-like basis, but the comparison is not like-for-like once you price
in what early cash unlocks. Pre-selling is a skill, and the skill is available: the constraint is
execution quality, which is what this repo is for.

The earlier position in the parent repo, that pre-selling with nothing is execution incompetence, is
retired. Its real target was incompetent execution, not the pre-sale motion.

**The honest framing we use publicly:** we pre-sell *because* we care about the details. The core is
hand-written rather than generated because a data platform that people trust with their thinking
cannot afford a wrong column name, a missed primitive, or a subtly generic design. We would rather
sell the promise and get it right than ship a generated approximation early.

**Re-open cost:** Very high. Every downstream marketing decision inherits this.

### D016 - The core product is hand-written, and this repo never touches it

**Verdict:** The entire `altered` repo is written by the owner, by hand, 100%. No agent writes core
product code. This repo generates everything else, disclosed as generated.

**Why (preserved in the owner's terms):** ALTERED is infrastructure - a thin layer beneath other
people's products. Its primitives, data models, naming, and backlink semantics have to be uniquely
his, or the platform regresses toward a generic composite of existing tools. Beyond that: knowing
the data model completely prevents losing the vision; hand-writing preserves human authorship in the
product; and it is the part of the work he wants to do. Performance, durability, and logging may use
AI assistance, but every line is reviewed by him.

**Consequence:** no partial product is offered. Nothing ships to buyers until V1 is whole.

**Re-open cost:** Never. Stated as final.

### D017 - Q1: what the deposit buys

**Verdict:** A deposit reserves a build slot, or customisation slot, in the early access program and
locks the advertised price. There is a published launch date. If we miss it, the deposit is
refunded, though not automatically - we may first offer an extension if something dramatic happens.

On the launch date the buyer receives the first slice only: the Koa chat that helps them align, to a
specification we define. No core code access at deposit time.

Delivered immediately on deposit: access to a Discord community where the product is discussed
pre-launch, plus any bonuses we create.

### D018 - Q2: who we sell to

**Verdict:** Detail-obsessed technical founders, with an explicit disqualification list.

**Disqualify:** no budget; blocked by procrastination we cannot solve; a skill gap we cannot close;
no direction at all. **Qualify:** they have a sense of what they want and real problems to solve.

### D019 - Q3: the promise leads with outcome

**Verdict:** Outcome-led. Memory and self-scheduling are the mechanism, never the headline.

**The outcome chain:** get crystal clear on what your product actually is, consolidate a thousand
scattered thoughts into the few that matter, build product and marketing around those, ship, hold
marketing steady, and let revenue follow. We never promise revenue.

**The pain we name:** starting down a path without being able to finish or clarify it, switching
ships, and never focusing long enough to make the value proposition clear.

### D020 - Q4: the name

**Verdict:** **ALTERED Koa Layer 1**. ALTERED is the company, Koa is the product, Layer 1 is the
program. Digit, not the word. Followed by a short tagline describing what the program is and what
Koa delivers.

**Why Layer 1 survives:** the audience is technical and values aesthetics, control, and refinement.
Cold traffic hitting it with no context will not parse it, so the landing page defines it
immediately, along the lines of: Layer 1 is the first wave of user testing ALTERED will undergo, and
its members shape the platform's direction permanently. Exact copy is a later round.

Domain: `altered.computer`.

### D021 - Q5: price

**Verdict:** $100 deposit, $499 total, $399 due at launch. **No additional discount.** Total stays
under $500 so it remains closable inside a chat thread without a call.

**Why no discount:** the deposit's job is commitment, not price reduction. "Credited toward" already
delivers the feeling of value; cutting the total to $399 softens the anchor, invites price
negotiation, and gives away roughly $100 of margin per sale that is better spent on paid
amplification. The stronger lever is what the deposit unlocks - the build slot in D017 - not a
smaller number.

### D022 - Q5a: proof is staged, not fabricated

**Verdict:** Proof assets are recreations of outcomes that genuinely happened in the owner's own Koa
usage, restaged for clarity and stripped of personal detail. Constructed iMessage screenshots are
acceptable and normal for social. The events are real; the screenshots are reconstructions.

**Constraint:** we never stage an outcome that did not happen.

### D023 - Q6: conditional refund guarantee

**Verdict:** A full refund is guaranteed, but it runs through a process rather than a one-click
request. The buyer states why they are unsatisfied and gives feedback. The refund is then honoured
unconditionally.

**Timing:** the refund window opens after the launch date and after they have used the product. The
deposit funds development until then.

**Why:** an instantly refundable deposit is a real cash risk once we reinvest a share of deposits
into paid acquisition. A single bad public moment could force refunds out of money already spent.
The process keeps the marketing claim strong while protecting solvency.

**Delegated:** exact wording is the agent's, subject to copy review.

### D024 - Q7: dated cohort start

**Verdict:** A dated launch, targeting **2026-11-05**, roughly twelve weeks out. The six-month
program begins on that date. Nothing is released before it.

We publish exactly what buyers receive on that date. Vague early access kills anticipation;
specific promises with a date sustain it.

**Owner confirms the final date** once sales are consistent and profitable. If we need to stretch
past it, we refund or offer a discount.

**Standing constraint:** every promise attached to that date must be something the owner can
hand-write within the window. No agent may add to the launch promise list.

### D025 - Q8: what this repo owns

**Verdict:** Everything go-to-market, and everything we want generated and built fast. Docs and the
landing page live here for now.

**Excluded, permanently:** the core infrastructure and architecture layer - ALTERED's core data
types, the shipping applications, and the official API surface.

### D026 - Q9: hard wall between generated and hand-written

**Verdict:** Total separation. Separate database, separate iMessage line, separate everything.

**The only two sanctioned seams:** packages generated here that the owner chooses to install into
the core repo, and read-only reads of core product data once it is live. Neither exists yet.

### D027 - Q10: guardrails confirmed as written

**Verdict:** `constraints.md` is confirmed. Default deny, per-operation approval, session writes and
runtime writes approved separately, kill switches default off.

### D028 - Q10a: never ask for review in a file

**Verdict:** Questions and review requests go in the chat. The owner reads on a phone and cannot
practically open repo files. A long, genuinely file-shaped artefact such as the agent instructions
may be committed, but the decisions inside it are still surfaced as chat questions.

### D029 - Q11: branches, then merge to main by hand

**Verdict:** Branch per logical change for visibility, then merge to `main` directly using git. Do
not use the pull request tooling - it requires owner approval, which defeats the purpose. Pull
requests are optional and mostly unnecessary since the owner does not review code.

### D030 - Q12: rounds of six to eight questions

**Verdict:** Smaller rounds, each shaped by the previous round's answers.

### D031 - Q13: fresh everything

**Verdict:** No conventions inherited from the parent repo. Code style, formatting, structure, and
composition are entirely the agent's own choice, subject only to the quality bar: clean, composable,
safe, durable, readable.

**Why:** the two codebases never touch except through compiled package installs, so shared
formatting buys nothing. Agents should write in the style they execute best in.

### D032 - Q14: Effect v4 adopted

**Verdict:** Effect v4 is the backbone: services, dependency injection, the error channel, logging,
tracing, and configuration. Popular libraries are wrapped rather than replaced at the edges - AI SDK
v7, Drizzle, and the auth layer.

**Version policy:** pin exact versions, upgrade deliberately later. A moving release candidate is
acceptable under a lock.

**Learning:** clone `Effect-TS/effect-smol` and search the source alongside the docs. Do not spend a
turn studying before starting; the owner considers it proven in production.

### D033 - Q15: credential handover

**Verdict:** The agent publishes the exact environment variable template in chat. The owner fills it
and provides the values. He will also provide a Cursor API key and a GitHub token with broader
scope.

### D034 - Residual resources from the previous project may be wiped

**Verdict:** For any credential handed over, the agent has standing approval to perform a first wipe
where the contents are clearly residual from the old `altered-generated` project. Do not port or
migrate old data. The owner will flag anything worth keeping before handover.

**Boundary:** this approval covers the first wipe of handed-over resources only. It is not general
permission to create, delete, or modify anything else.

### D035 - Chat SDK concurrency: burst mode, no custom machinery

**Verdict:** Set the Chat SDK to burst mode, which is closest to the behaviour we want, and build
nothing custom on top of it.

**Standing design intent for when it is not enough:** proper abort controllers, checkpointed state
so an aborted turn rolls back cleanly and resumes, and reliance on the SDK's own locks and queues so
a locked thread holds later messages until the in-flight turn completes. Any move beyond
configuration is a chat conversation first.

**Operational workaround in the meantime:** space messages out rather than building a fix. This is
not revenue-critical.

### D036 - The iMessage agent is the top-level operator

**Verdict:** Koa on iMessage is the owner's assistant and co-operator. It orchestrates, stores
human-level knowledge, and knows what is happening across the business.

**In scope:** notifications, small decisions and questions, voice notes into the knowledge base,
reporting on repo and development state by relaying to and from coding agents, and eventually
user-land admin commands over lead generation and sales.

**Out of scope:** being a development tool. It relays and reports; it is not designed to drive or
fuel development, even though that is a possible side effect.

**Implementation implication:** it needs a channel to the coding agents, likely Cursor webhooks or
the Cloud Agents API, so it can report which tasks are running and when they finish. Design is a
later round.

### D037 - The feature graph is required

**Verdict:** The repo maintains a feature-level mirror of itself. See `knowledge/feature-graph.md`
for the model and `AGENTS.md` for the every-turn procedure. Kept deliberately minimal.

### D038 - Security is an explicit, itemised pass every turn

**Verdict:** Security is checked point by point at the end of every turn that touched code, per the
checklist in `AGENTS.md`. Environment variables, endpoints, cross-party data access, and admin tool
gating each get their own explicit check.

**Why:** like a human, an agent misses what it does not look at directly. The two fail-open defaults
in the previous repo were exactly this failure.

### D039 - Revenue target

**Verdict:** At least $3,000 in the current month. Cleanliness and stability are the stated route to
it, not a trade against it.

---

## Round 2 - money, channels, and surfaces (2026-08-14)

### D040 - Q16: the launch promise is the mechanism core

**Verdict:** On the launch date we ship memory, self-scheduled reach-outs, voice notes, and notes
import. Nothing beyond that is promised.

**Why:** it is exactly the mechanism the pitch names, so the promise and the marketing are one
sentence, and it is what one person can hand-write in the window. Anything wider risks the date, and
the date is the one thing that cannot slip quietly.

### D041 - Q17: Autumn for payments

**Verdict:** Autumn, over direct Stripe. Open source, and it carries usage-based billing all the way
rather than leaving us to assemble it from Stripe webhooks, which matters because the program is
built around an AI usage allowance.

**Note:** this supersedes the agent's Stripe recommendation. Autumn settles onto Stripe underneath,
so payout speed is retained.

### D042 - Q18: the landing page informs, iMessage closes

**Verdict:** The landing page creates interest and states the offer. The call to action moves the
prospect into the iMessage thread, where the sales agent handles objections and closes, the way a
high-ticket call would.

**Why the conversation is mandatory rather than optional:** opting into the thread is what gives us
the highest-converting follow-up channel for lukewarm buyers. Losing the small share of impatient
self-serve buyers is worth that.

**Call to action wording:** something with status and positioning, along the lines of "Start
application", rather than naming Koa when it is not yet Koa answering. Exact copy is a later round.

**Corollary:** if the price scares someone away, that is a landing page problem, not a price
problem.

### D043 - Q19: outreach and content run in parallel

**Verdict:** Both, built end to end without compromising either. Outreach produces cash and the raw
language of real objections; content compounds and reaches the demographic through the algorithm in
a way manual prospecting cannot. Paid amplification comes later, only against posts that already
proved themselves.

### D044 - Q20: Zernio, rebuilt cleanly

**Verdict:** Publish through Zernio, reimplemented properly rather than carried over. The days spent
building it back correctly outweigh the hours per day of manual posting.

### D045 - Q21: the sales agent closes, with hard escalation

**Verdict:** Autonomous, escalating to the owner only on high-risk or unclear topics: product claims
beyond the locked promise list, the launch date, and refunds.

### D046 - Q22: email codes for the dashboard

**Verdict:** Better Auth with an emailed code, delivered by Resend. Chosen for durability and
simplicity over passkeys, which have been unreliable in practice. This covers the admin dashboard
only; the user-facing product may choose differently later.

### D047 - The generated system is the testimonial

**Verdict:** We are our own biggest proof, and we say so openly. Every landing page, document,
social post, and advertisement is generated, and that is disclosed rather than hidden.

**The claim underneath it:** the owner clarified his product's purpose and scope to his own
satisfaction, held that clarity in Koa, and directed AI to generate everything to his standard while
keeping complete mental oversight of the project without reading the code. The feature graph is what
makes that last part true rather than a boast.

**Constraint:** the claim only ships once it is real. It becomes true the moment this campaign is
live and working.

### D048 - Content is text now, generated video later

**Verdict:** Text posts to start, optionally with a simple image or card for attention and for use
in advertisements. A personal-brand video pipeline using current generation models, with the owner
approving and publishing, is a later upgrade rather than a launch dependency.

### D049 - The feature graph may become an offer component, but not yet

**Verdict:** A read-only feature graph that Koa can manipulate, keeping a founder's codebase and
their understanding of it in sync, is a plausible extension of the offer. It is not promised, not
mentioned in copy, and not scoped, until we have built it and used it ourselves successfully.

### D050 - Deployment topology

**Verdict:** One Next.js application on Vercel serving the site, the dashboard, and the API under
`/api`. The inbound iMessage webhook therefore lives at `/api/webhooks/sendblue` on the same origin,
so no separate API base URL is needed.

### D051 - Local development environment

**Verdict:** Vercel is the source of truth for environment values. Pull them locally and then set
`APP_ENV` to `development` by hand, because a pulled production file will otherwise claim to be
production. Recorded in `.env.example`.


---

## Round 3 - narrative, surfaces, and measurement (2026-08-15)

### D052 - Q23: two narratives, not one

**Verdict:** "The future is generated" is a description of 2026, not our story, so it is not the
narrative. There are two narratives and they sit at different levels.

**Brand ethos:** we preserve human truth through versioning, attribution, and aggregation, and only
then distribute and produce on top of it with AI. Machines sit above human input, never underneath
it. The consequence is authenticity and connection between people, and confidence grounded in work
that is genuinely yours.

**Product narrative (Koa, memory, organisation):** never lose your best thinking again.

**Why this matters for copy:** the ethos explains why the core is hand-written and why everything
around it can be generated and disclosed. It is the moral argument. The product narrative is the
benefit argument. They do not compete, and neither one replaces the other.

**Offer unchanged.** The intentional-generation angle stays out of the promise, per D040 and D049.

### D053 - Q24: a dedicated posting account, not the main ones

**Verdict:** Marketing volume goes to a dedicated alternate account rather than to the owner's
personal account or the official ALTERED account. Both of those stay high-signal and infrequent, by
preference.

**Why:** the main accounts are intentionally dense and reserved. Frequent promotional posting there
costs him something real even if it converts. A separate account also allows looser
human-in-the-loop later, and makes advertising practical.

**Standing rules:** one hundred percent human approval of every post for now. Any future video that
is not actually him carries an AI disclosure.

**Open:** the handle itself, and whether it reads as personal-extended or brand-extended. See Q30.

### D054 - Q25: notify by iMessage, approve on the dashboard

**Verdict:** Anything involving editing, approval, or more than about two sentences of source text
goes to the dashboard. iMessage receives a one-sentence natural-language notification, batched where
that makes sense, with a link.

**Why:** iMessage is for high-level direction. Filling it with fine-grained editing work is what
turns an assistant into a chore. The dashboard is usable on the phone too, so nothing is lost.

### D055 - Q26: the landing page takes the apex, for now

**Verdict:** The landing page belongs on `altered.computer`. The apex can be handed to the
hand-written product later, once there is something substantial to put there.

**Current state:** `generated.altered.computer` is live and holds the deployment today. Moving to the
apex is a domain change, not a code change.

### D056 - Q27: full dashboard in the first version

**Verdict:** Lead flow and metrics, drafts and scheduled posts, the feature graph, and the kill
switches. All four.

### D057 - Q28: the operator agent reports, it does not delegate

**Verdict:** The iMessage agent handles notifications, directional alignment, and answering
questions about visible system state. It does **not** delegate coding tasks to agents.

**Why (from experience):** delegating produced abandoned chat histories, redundant objectives, and
layered fixes that turned into hacks. The owner administers coding work himself in Cursor, where he
can watch it. Keeping the iMessage concurrency problems away from the development process is worth
more than the convenience.

**The split-brain design that replaces delegation:**

- The iMessage agent reads the feature graph and system state, either through a secured endpoint
  that serves the graph from the repo files or through the database, whichever proves simpler.
- The coding agent reads the operational side directly: querying the database with the connection
  string, or calling internal endpoints with an internal token.

Each side reads what it needs. Neither drives the other.

### D058 - Q29: our own events first

**Verdict:** Funnel and financial truth lives in our database, constructed so internal traffic
cannot contaminate it. A hosted product analytics tool may be added later for web behaviour.

### D059 - Typography and visual reference

**Verdict:** Berkeley Mono, variable, as the single typeface for all site copy. The reference is
Pierre's markdown-style monospaced site: extreme spareness, capitalised section labels, a strict
baseline grid, and no decoration that is not structural.

**Held in reserve:** PX Grotesk and PX Grotesk Mono, once the owner buys a licence. Trial cuts are
missing non-alphanumeric characters, so they cannot ship. Hoefler Text is a possible serif for
literature-style passages, to be used with intent, since it may not sit well beside the brutalist
faces.

### D060 - Distillation is not clarity

**Verdict:** Two distinct things, and copy must not conflate them.

**Distillation** is the process that converts long source text into singular, backlinked thoughts.
It is mechanical and can be automatic.

**Clarity** is a human-decided outcome. AI can assist heavily by aggregating, compressing, naming
the dominant theme, and asking the few questions that matter, which is properly called
agent-assisted clarity. Deciding what is true remains the human's.

### D061 - The certificate error is network interception, not our infrastructure

**Diagnosis:** The certificate presented on the hospital network was issued by
`northgate.healthy.bewell.ca`, which is that network's own inspection proxy. It terminates TLS and
re-signs with a private authority that a personal device does not trust.

**Verified from here:** our chain is a valid Let's Encrypt certificate that verifies cleanly against
a public trust store, with no missing intermediate. Nothing is wrong on Vercel's side or ours.

**Why other sites work:** selective interception. Established domains are categorised and bypassed;
a new subdomain on a new top-level domain has no reputation, so it gets inspected.

**Options, none urgent:** submit the domain for categorisation with the major URL-filtering vendors,
which requires the owner's approval since it is an outbound write; or move to the apex under D055,
which will accumulate reputation faster. Affects only networks that inspect TLS.

---

## Path and memory (2026-08-27)

Stated by the owner after the ten-day path deliberation of 2026-08-16 to 2026-08-24, which is
archived verbatim in `knowledge/sources/chats/` and distilled in `knowledge/direction-record.md`.

### D062 - ALTERED is the main path; the SMS B2B company is stalled

**Verdict:** The owner's words, 2026-08-27: "now that we're pretty certain ALTERED is the main
path" and "assume the SMS B2B plan is stalled inside this one." The missed-call SMS company is not
being built. Its full design survives in the direction record as a named fallback only.

**Why (from the record, not from mood):** across ten flips, every off-lane money plan died within
roughly thirty hours of commitment, while ALTERED remained the attractor in every energy state.
Execution probability is part of the arithmetic, and only one path has it.

**Re-open cost:** High, and gated. Re-opening requires the challenge protocol in the direction
record: quote the specific recorded reason being overturned and defeat it. Failed challenges are
logged and counted.

### D063 - Direction-level memory is preserved at the source

**Verdict:** Strategy conversations that shape the path are archived verbatim under
`knowledge/sources/` and distilled into the knowledge base in the same turn. Any session doing
direction-level work reads `direction-record.md` and `compass.md` before proposing or accepting a
path change.

**Why:** the Aug 16-24 chat wrote nothing to the repo by design, then errored. Roughly 300K tokens
of deliberation, including the complete SMS design and the demand-test ruling, survived only
because the conversation was still retrievable over the API. That near-loss does not get a second
chance.

**Re-open cost:** Low.

---

## Round 5 - offer reshaping and generation-first (2026-09-04)

Answered by the owner in one message written across Aug 30 to Sept 4, archived verbatim at
`knowledge/sources/chats/2026-09-04-offer-reshaping-and-generation-first.md`. Context that drove
it: rent lands on him alone from Sept 16, the household holds six people until then, and he wants
money movement by Sept 8. He asked for the questions to be answered "very very briefly", so several
verdicts below carry an agent-chosen detail that he delegated; each is marked and can be corrected
with one word in chat.

### D064 - Q41: the Sept 8 checkpoint measures money, not only demand

**Verdict:** Option b, adapted. The fifty-conversation demand test runs against its original end
date, Sept 8, and the pass condition now includes financial progress. His words: "We need that time
pressure. But not just demand, financial progress." and "We need to see something, money wise, by
the 8th."

**Daily KPIs (agent-set, he said "you can adjust"):** on a work day, ten conversation openers sent
and three interested replies; on a day off, double. Tracked in the truth surface once it exists,
in `knowledge/plans/README.md` until then.

**Sept 8 checkpoint (agent-set):** minimum is one named person who has said they will pay the
deposit and named a date; target is one deposit actually paid. Below the minimum, the checkpoint is
missed in writing and the direction record's inheritor protocol applies. It is a checkpoint, not
a kill switch on ALTERED (D062).

**Re-open cost:** Low; dates move by decision, never by drift.

### D065 - Q42: Layer 1 is the founding program

**Verdict:** His words: "answer A IS layer 1." There is one program, and it is the high tier: three
to eight seats, a serious deposit, anchored at $12,500 total for a service-related offer. "We need
to keep our worth, our target offer price of whatever we're offering $12,500 w/ the pre-sale for a
service-related offer."

**Supersedes D021.** The $100 deposit and $499 total are retired from copy. A lower self-serve
layer may return later under a different name; it is not offered now.

**Deposit amount:** he listed $997, $999, $1,000, $1,249, $1,250 and said "one of those. That's
still sellable by chat, there's people that do it. That is our art." **Agent pick: $1,000.** Reason:
the buyer is detail-obsessed and technical, and a round number reads as honest where $997 reads as
an information product; it is also the figure he used throughout the direction record. Correct with
one word if wrong.

**What the $12,500 buys is OPEN** (Round 6). The premium is founder access in some form; the shape
of that access is his call. Until it is locked, no page states the total.

**Re-open cost:** High. The page, the sales script, and the payments plan all inherit this.

### D066 - Q43: first seat at full price first, discount as the fallback

**Verdict:** Try b first, fall back to a. The first buyer is offered the regular program at the
regular price. If they hesitate, the fallback is a discount in exchange for a written testimonial
and written permission to advertise the use case. Never free.

**Friends do not count.** A friend may rehearse fulfilment, but only a stranger proves the funnel.
Ngoc's stated intent to deposit when he has the cash is recorded as the first opt-in and is not
counted as demand, by the owner's own caution.

### D067 - Q44: the tagline is mechanism plus outcome

**Verdict:** "Knowledge orchestration infrastructure. Never lose your best thinking again."

**Why:** loss is the thread through every mechanism: tagging prevents loss to disorganisation,
versioning prevents loss of progress, Koa prevents loss of time and effort, data structures
prevent loss of utility. Retired: "the AI platform for human control" and "Store, develop, and use
your thoughts on the fastest thought-to-action platform to exist."

**Koa sub-statement:** something about pressure pivots, for Koa's own surface rather than the
ALTERED profile. To be drafted and approved in copy review.

### D068 - Q45: the truth surface is a generated web app, now

**Verdict:** Option b now, option a as the fallback. His words: "let's generate/build a good
web/pwa that we can manage our truth in first, and if we encounter issues we can migrate to TS
constants/CLI/scripts." He rejects the trap framing: "As long as we use you, and you use
technologies you're trained on, a web app is not a trap - it is the easy build."

**Architecture (agent's call, stated so it can be challenged):** the truth itself stays in git as
the files in `knowledge/`, and the web surface reads and writes those files through commits to this
repo. One source of truth that agents and the owner both read, versioned for free, zero new
storage. Operational data - leads, outreach candidates, funnel events, KPIs - lives in Postgres
per D058. The two never duplicate each other.

### D069 - Q46: sourcing, drafting, and review are built; sending is manual

**Verdict:** Option a. The bench sources candidates, drafts per profile against locked intent and
tonality, and presents approve or decline. The human pastes each approved message into X. Automated
sending is revisited after the first fifty.

**Sourcing, as he described it:** find and validate profiles through the X API from a general
category or a seed profile, expanding through followers and following, with human review and
fine-tuning of the results. "That kind of generated automation that we could review and fine-tune
is what will save us time and help us fly. As long as we have HITL/approval."

**Cost fact (verified 2026-09-04):** the X API is pay-per-use for new developers. Follower and
following lookups bill at $0.01 per user returned; user lookups the same. Fifty validated leads
from a few thousand scanned profiles is tens of dollars. Buying credits is his action (Round 6).

### D070 - Q47: the personal account does the outreach, with a named fallback

**Verdict:** His personal X account sends the DMs for now. The brand account is the close
alternative, kept ready.

**Why personal:** a DM from a person gets a reply where a DM from a business profile gets ignored,
and the marketing is personal-brand driven, which is what other coaches do at volume.

**Why the fallback stays close:** he does not want outreach drowning out his friends' messages or
getting his personal account rate-limited. Mitigations: no mass sends, pins and read state to
separate personal threads, and the bench itself tracks every conversation so the inbox does not
have to.

### D071 - Q48: generation is approved, and it runs plans-first

**Verdict:** Approved. The protocol:

- The planning agent writes end-to-end plans, top to bottom, one per workstream, plus a master
  plan that carries order and status. All saved in `knowledge/plans/`.
- The owner starts a fresh Cursor chat per plan and says "next" or "finish". The plan and the
  master file orient the new agent; nothing depends on chat memory.
- Agents executing a plan may modify it or append notes when they hit something meaningful.
- The owner does not review code. He user-tests the result. Code quality is on the plan and the
  agent, gated by `pnpm check` and the operating contract.
- Strongest available thinking model, one agent per plan, sequenced so each lands reviewed.

**Batch changes from the proposal:** the truth constants package is skipped in favour of the web
surface (D068). The outreach bench is confirmed. The article scaffold is the agent's call: the
landing page is the single truth artifact, rewritten article-shaped for the new offer, rather
than a second page competing with it.

### D072 - Golden rule: no hand-written code until there are sales

**Verdict:** His words: "until we have sales - NO hand coding should be incorporated. It's just not
time-appropriate. An agent can do everything I can but better, EXCEPT for the product where my truth
is important."

**What it means:** nothing in the offer, the funnel, or the pre-sale deliverables may depend on the
owner writing code before the first deposit. D016 stands - the core is still his and still
hand-written - but it starts after money, not before. A generated demonstration of Koa is
permitted as a sales asset ("if we need to pre-sell on a generated demonstration, then so be it").

**Consequence left OPEN (Round 6):** D040 promised the mechanism core on 2026-11-05, hand-written.
Under this rule that work begins only after sales, so the date and the promise need re-anchoring.

### D073 - Sell in chat, reaffirmed; the HITL sales desk is the long-term move

**Verdict:** Chat closes, not calls, reaffirming D042. The long-term shape is a human-in-the-loop
control panel where the agent drafts every reply and he approves before it sends. A call after
purchase is welcome and buys build time.

**Why (his reasons):** it fits the demographic; he has watched $5-15k offers close in chat off a
document; and he is analytical rather than social, so texting at a slower pace multiplies his
intelligence where a call does not. He recorded the counter-argument himself - human touch on a
call may be the one thing an agent cannot do - and still chose chat as "our art to master".

### D074 - Sticker store and reminder app are parked

**Verdict:** The re:mind sticker store (physical reminders with QR codes to a promise app) and a
one-directional reminder app under ALTERED (web configuration, personalised iMessage nudges) are
both parked. His assessment: real ideas, inferior to Koa in value and not the launch. The reminder
behaviour is a future ALTERED feature. "We should try and solve as much of this problem with Koa
first."

### D075 - What ALTERED is, in one sentence

**Verdict:** "A managed, minimal, dynamic source-of-truth and alignment/integration agent system."
Restated more simply for newcomers in copy.

**Positioning boundary:** ALTERED is not primarily a code tool. The technical seam it offers early
is a data MCP, not code generation. He does not want to be "the guy that teaches how to set up and
use a knowledge base in another app", although that setup is a viable substitute service until the
product is stable (Round 6).

### D076 - Build surfaces: web first, scripts where they fit

**Verdict:** "Stick to what you as the model is best trained on: a web app for POC/demo that I can
also use from mobile. Simple, trusted, flexible." CLI and scripts are acceptable for less
interactive work, but they limit him at work where he has a phone.

### D077 - Generation-first operating mode

**Verdict:** "We need to limit our inputs, generate more, and get results." Less coding, less
re-typing of conclusions, less textual review. The highest-signal feedback is the product itself;
lower-level infrastructure concepts are the exception and still need to be right.

**Stated workflow, in his order:** entropic chat is converted to source of truth; the source of
truth is converted into code, or into action through our code and connectors. The workflow comes
first, the offer and features are the intermediary, and execution is the part he calls easy. "It's
the resolving of ambiguity, maintaining of that truth to completion, and the reasonable
optimization of that truth up until completion, that is the really hard part."

---

## Round 6 - the offer, re-anchored (2026-09-07)

Answered across Sept 6 and 7, archived verbatim at
`knowledge/sources/chats/2026-09-07-round-6-and-the-build-slot.md`. The full statement of the
offer these decisions produce is `knowledge/offer.md`; the compass carries the one-page version.

### D078 - Q49: the ticket buys one custom build slot

**Verdict:** One single offer. No tiers, no premium seat. "Focus in one place, for one person, to
the maximum degree."

**What it is, in his words:** "a custom, user-land plus backend implementation and features that
are tailored towards a single user's greatest goal and struggles. Exactly for their life,
business, and issues. Tailored and fine-tuned by me, the technician, to build a hyper-functioning
brain that enables them as an extension to the ALTERED core." Each client's implementation is
intended to be refactored later into something any user can create in userland.

**The program:** weekly sessions of 30 to 150 minutes depending on purpose; six months to a year;
the first session is a guided one-to-one tutorial and initial setup. Included: how-to-use,
strategic planning of systems and architecture, custom plugin and extension development, hot
fixes, converting what works for them in external or physical systems into ALTERED, and building
from there. Knowledge-strategy consulting along the way.

**The outcome, in his words:** "help my customers overcome issues they've been blocked by for
YEARS, unlocking domains of growth and capability that just wouldn't have been possible without
ALTERED's data tools." Mechanism is the build; outcome is the unblocking. Revenue is never
promised (D019).

**Capacity:** one to ten clients, roughly one new client every three to eight weeks, which buys
about a year of building. Once fulfilment is proven, more may be taken on without outpacing
delivery.

**Re-open cost:** Very high. Page, script, payments, and fulfilment all inherit this.

### D079 - the deposit is $2,500

**Verdict:** $2,500 down, balance toward $12,500. Supersedes the $1,000 agent pick in D065.

**Why (his reasoning):** it means the buyer is "actually serious and not on a tight budget", it
gives him "the aura/energy to offer the best thing I can confidently", and two of them are the
hard yes to leave the job. "Then, I only need to close 2 pre-sales a month for 1-4 months, then
convert them to the full package price."

**Condition he attached:** "definitely not [out of my mind] if we're delivering something
significant upfront." D080 is what makes the number honest. If D080 shrinks, this number is
re-opened.

**Why a deposit at all, rather than the full ticket alone:** selling only a finished product means
one to three months of build before the first sale. The pre-sale predates that build so it can be
funded and faster. Those who believe in it and would buy anyway "should have no problem putting
[the deposit] down and the rest later for some sort of incentive." Balance timing and incentive:
**OPEN** (Q56).

### D080 - Q50: what arrives in the deposit week

**Verdict:** The service starts immediately. Four deliverables:

1. **A structured onboarding session within 24 hours.** Pre-structured for its purpose:
   questions, feedback, resolving conflicting goals, expectation setting, and a meaningful,
   exciting takeaway. Every subsequent session follows the same cycle - ask, resolve, deliver or
   report, repeat - to keep momentum for both sides.
2. **A hand-built care package**, tailored to their goals and their onboarding answers, in
   packaging worth keeping on a shelf. Custom mailers printed upfront or locally; shipped within
   one to two weeks because that is the real lead time. Contents and unit budget: **OPEN** (Q58).
3. **The Koa runway**: an outbound-only iMessage sequence. Each message is sent at a fixed time
   with a canned intent, generated per person by AI from their aggregated answers so each one is
   more personal than the last; replies are collected as answers, never interpreted in a
   back-and-forth, so there is no concurrency to manage. Progress cards as precise PNGs. A
   continuous sequence rather than a countdown - the loading-screen feel of an adventure game,
   rotating insightful questions and unlocks that build on each other, rooted in generalised
   offer, leads, and one-person-business frameworks. Everything collected pre-loads Koa at launch
   so nobody starts from zero. It may send Koa's contact card.
4. **A personal page** - "1/10", the exclusivity of their spot, in a concrete, brutalist,
   blackout-with-warm-lamp aesthetic (an R3F render or a high-detail 2D page; the Vercel Ship
   badge page is the reference). Only if it can be scoped solid; not a promise until it exists.

**Not offered:** the Cursor knowledge-base setup as an interim product. "Anyone can hack that in
with Claude Code, and that's a distraction for me and for them from the purpose of ALTERED.
Sometimes, it's better to wait. If we give them just enough to wait, that is the best outcome."

**Authorship rule for these deliverables:** "nothing code or product-related should be generated.
All hand-verified. The handcrafted authenticity is the part that makes it valid." The runway is
product-shaped, so it is his, in his repo, by hand. The page and the package design are
go-to-market and may be generated here with his approval, disclosed as always.

**Re-open cost:** High. D079 depends on it.

### D081 - Q51: the buyer is the solo, hyper-committed builder

**Verdict:** Option b. Builder, thinker, founder, or creator, technical or not, with a direction
they cannot hold. Disqualification list unchanged (D018): no budget, procrastination we cannot
solve, a skill gap we cannot close, no direction at all. Supersedes the word "technical" in D018
as a proxy for coding ability: "That was an easy filter for intelligence... this isn't an API or
developer tool." The budget rule does the filtering now.

**Why:** "broad enough to capture all high-detail thinkers/builders, but specific enough that they
crave the minimalism, perfection, and control that I aim to offer." No perfect noun is required:
"as long as they have the pain and meet the constraints, we win."

**Related fact:** he has started posting daily talking-head reels on his personal Instagram to
test the six-month personal-brand theory. That audience, grown toward people who care about the
depth of the topics, is the mirrored ICP.

### D082 - Q52: no hard product date

**Verdict:** Option c. The service is the promise; the product arrives when it is ready, with a
soft "Est. November" that can move. Supersedes D024's published launch date and its
refund-if-missed mechanic. D040's list (memory, self-scheduled reach-outs, voice notes, notes
import) remains the description of the mechanism core, now under the soft estimate rather than a
date.

**Why:** "life happens and I KNOW there will be people that don't care as much about the date,
they just want it to happen." A hard deadline buys scarcity energy; "making it continuous but very
intimate with tight progress and a massive promise is more attractive." The runway sequence
therefore runs continuously rather than as a countdown.

**Consequence:** the refund rule in D023 was anchored to a launch date. Its restatement under no
date is **OPEN** (Q57). Until it closes, the page states the refund as guaranteed through the
process and says nothing about timing.

### D083 - Q53: Zernio, Instagram first, X as pass-through

**Verdict:** Zernio is the social API layer (already chosen for publishing in D044). Outreach
leads on Instagram, not X: "I answer and use DMs much more in IG and text almost no one on X."
Free limits first; X reads through Zernio's zero-markup pass-through only once there is proof the
leads are worth paying for. He will spend $20 to $50 on credits when justified, and would rather
save it for the Sendblue number.

**Platform facts (verified 2026-09-07):** Zernio's first two connected accounts are free, DMs are
readable and sendable, and 10,000 sent messages a month are free. Meta's rule is hard: no API can
message an Instagram user who has not messaged the account first, only reply within 24 hours of
their last message, and no API lists another account's followers or searches users. So on
Instagram, sourcing and the first message are manual by rule. The bench's job there is scoring,
drafting, and the ledger; the API's job is reading replies into the sales desk.

**Extends D070:** his personal Instagram account is the sender, for the same reasons the personal
X account was.

### D084 - Q54: the room is iMessage, then Discord if needed

**Verdict:** Direct iMessage threads and one group iMessage thread for the cohort. A minimal
Discord only when something greater is needed. A custom or ALTERED-native group messaging
feature later, if ever, consolidating into ALTERED's primitives. Supersedes D017's Discord at
deposit.

**Why:** Discord is bloated, Slack's style is wrong, and intimacy is the point of a cohort of one
to ten. Building a platform now is "probably not worth the time/effort/tokens".

### D085 - Q55: funnel stages adopted; the checkpoint moves to Sept 14

**Verdict:** Lead, qualified, committed (said yes with a date), reserved (paid), lost, as written
in Q55, every transition an append-only event with a reason. The checkpoint in D064 moves from
Sept 8 to **Sept 14**, same minimum and target: one named commitment with a date, one paid
deposit.

**Financial context (his statement):** lawn income should cover food and rent until roughly
November if managed; student funding of about $7,000 arrives Nov 1 (Athabasca University),
reserved for essentials. "So financially, yes I WANT to win, but it's not an immediate rush... it
is a rush, because our core goal is to make money aside launching ALTERED's core product." The
deadline exists for productivity, not survival.

### D086 - the long-form video is the primary informer

**Verdict:** A long-form video, VSL in shape and "short film" in energy, is the general explainer:
story, use cases, promise, offer. Written as a script first, which doubles as the article; then
shot by him. YouTube, a funnel embed, or both. The landing page stays as the reading surface and
the place the video lives. Timing relative to outreach: **OPEN** (Q59).

**Why:** "what TRULY sells to almost everyone is the purest form of communication besides
real-time... a long-form video. Encoded with emotion, cadence/timing, a narrative, sound/music."
And it is a thing he can make.

### D087 - parked and framed, 2026-09-07

- **iMessage access to arbitrary MCPs is not the product.** ALTERED is the product; a feature that
  connects the ALTERED brain and the iMessage agent to MCP tooling comes later.
- **Group messaging inside ALTERED** is a future feature idea, not a build.
- **The desktop control surface** leans Raycast (keyboard-integrated, snappy, natural beside the
  iMessage companion) over a custom desktop PWA or native app. The name for the thought editor
  ("control plane", "access panel") is open and is his, since it is product.
- **The $5k AI-implementation door-to-door urge** (Sept 6) is logged as a challenge under the
  direction record's protocol. It quoted no recorded reason and defeated none; he named it himself
  as "the typical pivot" and let it pass. It shaped nothing.

---

## Round 7 - the offer's edges closed, the machine spec, payments reality (2026-09-11)

Source: `sources/chats/2026-09-11-round-7-anger-and-the-path.md`. Q56 to Q62 answered, plus
directives on Instagram automation, plan sequencing, payments, and provisioning. One question
(the runway message cadence) was misread and is re-asked; one big one (deposit versus full
ticket) was reopened by him and is registered as Q63.

### D088 - Q56: the balance is due at product access; full payment up front is the target

**Verdict:** Option a. The $10,000 balance is due when the product is in their hands. Payment in
full at deposit is incentivised - and the incentive is added delivery, such as extra one-to-one
sessions, not primarily a discount, because "that's really the most valuable thing to a lot of
people." Instalments are a workaround at his discretion for buyers who cannot pay in full, never
the target. Two instalment mechanics are on the table and undecided: an accredited provider
(Klarna-style, cash up front to us, credit check on them) or self-managed splits (more closings,
collection risk on us). That mechanic is part of Q63's resolution.

**Why:** "cash is tracking the delivery, in that the deposit is for the initial service up until
the product is launched." Monthly instalments from month two would put a collections clock and a
ship clock on us simultaneously, and one client's instalments would not fund full-time anyway.

**Framing note he attached:** "deposit" implies refundability. If heavy service is delivered
before launch, it is closer to a pre-launch service payment, so either the pre-launch effort
stays light enough to refund without loss, or the word changes. Folded into Q63.

**Re-open cost:** Medium. Page copy and the sales brief inherit the wording.

### D089 - Q57: refundable any time before the product is in their hands

**Verdict:** Option a. The deposit is refundable at any time before the product is in their
hands, through the D023 process: they state why, they give feedback, and nothing material has
been consumed. After product access, D023 applies as written.

**Discipline he attached:** at most 75% of deposit cash may be spent (acquisition and living
costs); the rest stays liquid for refunds. Refunds are recovered first - by fixing the reason -
unless the client is wrong for the program, and the vetting is supposed to prevent that case
entirely.

**Re-open cost:** High. It is the honesty claim the page makes.

### D090 - Q58: the care package is locked; designed after the first deposit

**Verdict:** Contents locked: a custom bubble mailer, a hand-written letter with a structured,
sentimental design ("a handwritten letter on some weathered paper of sorts, very brutalist"), a
quality hard-woven jet tag for their keychain (a metal tag idea folded into it as small
lettering), and a sticker pack. Budget: $100 to $200 for the whole first batch, not per unit; no
$500 upfront stock. Timing is a combination of options a and c: the exact contents are decided
now (this decision), but design and production start only after the first deposit, funded by it,
in a 2 to 3 day sprint; shipped within 2 to 3 weeks of the deposit so the runway's collected
answers can tailor the letter; arrival is something to look forward to, not day-one. Production:
local print for quality on the first few, or print-on-demand with a fast sample to him.

**Why:** "It allows us to leverage the capital that they purchase with... It also doesn't
distract us from the marketing and sales, which is what we need to focus on right now."

**Re-open cost:** Low. It is a spec; plan 07 holds the files.

### D091 - Q59: the video comes near the end of marketing setup, before conversion pushes

**Verdict:** The long-form video is scripted and shot after the offer and path are solidified,
the landing page and account bios exist, and roughly 75% of the marketing infrastructure is in
place - and before the conversion push it exists to power. Outreach and lead collection start
before it and do not wait for it. Purpose restated: it informs (the full offer, condensed, high
energy), builds trust (a real face), and carries a stronger call to action than a page because
"it's me telling them directly."

**Attached re-scope of the checkpoint (amends D085's expectation, not its date):** Sept 14
stays, but its realistic content is ICP validation and collected leads, not a paid deposit.
"I don't even know if we can get to the point where we're prepared to take a deposit by
September fourteenth." The deposit experience - call structure, workflows, what to say, what to
give, touchpoint schedule, where it is recorded - needs another week or two of design before
deposits are confidently accepted, because the deposit experience must be smooth and engaging,
never radio silence. A deposit is still taken early if someone is ready and confident.

**Re-open cost:** Low.

### D092 - Q60: his hands write the runway, and nothing else, until money

**Verdict:** Option a. Until the first deposit, his hand-written code is the runway only: the
outbound-only sequence (SMS through Twilio is acceptable and simple; channel choice is Q66), the
canned intents, the answer store. Recipients can be added by writing a phone number to the
database by hand; no landing-page bridge to the generated repo is needed for v1. The commit
covenant and cleanup list are stashed as a later project; while hand-coding the runway he keeps
that one area clean by review rather than building certification tooling first. Nothing past the
runway - "the point of the runway is to provide time to do the further thing."

**Definition fixed:** the runway is the delivery segment between deposit and product launch.
His hands touch only what affects the period around the deposit; long-term product development
waits until runway revenue sustains it.

**Re-open cost:** Medium; Q63's resolution feeds back into how heavy the runway must be.

### D093 - the session cadence is weekly, 30 to 45 minutes, at a locked time

**Verdict:** Each client gets one weekly session of 30 to 45 minutes at a recurring time they
pick at onboarding, weekends included, adjustable when either side is unavailable. The rest of
the week is his: processing the session's results and planning the next one. At full capacity
of ten clients this is about seven hours of calls a week; 60% of his calendar stays free for
development. Over-the-wire message threads carry anything between sessions. Refines D078's
"30 to 150 minutes" to this narrower default; session one (onboarding) may still run longer.

**Note:** this arrived as his answer to Q61, which actually asked about the automated runway
message cadence, not calls. The question was written too tersely (his stated complaint) and he
answered the more important question. The message cadence is re-asked as Q64 with the cost
model stated plainly: automated messages take none of his time.

**Re-open cost:** Low. "Let's run with that for now. We can refine it later."

### D094 - Q62: the personal page is built after the first deposit, fed by the payment

**Verdict:** Option a. The "1/10" page is built after the first deposit, for that person, and
the design is reused for the next. The payment redirects to it. It pulls the buyer's details
from the payment record, and the payment form collects the shipping address for the care
package, so the page can double as the confirmation that fulfilment has begun.

**Re-open cost:** Low.

### D095 - the outreach machine: automated sourcing, one-tap approved sending, no scrolling

**Verdict:** He does not scroll, does not paste profiles, and does not want to hand-type sends.
The system sources: seeded from the accounts he named (Dan Koe, Alex Hormozi, Zach Kravitz
style) and his own following list at @inducingchaos, it finds candidate profiles, scrapes what
scoring needs (bio, posts, reel transcripts through public tools where useful), vets them, and
presents them in a control panel where he 1) reviews the profile, 2) approves or edits the
message, 3) hits send. Converting his Instagram to a business account is acceptable if it
unlocks capability. Paste-in remains as a fallback input, not the primary mode. Supersedes the
manual-sourcing framing of D083 and the "he sends by hand from the app" mechanics of D069's
first slice; HITL approval per send is unchanged and remains binding (D003).

**Platform reality (verified 2026-09-11 against Zernio's own docs):** the official Instagram
API cannot send a first message to a user who has not messaged the account first, on any
account type; Zernio's free 10,000 messages a month are replies inside Meta's 24-hour window.
Cold sending exists only through grey-market browser-automation tools (account warmup, proxies)
whose own copy says to use accounts you can afford to lose. So: sourcing and drafting are fully
automatable at low risk without touching his account; the send step's mechanism (one-tap manual
from his account versus a burner-account automation tool) is Q65. No automation ever runs
logged in as his personal account.

**Re-open cost:** Medium. Plan 02 is re-planned around this.

### D096 - plans run in series, one chat at a time

**Verdict:** Plans execute sequentially, not in parallel. One chat, one plan, one merge; he
reviews and refines each before starting the next. "I can only keep up with one chat at a
time." Supersedes the parallel note in `plans/README.md`.

**Re-open cost:** Low.

### D097 - payments: e-transfer first, Stripe after incorporation, PayPal as card fallback

**Verdict:** His Stripe account is limited until proof of incorporation is submitted; it cannot
accept payments today. The interim rail is Interac e-transfer for Canadian buyers, proof by
screenshot, recorded by hand in the ledger, with a small discount as the incentive to use it.
PayPal is the fallback when a buyer must pay by card. Crypto only if a buyer insists. He
incorporates through Ownr (roughly $500) once the first deposit funds it, then unblocks Stripe.
Not switching processors wholesale. Google Sheets was offered as an interim CRM; declined -
the plans already carry Postgres and the ledger, and a second store of truth violates D058.

**Re-open cost:** Low; this is sequencing, not architecture. Plan 05's interim path is updated.

### D098 - provisioning waits for alignment

**Verdict:** No credentials are provisioned yet. He will provide all environment variables in
one batch after another round or two of alignment settles what is actually needed. The TODO
list stands but is not urgent until then. Supersedes the urgency, not the content, of the
"Waiting on the owner" register.

**Re-open cost:** None.

### D099 - challenges logged 2026-09-11: the anger doctrine, the B2B pivot, the mirror product

Logged under the direction record's protocol; none acted on. The alignment answer was given in
chat the same day.

- **The anger doctrine** is a fuel-management insight, not a path change: internalised anger as
  deliberate work fuel, aimed at the hardest logically-efficient move inside legal and
  good-faith boundaries. Adopted as posture; it changes what he does with flow hours, not what
  the plan is.
- **The B2B SMS pivot and the $1-a-day daily-feature app** are challenges. Neither quoted nor
  defeated a recorded reason (D062's bar). He named the B2B case's own condition himself: it
  wins only if it reaches $1,800 a month in about two weeks of off-path work, which its own
  fulfilment obligations make unlikely. Both parked.
- **The generated mirror product** (a generated tier of ALTERED shipped before the hand-written
  core) was raised and answered by his own sentence: "maybe the TRUE value is NOT speed or
  feature-richness here... BUT LIMITED, REFINED ACCURACY of the software designed by me." The
  hard wall (D016) stands. Generation stays on go-to-market, tooling, and the runway's
  surroundings; the product core stays his.
- **A voice layer** (ElevenLabs phone-call latency) is noted as a future Koa capability, not a
  build.

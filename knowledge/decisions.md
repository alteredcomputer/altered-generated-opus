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

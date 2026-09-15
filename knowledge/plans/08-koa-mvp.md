# Plan 08 - Koa MVP, generated

**Status:** ready pending Round 9 (Q69 confirms this scope; Q70 the wall; Q71 Sendblue timing;
Q72 the access policy). Phase 1 can build against a mock before any credential exists.

**Depends on:** nothing to start; Sendblue credentials to go live; plan 01 later for operator
views. **Unblocks:** the product, the funnel (D103), the demo content engine (D110), and the
$12,500 close (D102).

This plan exists because of D100: the MVP is generated, under the guardrail conditions recorded
there, with the escalation ladder (generate, correct, hand-coded primitive, thinnest slice) and
the inverted challenge protocol (fix generation concerns before any flip back to hand code).
D107's model, context, and cost rules bind every agent that works this plan.

## Outcome

A person texts the number (or taps the button on `altered.computer/go`) and is talking to Koa on
iMessage: a genuinely useful alignment agent that remembers everything they have told it,
follows tangents, collects the onboarding intents as guidelines rather than a script, schedules
its own follow-ups by judgment of their texting energy, and leans about half toward the program
until they hit the wall (Q70). The owner uses the same Koa daily on his own phone as the
demonstration user. Every inbound, generation, and outbound is an event in a ledger precise
enough to diagnose any duplicate or timing bug from data alone.

## Locked inputs

D100 generated MVP and its guardrails; D101 full Koa, no outbound-only sequence, judgment-based
cadence, Sendblue limits (free replies inside 24h of their last message; 150 follow-ups per day
beyond that); D102 the offer it sells toward; D103 inbound-led funnel, `/go` redirect; D104 the
number, 50% sales lean, a wall, HITL for sensitive topics; D106 program structure it references;
D107 model and cost governance; D110 the owner is the demo user; D111 the Redis
interrupt-and-continue sketch as concurrency design input and the observability-first
requirement; D023/D089 refund honesty in anything Koa claims; D019 outcome-led, never revenue.
Prior art: the previous attempt burned roughly fifteen commits on iMessage concurrency with no
event data to diagnose from (`prior-art.md`); observability lands before cleverness.

## Scope, in phases (each phase merges alone, in series, D096)

1. **The loop.** Sendblue webhook (signature verified, fail-closed when the secret is absent;
   the `/api/webhooks/sendblue` stub grows up), message store, one agent turn (AI SDK v7 through
   OpenRouter, model from settings), reply send behind `OUTBOUND_ENABLED` plus `koa.sendEnabled`,
   and a recipient allowlist that admits nobody when empty (Q72). Until credentials exist, a
   mock Sendblue adapter behind the same interface, driven by a CLI for local conversation.
2. **Memory.** pgvector on Neon: embeddings over messages and distilled facts (a compaction pass
   that turns threads into durable facts with provenance), retrieval into the system context,
   per-person. This is the "persistent memory" the offer names; data is durable and migrates by
   transform later (D100).
3. **Self-scheduling.** A `scheduled_messages` table, an agent tool to schedule and cancel its
   own future messages with a stated reason, a cron drain, and the judgment cadence of D101:
   engaged people get an evening check-in, dry ones get space then a morning touch, unresponsive
   ones get one final contextual sign-off. Sendblue follow-up limits enforced at the sender,
   counted per day.
4. **Concurrency and the event ledger.** Per-conversation serialisation with a short burst
   window (messages arriving while a generation runs are collected; the reply addresses the
   latest state), idempotency keys on sends so a retry can never double-text, and the event
   ledger: every inbound, generation start and end (with model, tokens, cost), outbound, skip,
   and error, timestamped and correlated. The Redis interrupt-and-continue sketch (D111) is the
   design input; if a simpler Postgres-lock burst window meets the behaviour, prefer it and
   record why. Build the ledger first, the cleverness second.
5. **The wall and sales mode.** Per-user daily token budget (fail-closed, silent degradation is
   forbidden - Koa says it has hit its limit for the day rather than quietly worsening), the
   wall per Q70's answer, the 50% sales lean in the system prompt reading the offer from
   `knowledge/offer.md` truth, and a sensitive-topic flag that holds a draft for HITL approval
   instead of sending (queue readable by CLI until plan 01's dashboard exists).
6. **Public.** `/go` on the site opening the `sms:` link (mount-triggered, smoothest available
   mechanism), the number live per Q71/Q72, per-user and per-day cost views by CLI, and the
   allowlist deliberately widened per Q72's answer.

## Not in scope

Voice (ElevenLabs and the Railway long-running server, D111). The thought editor. Group
messaging. Payments inside the thread (links come from plan 05's rail). The dashboard views
beyond CLI reads (plan 01). Instagram (plans 02 and 06). Anything in the owner's hand-written
repo - the hard wall stands in both directions.

## Design

- **Effect v4 services, typed errors, structured logs** with correlation ids on every event, per
  the shared technical decisions in `plans/README.md`. Every model call logs tokens and cost to
  the ledger; cost queries are a select, not an estimate.
- **Prompt injection:** everything a texter says is untrusted. Delimited as data in the prompt;
  tool access is least-privilege (the scheduling tool can only schedule for the thread it runs
  in); no tool can read another person's memory. Memory retrieval is scoped by person id at the
  query.
- **Observability before features** (D111, prior art): phase 4's ledger schema is designed in
  phase 1 and every phase writes to it from day one, so no phase ships blind.
- **The system prompt is data,** stored in settings with versioning, editable without a deploy
  (D009); the sales lean, onboarding intents, and cadence strategy live there as named sections.
- **Fail closed everywhere:** absent webhook secret rejects, empty allowlist admits nobody,
  absent budget config sends nothing, kill switches default off.
- **Disclosure:** the public surface uses the Q73 naming; the site footer carries the
  generated-and-disclosed line as it already does (D047).

## Steps

Each phase is one branch, one merge, in series, with the D107 rules: explicit Opus 5 minimum for
coding agents, roughly 300k context cap then summarise or restart, state saved to the repo every
turn, cost reported against progress. Phase order as in Scope. Before each phase: update this
plan's notes and the graph nodes. After each: quality pass, security pass, graph reconciliation,
`pnpm check`, `pnpm build`, `state.md`, merge.

## Verification

- Phase 1: a mock conversation round-trips locally by CLI; a webhook with no secret configured
  is rejected 503; an empty allowlist refuses everyone; kill switches off means no send attempt
  is even constructed.
- Phase 2: memory retrieval returns only the texter's own rows under an adversarial query test.
- Phase 3: a scheduled send respects the follow-up budget and cancels when the person replies
  first.
- Phase 4: a burst of three rapid inbounds produces exactly one reply addressing the latest
  message, proven by the ledger; a forced send retry produces no duplicate.
- Phase 5: the token budget stops generation with a stated message; the wall behaves per Q70.
- Phase 6: `/go` opens a compose window to the right number on iPhone Safari.

## Security pass specifics

- Webhook signature verified, replay considered, rejected outright absent keys.
- No secret in a log line, an error message, or a client bundle; Sendblue and OpenRouter keys
  are `Redacted`.
- Person-scoped reads at the query for messages, memory, and schedules.
- The HITL hold path cannot be bypassed by prompt content; the sensitive flag is decided by a
  classifier plus rules, and a held draft never sends without operator action.
- Outbound sends sit behind `OUTBOUND_ENABLED` and `koa.sendEnabled`, both default off, and the
  allowlist until Q72 widens it.

## Feature graph nodes

`koa` (root) with `koa-webhook`, `koa-store`, `koa-agent`, `koa-memory`, `koa-scheduler`,
`koa-concurrency`, `koa-ledger`, `koa-wall`, `koa-hitl`, `koa-go-redirect`. Controls:
`koa.sendEnabled`, `koa.allowlist`, `koa.systemPrompt`, `koa.dailyTokenBudgetPerUser`,
`koa.followupDailyCap`, `koa.burstWindowMs`, `ai.model.koa`, `ai.model.embedding`,
`ai.model.sensitiveClassifier`.

## Agent notes

- 2026-09-15 (planning agent): scope proposed to the owner as Q69 with phases 1 to 6; his
  confirmation or trim lands here before phase 1 starts. The previous attempt's concurrency
  failure was an observability failure first (his own words in the source archive); that is why
  the ledger is designed in phase 1 rather than added in phase 4.

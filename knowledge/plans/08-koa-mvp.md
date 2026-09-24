# Plan 08 - Koa MVP, generated

**Status:** in progress. Phase 1 (the loop) done and merged 2026-09-24; phase 2 (memory) is
next. Round 9 confirmed the scope (D112), the wall as a threshold (D113), Sendblue timing
(D114), and access (D115). Round 10 (Q76 to Q83) supplies Koa's first-reply copy, the intents,
the threshold numbers, and the HITL surface; until answered, those are fail-closed placeholders
and the allowlist stays closed.

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
D107 model and cost governance (context cap 150k, D119); D110 the owner is the demo user; D111
the Redis interrupt-and-continue sketch as concurrency design input and the observability-first
requirement; D023/D089 refund honesty in anything Koa claims; D019 outcome-led, never revenue.
Round 9: D112 voice notes saved and transcribed from day one; D113 the wall is a threshold on
the full product (memory and reach-outs on both sides); D114 Sendblue live when phase 1
deploys, credentials already in Vercel; D115 allowlist, then invited prospects, then public;
D116 the label "Koa - early access"; D122 the mirror as part of what the program sells.
Prior art: the previous attempt burned roughly fifteen commits on iMessage concurrency with no
event data to diagnose from (`prior-art.md`); observability lands before cleverness.

## Scope, in phases (each phase merges alone, in series, D096)

1. **The loop.** Sendblue webhook (signature verified, fail-closed when the secret is absent;
   the `/api/webhooks/sendblue` stub grows up), message store, one agent turn (AI SDK v7 through
   OpenRouter, model from settings), reply send behind `OUTBOUND_ENABLED` plus `koa.sendEnabled`,
   and a recipient allowlist that admits nobody when empty (D115). A mock Sendblue adapter
   behind the same interface, driven by a CLI for local conversation, so the loop is testable
   without spending a message. **Voice notes (D112):** an inbound with a media attachment is
   stored as source data (the media URL and the fetched bytes or a durable copy), and its
   transcript is produced by a model named in settings and stored beside it, so the agent turn
   reads the transcript and a human can read it later. Nothing inbound is dropped.
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
   wall per D113: a threshold of time, cost, or milestone on the **full** product - memory and
   reach-outs work identically before and after - past which the thread shifts to the program
   conversation (numbers and behaviour per Q78 and Q79); the 50% sales lean in the system
   prompt reading the offer from `knowledge/offer.md` truth including the mirror (D122); and a
   sensitive-topic flag that holds a draft for HITL approval instead of sending (surface per
   Q83; CLI queue at minimum).
6. **Public.** `/go` on the site opening the `sms:` link (mount-triggered, smoothest available
   mechanism), the number live per D114/D115 (which number: Q81), per-user and per-day cost
   views by CLI, and the allowlist deliberately widened per D115: invited warm prospects first.

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
coding agents, roughly 150k context cap (D119) then summarise or restart, state saved to the repo every
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
- Phase 5: the token budget stops generation with a stated message; the wall behaves per D113
  and Q78/Q79, and reach-outs still fire for a person before the wall.
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

`koa` (root) with `koa-webhook`, `koa-store`, `koa-voice-notes`, `koa-agent`, `koa-memory`,
`koa-scheduler`, `koa-concurrency`, `koa-ledger`, `koa-wall`, `koa-hitl`, `koa-go-redirect`.
Controls: `koa.sendEnabled`, `koa.allowlist`, `koa.systemPrompt`, `koa.dailyTokenBudgetPerUser`,
`koa.trialDays`, `koa.followupDailyCap`, `koa.burstWindowMs`, `ai.model.koa`,
`ai.model.embedding`, `ai.model.transcription`, `ai.model.sensitiveClassifier`.

## Agent notes

- 2026-09-15 (planning agent): scope proposed to the owner as Q69 with phases 1 to 6; his
  confirmation or trim lands here before phase 1 starts. The previous attempt's concurrency
  failure was an observability failure first (his own words in the source archive); that is why
  the ledger is designed in phase 1 rather than added in phase 4.
- 2026-09-24 (orchestrating agent): Round 9 answered; status to in progress. Voice-note
  ingestion added to phase 1 (D112). The wall redefined: free Koa is the full product, gated by
  threshold not feature (D113); the phase 5 text above is rewritten accordingly. Sendblue,
  Neon, Redis, and OpenRouter values confirmed present in the Vercel development environment by
  a names-only check; the mock adapter still leads so no message is spent by accident. Phase 1
  is delegated to a fresh-context Opus 5.5 agent (D124) with this file as its brief.
- 2026-09-24 (phase 1 agent, Opus 5.5): **phase 1 done.** What exists: `@opus/db` (schema,
  migrations 0000 and 0001, `Database` over the Neon HTTP driver, the settings store and CLI) and
  `@opus/koa` (webhook verification and handler, store, ledger, voice notes, agent turn, mock and
  Sendblue messengers, the receive and respond pipeline, the CLI). The route at
  `/api/webhooks/sendblue` delegates to `handleSendblueWebhook`.
  - **Sendblue's webhook scheme, verified against
    [docs.sendblue.com/getting-started/webhooks](https://docs.sendblue.com/getting-started/webhooks/)
    ("Webhook Security"):** no HMAC and no timestamp. The secret configured on the webhook (per
    webhook, global, or legacy) is sent verbatim in a request header. The docs do not name the
    header; Sendblue's official Chat SDK adapter (`chat-adapter-sendblue` 0.2.0 on npm, linked from
    their docs) defaults it to `sb-signing-secret`, which is what we check, in constant time over
    SHA-256 digests. Replay: the docs say delivery can repeat (3 retries on 5xx, 45-second
    timeout) and to dedupe by `message_handle`; we store it as the unique
    `provider_message_id`, so a replay is a recorded skip. Receive payload fields used:
    `message_handle`, `from_number`, `content`, `media_url` (expires after 30 days), `is_outbound`,
    `status` ("RECEIVED"), `group_id`. Send: `POST https://api.sendblue.com/api/send-message` with
    `sb-api-key-id` and `sb-api-secret-key`, body `number`, `from_number`, `content`; Sendblue
    documents no idempotency key, so ours is a unique key claimed in the database before the send.
  - **Verified end to end against the dev Neon database and OpenRouter:** migrations applied;
    settings seeded (send off, allowlist empty, placeholder prompt, models
    `anthropic/claude-sonnet-5` and `google/gemini-3.8-flash`); `pnpm run koa chat` refused the
    test number while the allowlist was empty, then held a three-turn conversation once it was
    allowlisted (about $0.0016 per turn, recorded in the ledger) and declined a prompt-injection
    attempt. Under `next start` the route answered 401 with no or a wrong header, 200 with the
    real secret, treated the replay as a duplicate, and the deferred turn recorded "OUTBOUND_ENABLED
    is off". The allowlist was emptied again afterwards. The dev database keeps the test person
    `+15555550123` and its messages and events. Total model spend: under two cents.
  - **Could not do:** transcribe a real iMessage voice note (none available). OpenRouter accepts
    audio only as base64 in wav, mp3, aiff, aac, ogg, flac, m4a, or pcm; if Sendblue delivers
    Apple's `.caf`, transcription is recorded as an error event and the message is kept. A
    one-second silent WAV came back from `google/gemini-3.8-flash` as invented text ("I made a
    joke."), so transcripts can hallucinate. First real voice note: check `pnpm run koa ledger`.
  - **Deviations and calls made:** media bytes are stored in Postgres (`media` table, bytea)
    because no bucket may be provisioned; this is a durable copy, with a graph todo to move to
    object storage. Group-thread messages and non-E.164 senders are acknowledged and logged but
    not stored (group messaging is out of scope). The turn runs in `next/server` `after()` so a
    slow model cannot push Sendblue into a retry; the inbound is persisted before the 200. The
    outbound decision is made before generation, so a turn that cannot send spends nothing. The
    whole history is sent each turn until phase 2. `messages` and `events` carry an identity `seq`
    for ordering (timestamps tie). `web-imessage-webhook` was folded into `koa-webhook` and
    retired. Seeded model names and the placeholder prompt are values in settings, not decisions;
    change them with `pnpm run db settings set`.
  - **For phase 2:** add pgvector through a new migration; scope every retrieval by `person_id`
    in the query, as `Store` does; record embedding calls in the ledger through `Models`.

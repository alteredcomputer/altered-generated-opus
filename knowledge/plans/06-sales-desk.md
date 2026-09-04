# Plan 06 - Sales desk

**Status:** waiting. **Blockers:** plan 01 (shell and auth) and plan 04 (the offer the desk
sells). Sendblue credentials exist in Vercel. Sending anything to a real recipient additionally
needs the owner's approval in chat, recorded in `constraints.md`, and both kill switches on.

**Depends on:** 01, 04, and plan 02's ledger for prospects and funnel events. **Unblocks:** the
long-term selling shape (D073).

## Outcome

Someone texts the number from the page. The message is verified, stored, and tied to a prospect
(matched from the bench when they came from outreach, created otherwise). Within seconds the
agent has drafted a reply from the locked offer and the conversation so far, and the owner's phone
shows a one-line notification with a link. He opens `/dashboard/desk`, reads the thread and the
draft, edits if he wants, taps send. The reply goes out over iMessage. Nothing is ever sent that he
did not approve. Drafts that touch the escalation topics are marked so he slows down on them.
Every message in and out is a row; the funnel stage is derived from events he records with one
tap: qualified, committed, lost.

## Locked inputs

D001 and D002 the iMessage line is human-facing; D035 burst mode and no custom concurrency
machinery (see design note); D036 and D057 the operator agent reports and does not delegate; D042
the thread closes; D045 hard escalation topics: product claims beyond the locked list, the
launch date, refunds; D050 webhook at `/api/webhooks/sendblue`; D054 notify by iMessage, approve
on the dashboard; D058 funnel events in our database; D073 chat closes, the HITL desk is the
long-term shape; Q32 whether "application" screens (pending); Q55 stages.

## Scope

1. **Inbound**: replace the inert webhook handler with one that verifies the provider signature
   (rejecting outright when the secret is absent), deduplicates by provider message id, stores
   the message, and resolves or creates the prospect. Plan 02's tables are reused; a
   `conversations` and `messages` pair is added.
2. **Drafting**: an `Advisor` service that composes the reply from: the locked offer facts (plan
   04's `offer.json`), the sales brief (`knowledge/sales-brief.md`: tone, the qualification
   questions, the disqualification list, what is never claimed), and the thread. Output is a
   draft with a list of topics it touched; any escalation topic sets a flag. Model name from
   settings. Tokens and cost logged.
3. **Notification**: one line to `OPERATOR_PHONE_NUMBER` over Sendblue, with the desk link, when
   a draft is ready. Behind `OUTBOUND_ENABLED` and `outbound.imessage`. Batched: if several
   messages arrive within the burst window, one notification.
4. **Desk screen**: thread list sorted by waiting time; thread view with messages, the draft, an
   editor, send, and stage buttons (qualified, committed, lost, with a reason). Send writes the
   outbound message row first, then calls Sendblue, then records delivery state from the
   provider's response and later status webhooks.
5. **Stale drafts**: if a new inbound message arrives while a draft is pending, the draft is marked
   stale and regenerated; the desk shows the newest only. The operator never sends a reply written
   against an older thread.
6. **Screening** per Q32: if "application" is real, the brief carries the qualifying questions
   and the desk shows a qualification checklist per thread that the operator ticks; the agent
   proposes ticks from the thread, the human confirms.

## Not in scope

Autonomous replies (D045 becomes relevant only if the owner later chooses to let the agent send
without approval; that is a new decision). X direct messages: replies on X are read by the owner
in the X app and logged through the bench until the X DM read endpoints are worth their cost.
Voice notes, memory, and anything product-shaped (D016).

## Design

- **Why no Chat SDK here.** D035 chose burst mode on the Chat SDK to tame an autonomous agent's
  concurrency. A human-in-the-loop desk has no autonomous turn: inbound is stored, drafting is a
  pure function of the thread that can be rerun, and sending is a single operator action. There
  is nothing to lock or abort, so the SDK is not used for this surface. If autonomous replies are
  ever approved, that is the moment to adopt it in burst mode as D035 says.
- **Two switches for every send.** `OUTBOUND_ENABLED` and `outbound.imessage`. A send with either
  off is a typed refusal shown to the operator, logged, and not retried.
- **Recipient allowlist for the first live sends.** `imessage.allowedRecipients` in settings. Empty
  means nobody, including the operator. The owner adds his own number first, tests, then adds the
  first real prospect. This is the fail-closed shape prior-art A1 lacked.
- **Content is never truncated** (prior-art A2). A draft longer than the provider's limit is split
  at sentence boundaries into numbered bubbles or refused; the thread shown to the model is the
  whole thread.
- **Prompt injection.** Inbound text is untrusted. It is placed in a delimited data block; the
  brief and the offer facts are the only instruction sources; the parser rejects anything that is
  not a draft. Test with a message that tells the agent to offer a discount.
- **Escalation flags are not blocks.** The owner approves everything anyway; the flag exists so
  the topics in D045 get a slower read.

## Steps

1. Signature verification and message storage in the webhook, with tests for absent secret, bad
   signature, and duplicate id. Commit.
2. `conversations` and `messages` tables; prospect resolution. Commit.
3. `knowledge/sales-brief.md`, drafted from the compass, D018, D019, D023, D045, and the direction
   record's objections. Marked draft until the owner has read three real drafts. Commit.
4. `Advisor` with structured output, escalation flags, stale handling. Tests on the parser and the
   flags. Commit.
5. Sendblue send behind the two switches and the recipient allowlist; notification path. Tests
   for every refusal case. Commit.
6. Desk screens at 390px. Commit.
7. Live test to the owner's own number only, after his approval in chat is recorded in
   `constraints.md`. Commit the record.
8. Reconcile the feature graph, security pass, `state.md`, merge.

## Verification

- Webhook rejects unsigned and mis-signed requests; a replay yields one message row.
- With either switch off, send is refused and logged; with both on and an empty allowlist, send is
  refused and logged.
- A stale draft is never sendable; the desk shows only the regenerated one.
- The operator receives exactly one notification for a burst of three inbound messages.

## Security pass specifics

- All desk routes behind `requireOperator()`.
- Signing secret and API credentials `Redacted`; absent means reject.
- Operator identity comes from the dashboard session, never from the sender's phone number.
- No inbound content in log lines above debug level; message ids only.
- The allowlist and both switches re-read for the empty case before merge.

## Feature graph nodes

`desk` (root) with `desk-inbound`, `desk-conversations`, `desk-advisor`, `desk-notify`,
`desk-send`, `desk-screen`; `web-imessage-webhook` is superseded by `desk-inbound` (use the
`supersedes` relation). Controls: `outbound.imessage`, `imessage.allowedRecipients`,
`ai.model.advisor`, `desk.burstWindowSeconds`.

## Agent notes

- 2026-09-04 (planning agent): the prior attempt spent fifteen commits fighting iMessage
  concurrency for an autonomous agent (prior-art A3). This desk avoids the problem by design
  rather than solving it. Do not reintroduce an autonomous path "just for testing".

# Plan 05 - Money rails

**Status:** waiting. **Blockers:** Q63 (whether the close leads with the full ticket or the
$2,500 reservation) shapes what the checkout sells; Autumn and Stripe are blocked behind
incorporation (D097). The interim path below is live as soon as the owner states his e-transfer
instruction; that is the only rail that can take money today.

**Depends on:** 04 for the stated offer; 01 for the dashboard view of reservations. **Unblocks:**
the Sept 14 target (one deposit paid).

## Outcome

A stranger in the text thread is sent one link, pays the $2,500 deposit, and a `reserved` funnel
event appears in our database within seconds, with the person tied to their prospect row when one
exists. The owner sees it on the dashboard home and receives a one-line iMessage notification
(when the notification path exists, plan 06). Refunds are recorded as events with the reason the
buyer gave, per D023. Nothing charges anyone without the payments kill switch on and the operation
recorded in `constraints.md`.

## Locked inputs

D079: $2,500 reserves toward $12,500; D088 balance due at product access, pay-in-full asked
first with added-delivery incentive (Q68), instalments a workaround only; D089 refundable any
time before product access, at most 75% of reservation cash spent; D097 payments reality:
Stripe limited until incorporation through Ownr, Interac e-transfer with a small discount is
the interim rail, PayPal for card buyers, no processor switch; D082 no hard product date; D039
revenue target; D041 Autumn over direct Stripe once Stripe works; D058 our own events are the
financial truth; D003 payments are an external write, default deny; Q55 stage definitions.

## Scope

1. **Interim path (no code beyond a setting):** Interac e-transfer (D097). The owner states the
   receiving contact and the exact instruction wording buyers get, recorded as
   `payments.interimInstruction` in settings (in the sales script until plan 01 exists). Proof
   is a screenshot; a small discount incentivises the rail. Reservations are recorded by hand
   with `pnpm bench reserved <handle> --amount <cents> --ref <receipt>` from plan 02's ledger.
   PayPal is the card fallback, same manual recording. This exists so no sale ever waits on an
   integration.
2. **Autumn integration:** one product, `layer-1-deposit`, $2,500 one-time. Customer created per
   buyer with our prospect id as the external id. Checkout URL generated server-side per buyer
   (no shared link once Autumn is live, so the payment is tied to a person). Webhook at
   `/api/webhooks/autumn` with signature verification and replay protection, writing `reserved`
   with the payment reference. Absent signing secret means every request is rejected.
3. **Balance and program billing:** the balance is due at product access (D088); pay-in-full at
   the start is a second product. Built after the first reservation, not before; record the
   intent as Autumn products for the balance and any usage allowance. Instalment mechanics
   (accredited provider versus self-managed) follow Q63's resolution.
4. **Refund recording:** an operator action on the dashboard that records the buyer's stated
   reason and feedback, then the refund issued through Autumn behind the payments kill switch. The
   refund window rule (D023) is a setting, not a constant.
5. **Dashboard view:** reservations list, total collected, refunds. Reads events only.

## Not in scope

Subscriptions, the $12,500 balance collection, invoices, tax handling (record the question for
the owner's accountant), and anything that charges automatically.

## Design

- **Kill switches:** `OUTBOUND_ENABLED` and `outbound.payments` must both be true for checkout
  creation and refunds. Webhook receipt is a read and is always on.
- **Idempotency:** webhook events are stored by provider event id before processing; a duplicate
  is acknowledged and ignored, logged as such.
- **The financial truth is the events table**, not Autumn's dashboard. Reconciliation is a
  query comparing our `reserved` events to Autumn's payments, run by hand when needed.
- **Prospect linkage:** the checkout is created from the sales desk or the bench with the
  prospect id, so a payment always resolves to a person and the funnel is complete from first DM
  to money.

## Steps

1. Settings keys `payments.interimInstruction`, `outbound.payments`, `payments.refundWindowDays`; the
   `bench reserved` command in plan 02's ledger if not already present. Commit.
2. Autumn client behind a `Payments` service: create customer, create checkout, issue refund.
   Typed errors. Tests with recorded fixtures. Commit.
3. Webhook route with signature verification, replay store, and the `reserved` event write.
   Tests: missing secret rejects, bad signature rejects, duplicate event id is ignored. Commit.
4. Refund recording action and the reservations dashboard view. Commit.
5. `.env.example`, `turbo.json`, `config.ts`, and `constraints.md` (record the approved
   operation and the date when the owner approves it in chat). Commit.
6. Reconcile the feature graph, security pass, `state.md`, merge.

## Verification

- With `outbound.payments` off, checkout creation returns a typed refusal and logs it; nothing
  reaches Autumn.
- A webhook with no signing secret configured is rejected with 503, not processed.
- A replayed webhook produces exactly one `reserved` event.
- The dashboard total matches a hand sum of the events.

## Security pass specifics

- Webhook: signature verified, replay considered, rejected outright when the key is absent.
- No payment link or customer id in a log line at info level; ids only at debug, never secrets.
- Refund action is behind `requireOperator()` and writes an audit row.
- The interim link is a setting read by the operator only; it is never rendered on the public
  page.

## Feature graph nodes

`payments` (root) with `payments-interim`, `payments-autumn-client`, `payments-webhook`,
`payments-refunds`, `payments-view`. Controls: `payments.interimInstruction`, `outbound.payments`,
`payments.refundWindowDays`.

## Agent notes

- 2026-09-04 (planning agent): the interim path is deliberately manual. A single deposit by the
  checkpoint is worth more than a finished integration a week later, and the manual record keeps
  the funnel truth in our table either way.
- 2026-09-07: deposit is $2,500 (D079). Checkpoint is Sept 14 (D085).
- 2026-09-11 (planning agent): Stripe is limited until the corporation is proven (D097), so the
  interim rail is e-transfer, not a Stripe link. Q56 closed as balance-at-access (D088); Q57
  closed as refundable-before-access (D089). The remaining shaper is Q63. Note for the page and
  the "1/10" flow: D094 assumed address collection through Stripe's payment form; on the
  e-transfer rail the address is collected in the thread or on the personal page instead.

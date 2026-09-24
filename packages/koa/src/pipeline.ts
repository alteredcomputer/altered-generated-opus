import { DatabaseLive } from "@opus/db/client"
import { Settings, SettingsLive } from "@opus/db/settings"
import { Cause, Effect, Layer, Option } from "effect"
import { reply } from "./agent.ts"
import { Ledger, LedgerLive } from "./ledger.ts"
import { Outbound } from "./messenger.ts"
import { ModelsLive } from "./models.ts"
import { type InboundMessage, type Recorded, Store, StoreLive } from "./store.ts"
import { ingestMedia, MediaLive } from "./voice.ts"

type TurnOutcome =
    | { readonly _tag: "Replied"; readonly text: string; readonly messenger: string }
    | { readonly _tag: "Skipped"; readonly reason: string }
    | { readonly _tag: "Failed"; readonly error: string }

/**
 * The synchronous half: persist the message and its inbound event before acknowledging.
 *
 * @remarks
 * A failure here fails the request, so the provider retries and the message is not lost. A
 * replayed delivery finds its provider id taken and is recorded as a skip, never processed twice.
 */
const receive = (message: InboundMessage, correlationId: string) =>
    Effect.gen(function* () {
        const store = yield* Store
        const ledger = yield* Ledger
        const recorded = yield* store.recordInbound(message)

        yield* recorded._tag === "Duplicate"
            ? ledger.record({
                  kind: "skip",
                  correlationId,
                  personId: recorded.person.id,
                  payload: {
                      reason: "duplicate delivery",
                      providerMessageId: message.providerMessageId
                  }
              })
            : ledger.record({
                  kind: "inbound",
                  correlationId,
                  personId: recorded.person.id,
                  payload: {
                      messageId: recorded.messageId,
                      providerMessageId: message.providerMessageId,
                      textLength: message.text.length,
                      hasMedia: message.mediaUrl !== null
                  }
              })

        return recorded
    }).pipe(Effect.annotateLogs({ correlationId }))

/**
 * The asynchronous half: one turn for one recorded inbound. Never fails; every outcome, including
 * an unexpected one, ends in the ledger.
 *
 * @remarks
 * The allowlist is read first and admits nobody when empty (D115). The outbound decision comes
 * before generation, so a turn that cannot be sent spends nothing. The reply's idempotency key is
 * derived from the inbound message id and claimed before the send, so a retried turn cannot text
 * twice.
 */
const respond = (
    message: InboundMessage,
    recorded: Extract<Recorded, { _tag: "Recorded" }>,
    correlationId: string
) => {
    const { person, messageId } = recorded

    return Effect.gen(function* () {
        const settings = yield* Settings
        const store = yield* Store
        const ledger = yield* Ledger
        const outbound = yield* Outbound

        const skip = (reason: string, detail: Record<string, unknown> = {}) =>
            ledger
                .record({
                    kind: "skip",
                    correlationId,
                    personId: person.id,
                    payload: { reason, messageId, ...detail }
                })
                .pipe(Effect.as({ _tag: "Skipped", reason } satisfies TurnOutcome))

        const allowlist = yield* settings.get("koa.allowlist")
        if (!allowlist.includes(person.phone)) return yield* skip("not on allowlist")

        if (message.mediaUrl !== null)
            yield* ingestMedia({
                personId: person.id,
                messageId,
                mediaUrl: message.mediaUrl,
                correlationId
            })

        const decision = yield* outbound.resolve
        if (decision._tag === "Disabled") return yield* skip(decision.reason)

        const generation = yield* reply(person, correlationId)
        const idempotencyKey = `reply:${messageId}`
        const claimed = yield* store.claimOutbound(person.id, idempotencyKey, generation.text)
        if (Option.isNone(claimed)) return yield* skip("reply already claimed", { idempotencyKey })

        const { messenger } = decision
        const sent = yield* messenger
            .send(person.phone, generation.text, idempotencyKey)
            .pipe(Effect.tapError(() => store.markFailed(person.id, claimed.value)))

        yield* store.markSent(person.id, claimed.value, sent.providerMessageId)
        yield* ledger.record({
            kind: "outbound",
            correlationId,
            personId: person.id,
            payload: {
                messenger: messenger.name,
                messageId: claimed.value,
                inReplyTo: messageId,
                providerMessageId: sent.providerMessageId,
                idempotencyKey
            }
        })

        return {
            _tag: "Replied",
            text: generation.text,
            messenger: messenger.name
        } satisfies TurnOutcome
    }).pipe(
        Effect.catchCause(cause =>
            Effect.gen(function* () {
                const ledger = yield* Ledger
                const error = Cause.pretty(cause)

                yield* Effect.logError("Turn failed", { messageId, cause: error })
                yield* ledger
                    .record({
                        kind: "error",
                        correlationId,
                        personId: person.id,
                        payload: { stage: "turn", messageId, error }
                    })
                    .pipe(
                        Effect.catchCause(ledgerCause =>
                            Effect.logError("Could not record turn failure", {
                                messageId,
                                cause: Cause.pretty(ledgerCause)
                            })
                        )
                    )

                return { _tag: "Failed", error } satisfies TurnOutcome
            })
        ),
        Effect.annotateLogs({ correlationId })
    )
}

const ReceiveLive = Layer.mergeAll(StoreLive, LedgerLive).pipe(Layer.provideMerge(DatabaseLive))

/** Everything a turn needs, with the messenger chosen by the caller: live for the webhook, mock for the CLI. */
const respondLayer = <E, R>(outbound: Layer.Layer<Outbound, E, R>) =>
    Layer.mergeAll(StoreLive, LedgerLive, MediaLive, ModelsLive, outbound).pipe(
        Layer.provideMerge(SettingsLive),
        Layer.provideMerge(DatabaseLive)
    )

export type { TurnOutcome }
export { ReceiveLive, receive, respond, respondLayer }

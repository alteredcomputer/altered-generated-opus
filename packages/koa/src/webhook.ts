import { createHash, randomUUID, timingSafeEqual } from "node:crypto"
import { config } from "@opus/core/config"
import { E164 } from "@opus/core/phone"
import { type Config, Effect, Option, Redacted, Schema } from "effect"
import { OutboundLive } from "./messenger.ts"
import { receive, respond, respondLayer } from "./pipeline.ts"
import type { InboundMessage } from "./store.ts"

/**
 * @remarks
 * Sendblue does not sign the body. It sends the webhook secret configured on the account verbatim
 * in this header (docs.sendblue.com/getting-started/webhooks, "Webhook Security"; the header name
 * is the default in Sendblue's official Chat SDK adapter). There is no timestamp to bound replay,
 * so replay is handled by the unique provider message id instead.
 */
const SIGNATURE_HEADER = "sb-signing-secret"

type Authentication = "verified" | "unconfigured" | "mismatch"

const digest = (value: string) => createHash("sha256").update(value).digest()

/**
 * @remarks
 * Hashing both sides first gives equal-length buffers, so the comparison is constant-time without
 * leaking the secret's length. An absent secret refuses everything, whatever the request carries.
 */
const authenticate = (
    presented: string | null,
    secret: Option.Option<Redacted.Redacted<string>>
): Authentication => {
    if (Option.isNone(secret)) return "unconfigured"
    if (presented === null || presented.length === 0) return "mismatch"

    return timingSafeEqual(digest(presented), digest(Redacted.value(secret.value)))
        ? "verified"
        : "mismatch"
}

const optionalText = Schema.optionalKey(Schema.NullOr(Schema.String))

/** The fields of Sendblue's receive payload that Koa reads. Other fields are ignored. */
const SendbluePayload = Schema.Struct({
    message_handle: Schema.NonEmptyString,
    from_number: Schema.String,
    is_outbound: Schema.Boolean,
    status: Schema.String,
    content: optionalText,
    media_url: optionalText,
    group_id: optionalText
})

type Classified =
    | { readonly _tag: "Inbound"; readonly message: InboundMessage }
    | { readonly _tag: "Ignored"; readonly reason: string }

const isE164 = Schema.is(E164)

/**
 * Decides what a verified payload is.
 *
 * @remarks
 * Only a received one-to-one message becomes an inbound. Outbound status callbacks and other
 * webhook types share the endpoint shape and are acknowledged without action. Group threads are
 * out of scope for the MVP and are ignored with a logged reason by the caller.
 */
const classify = (body: unknown): Classified => {
    const decoded = Schema.decodeUnknownOption(SendbluePayload)(body)
    if (Option.isNone(decoded)) return { _tag: "Ignored", reason: "not a message payload" }

    const payload = decoded.value
    if (payload.is_outbound || payload.status !== "RECEIVED")
        return { _tag: "Ignored", reason: "not a received message" }
    if ((payload.group_id ?? "").length > 0)
        return { _tag: "Ignored", reason: "group messages are out of scope" }
    if (!isE164(payload.from_number)) return { _tag: "Ignored", reason: "sender is not E.164" }

    const mediaUrl = payload.media_url ?? ""

    return {
        _tag: "Inbound",
        message: {
            phone: payload.from_number,
            text: payload.content ?? "",
            providerMessageId: payload.message_handle,
            mediaUrl: mediaUrl.length > 0 ? mediaUrl : null
        }
    }
}

/**
 * Handles one Sendblue delivery.
 *
 * @remarks
 * Refuses before reading the body: 503 when no secret is configured (fail-closed, never "accept
 * everything"), 401 when the header does not match. A verified message is persisted with its
 * inbound event before the 200, and the turn is handed to `defer` to run after the response, so
 * a slow model never pushes Sendblue past its 45-second timeout into a retry.
 */
const handleSendblueWebhook = (
    request: Request,
    defer: (turn: Effect.Effect<void, Config.ConfigError>) => void
) =>
    Effect.gen(function* () {
        const { signingSecret } = yield* config.imessageWebhook
        const authentication = authenticate(request.headers.get(SIGNATURE_HEADER), signingSecret)

        if (authentication === "unconfigured") {
            yield* Effect.logError("Sendblue webhook refused: signing secret is not configured")
            return Response.json({ error: "webhook not configured" }, { status: 503 })
        }
        if (authentication === "mismatch") {
            yield* Effect.logWarning("Sendblue webhook refused: signing secret mismatch")
            return Response.json({ error: "unauthorized" }, { status: 401 })
        }

        const body = yield* Effect.option(Effect.tryPromise(() => request.json()))
        if (Option.isNone(body)) return Response.json({ error: "invalid json" }, { status: 400 })

        const classified = classify(body.value)
        if (classified._tag === "Ignored") {
            yield* Effect.logInfo("Sendblue webhook ignored", { reason: classified.reason })
            return Response.json({ received: true, processed: false })
        }

        const correlationId = randomUUID()
        const recorded = yield* receive(classified.message, correlationId)
        if (recorded._tag === "Duplicate")
            return Response.json({ received: true, processed: false, duplicate: true })

        defer(
            respond(classified.message, recorded, correlationId).pipe(
                Effect.provide(respondLayer(OutboundLive)),
                Effect.asVoid
            )
        )

        return Response.json({ received: true, processed: true })
    })

export type { Authentication, Classified }
export { authenticate, classify, handleSendblueWebhook, SIGNATURE_HEADER }

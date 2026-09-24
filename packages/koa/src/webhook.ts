import { createHash, timingSafeEqual } from "node:crypto"
import { E164 } from "@opus/core/phone"
import { Option, Redacted, Schema } from "effect"
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

export type { Authentication, Classified }
export { authenticate, classify, SIGNATURE_HEADER }

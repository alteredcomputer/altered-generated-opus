import { Effect, Option, Redacted } from "effect"
import { describe, expect, it } from "vitest"
import { runKoa } from "./testing.ts"
import { authenticate, classify, handleSendblueWebhook, SIGNATURE_HEADER } from "./webhook.ts"

const SECRET = "test-signing-secret"

const payload = (overrides: Record<string, unknown> = {}) => ({
    message_handle: "99DCC379-DD76-4712-BA65-11EFB33B8CD6",
    from_number: "+15555550100",
    number: "+15555550100",
    to_number: "+15122164639",
    content: "Hello!",
    is_outbound: false,
    status: "RECEIVED",
    media_url: "",
    group_id: "",
    service: "iMessage",
    ...overrides
})

const post = (body: unknown, secret: string | null) =>
    new Request("https://example.test/api/webhooks/sendblue", {
        method: "POST",
        headers: secret === null ? {} : { [SIGNATURE_HEADER]: secret },
        body: JSON.stringify(body)
    })

const handle = (requests: readonly Request[], env: Record<string, string>) => {
    const deferred: unknown[] = []

    return runKoa(
        { env },
        Effect.forEach(requests, request =>
            handleSendblueWebhook(request, turn => deferred.push(turn)).pipe(
                Effect.flatMap(response =>
                    Effect.promise(async () => ({
                        status: response.status,
                        body: await response.json()
                    }))
                )
            )
        )
    ).then(responses => ({ responses, deferred: deferred.length }))
}

describe("signature", () => {
    const configured = Option.some(Redacted.make(SECRET))

    it("refuses everything when no secret is configured", () => {
        expect(authenticate(SECRET, Option.none())).toBe("unconfigured")
        expect(authenticate(null, Option.none())).toBe("unconfigured")
    })

    it("refuses a missing, empty, or wrong header", () => {
        expect(authenticate(null, configured)).toBe("mismatch")
        expect(authenticate("", configured)).toBe("mismatch")
        expect(authenticate(`${SECRET}x`, configured)).toBe("mismatch")
    })

    it("accepts the exact secret", () => {
        expect(authenticate(SECRET, configured)).toBe("verified")
    })
})

describe("webhook handler", () => {
    it("answers 503 when SENDBLUE_SIGNING_SECRET is absent", async () => {
        const result = await handle([post(payload(), SECRET)], {})

        expect(result.responses[0]?.status).toBe(503)
        expect(result.deferred).toBe(0)
    })

    it("answers 401 on a bad signature", async () => {
        const result = await handle([post(payload(), "wrong")], {
            SENDBLUE_SIGNING_SECRET: SECRET
        })

        expect(result.responses[0]?.status).toBe(401)
        expect(result.deferred).toBe(0)
    })

    it("persists a verified message, defers its turn, and ignores the replay", async () => {
        const result = await handle([post(payload(), SECRET), post(payload(), SECRET)], {
            SENDBLUE_SIGNING_SECRET: SECRET
        })

        expect(result.responses).toStrictEqual([
            { status: 200, body: { received: true, processed: true } },
            { status: 200, body: { received: true, processed: false, duplicate: true } }
        ])
        expect(result.deferred).toBe(1)
    })
})

describe("payload classification", () => {
    it("reads a received one-to-one message", () => {
        expect(classify(payload())).toStrictEqual({
            _tag: "Inbound",
            message: {
                phone: "+15555550100",
                text: "Hello!",
                providerMessageId: "99DCC379-DD76-4712-BA65-11EFB33B8CD6",
                mediaUrl: null
            }
        })
    })

    it("keeps the media url of a voice note", () => {
        const classified = classify(
            payload({ content: "", media_url: "https://cdn.example/a.m4a" })
        )

        expect(classified._tag === "Inbound" && classified.message.mediaUrl).toBe(
            "https://cdn.example/a.m4a"
        )
    })

    it("ignores outbound callbacks, group threads, and unknown shapes", () => {
        expect(classify(payload({ is_outbound: true, status: "SENT" }))._tag).toBe("Ignored")
        expect(classify(payload({ group_id: "group-1" }))._tag).toBe("Ignored")
        expect(classify({ is_typing: true, number: "+15555550100" })._tag).toBe("Ignored")
        expect(classify(payload({ from_number: "5550100" }))._tag).toBe("Ignored")
    })
})

import { randomUUID } from "node:crypto"
import { config } from "@opus/core/config"
import type { E164 } from "@opus/core/phone"
import type { DatabaseError } from "@opus/db/client"
import { type SettingInvalid, type SettingMissing, Settings } from "@opus/db/settings"
import { type Config, Context, Data, Effect, Layer, Redacted } from "effect"

class SendError extends Data.TaggedError("SendError")<{
    readonly messenger: string
    readonly detail: string
}> {}

type Messenger = {
    readonly name: "sendblue" | "mock"
    readonly send: (
        to: E164,
        text: string,
        idempotencyKey: string
    ) => Effect.Effect<{ readonly providerMessageId: string }, SendError>
}

type OffSwitch = "OUTBOUND_ENABLED is off" | "koa.sendEnabled is off"

type OutboundDecision =
    | { readonly _tag: "Ready"; readonly messenger: Messenger }
    | { readonly _tag: "Disabled"; readonly reason: OffSwitch }

/**
 * @remarks
 * Both switches must be on, and the master is checked first so its answer is the one reported
 * when both are off. Neither has a default of on anywhere.
 */
const offSwitch = (outboundEnabled: boolean, sendEnabled: boolean): OffSwitch | null => {
    if (!outboundEnabled) return "OUTBOUND_ENABLED is off"
    if (!sendEnabled) return "koa.sendEnabled is off"
    return null
}

const SENDBLUE_SEND_URL = "https://api.sendblue.com/api/send-message"

/**
 * @remarks
 * Sendblue documents no idempotency key on sends. Idempotency is enforced one step earlier: the
 * pipeline claims the key in the database before calling this, and a claimed key is never sent.
 * The key is logged so a provider-side duplicate can still be matched to its claim.
 */
const makeSendblue = Effect.gen(function* () {
    const { apiKey, apiSecret, phoneNumber } = yield* config.imessage

    const send: Messenger["send"] = (to, text, idempotencyKey) =>
        Effect.gen(function* () {
            const response = yield* Effect.tryPromise({
                try: signal =>
                    fetch(SENDBLUE_SEND_URL, {
                        method: "POST",
                        signal,
                        headers: {
                            "content-type": "application/json",
                            "sb-api-key-id": Redacted.value(apiKey),
                            "sb-api-secret-key": Redacted.value(apiSecret)
                        },
                        body: JSON.stringify({
                            number: to,
                            from_number: phoneNumber,
                            content: text
                        })
                    }),
                catch: cause =>
                    new SendError({
                        messenger: "sendblue",
                        detail: cause instanceof Error ? cause.message : "request failed"
                    })
            })
            const body = yield* Effect.tryPromise({
                try: () => response.json() as Promise<{ message_handle?: unknown }>,
                catch: () =>
                    new SendError({ messenger: "sendblue", detail: "response was not JSON" })
            })

            if (!response.ok || typeof body.message_handle !== "string")
                return yield* new SendError({
                    messenger: "sendblue",
                    detail: `status ${response.status}, no message handle`
                })

            yield* Effect.logInfo("Sendblue send accepted", { idempotencyKey })
            return { providerMessageId: body.message_handle }
        })

    return { name: "sendblue", send } satisfies Messenger
})

type OutboundShape = {
    /** Decides whether a send may happen, and only then constructs the messenger that does it. */
    readonly resolve: Effect.Effect<
        OutboundDecision,
        Config.ConfigError | SettingMissing | SettingInvalid | DatabaseError
    >
}

class Outbound extends Context.Service<Outbound, OutboundShape>()("@opus/koa/Outbound") {}

/**
 * The live path. The Sendblue messenger, and the credentials it reads, only come into existence
 * after both switches have been read as on.
 */
const OutboundLive = Layer.effect(
    Outbound,
    Effect.gen(function* () {
        const settings = yield* Settings

        return {
            resolve: Effect.gen(function* () {
                const { outboundEnabled } = yield* config.runtime
                const sendEnabled = outboundEnabled ? yield* settings.get("koa.sendEnabled") : false
                const reason = offSwitch(outboundEnabled, sendEnabled)

                if (reason !== null) return { _tag: "Disabled", reason } satisfies OutboundDecision
                return { _tag: "Ready", messenger: yield* makeSendblue } satisfies OutboundDecision
            })
        }
    })
)

/**
 * The local path: nothing leaves the machine. The reply is handed to `print`, and the pipeline
 * records it in the ledger exactly as it would a real send, marked with the mock's name.
 */
const OutboundMock = (print: (to: E164, text: string) => void) => {
    const messenger: Messenger = {
        name: "mock",
        send: (to, text) =>
            Effect.sync(() => {
                print(to, text)
                return { providerMessageId: `mock:${randomUUID()}` }
            })
    }

    const ready: OutboundDecision = { _tag: "Ready", messenger }
    return Layer.succeed(Outbound, { resolve: Effect.succeed(ready) })
}

export type { Messenger, OffSwitch, OutboundDecision }
export { Outbound, OutboundLive, OutboundMock, offSwitch, SendError }

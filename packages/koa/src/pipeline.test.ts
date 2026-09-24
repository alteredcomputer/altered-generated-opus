import { Effect } from "effect"
import { describe, expect, it } from "vitest"
import { OutboundLive, OutboundMock, offSwitch } from "./messenger.ts"
import type { GenerationRequest } from "./models.ts"
import { receive, respond } from "./pipeline.ts"
import type { InboundMessage } from "./store.ts"
import {
    fakeMedia,
    fakeModels,
    inbound,
    ledgerKinds,
    OTHER_PHONE,
    PHONE,
    runKoa,
    seedSettings
} from "./testing.ts"

const turn = (message: InboundMessage) =>
    Effect.gen(function* () {
        const recorded = yield* receive(message, "test-turn")
        if (recorded._tag === "Duplicate") return yield* Effect.die("unexpected duplicate")

        const outcome = yield* respond(message, recorded, "test-turn")
        return { outcome, kinds: yield* ledgerKinds(recorded.person.id) }
    })

describe("allowlist", () => {
    it("admits nobody when empty, and spends nothing on a refused sender", async () => {
        const calls: GenerationRequest[] = []
        const result = await runKoa(
            { models: fakeModels(calls) },
            Effect.andThen(seedSettings({}), turn(inbound("hello", "m1")))
        )

        expect(result.outcome).toStrictEqual({ _tag: "Skipped", reason: "not on allowlist" })
        expect(result.kinds).toStrictEqual(["inbound", "skip"])
        expect(calls).toHaveLength(0)
    })

    it("refuses a sender who is not on a non-empty allowlist", async () => {
        const result = await runKoa(
            {},
            Effect.andThen(seedSettings({ allowlist: [OTHER_PHONE] }), turn(inbound("hello", "m1")))
        )

        expect(result.outcome).toStrictEqual({ _tag: "Skipped", reason: "not on allowlist" })
    })
})

describe("kill switches", () => {
    it("requires both switches, master first", () => {
        expect(offSwitch(false, false)).toBe("OUTBOUND_ENABLED is off")
        expect(offSwitch(false, true)).toBe("OUTBOUND_ENABLED is off")
        expect(offSwitch(true, false)).toBe("koa.sendEnabled is off")
        expect(offSwitch(true, true)).toBeNull()
    })

    it("constructs no sender and generates nothing when OUTBOUND_ENABLED is absent", async () => {
        const calls: GenerationRequest[] = []
        const result = await runKoa(
            { outbound: OutboundLive, models: fakeModels(calls) },
            Effect.andThen(
                seedSettings({ allowlist: [PHONE], sendEnabled: true }),
                turn(inbound("hello", "m1"))
            )
        )

        expect(result.outcome).toStrictEqual({
            _tag: "Skipped",
            reason: "OUTBOUND_ENABLED is off"
        })
        expect(result.kinds).toStrictEqual(["inbound", "skip"])
        expect(calls).toHaveLength(0)
    })

    it("constructs no sender when koa.sendEnabled is off", async () => {
        const result = await runKoa(
            { outbound: OutboundLive, env: { OUTBOUND_ENABLED: "true" } },
            Effect.andThen(seedSettings({ allowlist: [PHONE] }), turn(inbound("hello", "m1")))
        )

        expect(result.outcome).toStrictEqual({ _tag: "Skipped", reason: "koa.sendEnabled is off" })
    })

    it("only reaches for Sendblue credentials once both switches are on", async () => {
        const result = await runKoa(
            { outbound: OutboundLive, env: { OUTBOUND_ENABLED: "true" } },
            Effect.andThen(
                seedSettings({ allowlist: [PHONE], sendEnabled: true }),
                turn(inbound("hello", "m1"))
            )
        )

        expect(result.outcome._tag).toBe("Failed")
        expect(JSON.stringify(result.outcome)).toContain("SENDBLUE_API_KEY")
        expect(result.kinds).toStrictEqual(["inbound", "error"])
    })
})

describe("the loop, on the mock messenger", () => {
    it("replies, and records the whole turn in order", async () => {
        const sent: string[] = []
        const result = await runKoa(
            { outbound: OutboundMock((_to, text) => sent.push(text)) },
            Effect.andThen(seedSettings({ allowlist: [PHONE] }), turn(inbound("hello", "m1")))
        )

        expect(result.outcome).toStrictEqual({
            _tag: "Replied",
            text: "a reply from the fake model",
            messenger: "mock"
        })
        expect(sent).toStrictEqual(["a reply from the fake model"])
        expect(result.kinds).toStrictEqual([
            "inbound",
            "generation.start",
            "generation.end",
            "outbound"
        ])
    })

    it("does not process a replayed provider message id twice", async () => {
        const sent: string[] = []
        const result = await runKoa(
            { outbound: OutboundMock((_to, text) => sent.push(text)) },
            Effect.gen(function* () {
                yield* seedSettings({ allowlist: [PHONE] })
                const first = yield* turn(inbound("hello", "m1"))
                const replay = yield* receive(inbound("hello", "m1"), "replay")
                return { first, replay, kinds: yield* ledgerKinds(replay.person.id) }
            })
        )

        expect(result.replay._tag).toBe("Duplicate")
        expect(sent).toHaveLength(1)
        expect(result.kinds.filter(kind => kind === "inbound")).toHaveLength(1)
        expect(result.kinds.at(-1)).toBe("skip")
    })

    it("cannot send a second reply to the same inbound", async () => {
        const sent: string[] = []
        const result = await runKoa(
            { outbound: OutboundMock((_to, text) => sent.push(text)) },
            Effect.gen(function* () {
                yield* seedSettings({ allowlist: [PHONE] })
                const message = inbound("hello", "m1")
                const recorded = yield* receive(message, "t1")
                if (recorded._tag === "Duplicate") return yield* Effect.die("unexpected")

                yield* respond(message, recorded, "t1")
                return yield* respond(message, recorded, "t1-retry")
            })
        )

        expect(result).toStrictEqual({ _tag: "Skipped", reason: "reply already claimed" })
        expect(sent).toHaveLength(1)
    })
})

describe("voice notes", () => {
    const voiceNote = { ...inbound("", "v1"), mediaUrl: "https://media.example/v1.m4a" }

    it("stores a transcript and gives it to the agent", async () => {
        const calls: GenerationRequest[] = []
        const result = await runKoa(
            {
                models: fakeModels(calls, "i want to finish my app"),
                media: fakeMedia({ contentType: "audio/m4a", bytes: new Uint8Array([1, 2, 3]) })
            },
            Effect.andThen(seedSettings({ allowlist: [PHONE] }), turn(voiceNote))
        )

        expect(calls.map(call => call.model)).toStrictEqual([
            "google/gemini-3.8-flash",
            "anthropic/claude-sonnet-5"
        ])
        expect(JSON.stringify(calls[1]?.messages)).toContain(
            "[voice note transcript]\\ni want to finish my app"
        )
        expect(result.kinds).toStrictEqual([
            "inbound",
            "transcription.start",
            "transcription.end",
            "generation.start",
            "generation.end",
            "outbound"
        ])
    })

    it("records a media failure and still replies, so nothing inbound is dropped", async () => {
        const calls: GenerationRequest[] = []
        const result = await runKoa(
            { models: fakeModels(calls), media: fakeMedia("unreachable") },
            Effect.andThen(seedSettings({ allowlist: [PHONE] }), turn(voiceNote))
        )

        expect(result.outcome._tag).toBe("Replied")
        expect(result.kinds.slice(0, 2)).toStrictEqual(["inbound", "error"])
        expect(JSON.stringify(calls[0]?.messages)).toContain(
            "[attachment received, no transcript available]"
        )
    })
})

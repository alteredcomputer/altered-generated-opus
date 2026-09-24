import { Effect, Option } from "effect"
import { describe, expect, it } from "vitest"
import { Store } from "./store.ts"
import { inbound, OTHER_PHONE, PHONE, runKoa } from "./testing.ts"

const recordFor = (text: string, id: string, phone = PHONE) =>
    Effect.flatMap(Store, store => store.recordInbound(inbound(text, id, phone))).pipe(
        Effect.flatMap(recorded =>
            recorded._tag === "Recorded" ? Effect.succeed(recorded) : Effect.die("duplicate")
        )
    )

describe("person scoping", () => {
    it("never returns another person's messages", async () => {
        const result = await runKoa(
            {},
            Effect.gen(function* () {
                const store = yield* Store
                const mine = yield* recordFor("mine", "a1")
                yield* recordFor("theirs", "b1", OTHER_PHONE)
                yield* recordFor("mine again", "a2")

                return yield* store.history(mine.person.id)
            })
        )

        expect(result.map(entry => entry.text)).toStrictEqual(["mine", "mine again"])
    })

    it("ignores an update that names the wrong person, even with a real message id", async () => {
        const result = await runKoa(
            {},
            Effect.gen(function* () {
                const store = yield* Store
                const mine = yield* recordFor("mine", "a1")
                const theirs = yield* recordFor("theirs", "b1", OTHER_PHONE)
                const claim = yield* store.claimOutbound(
                    theirs.person.id,
                    "reply:b1",
                    "their reply"
                )
                const theirReplyId = Option.getOrThrow(claim)

                yield* store.markSent(mine.person.id, theirReplyId, "forged")
                yield* store.saveTranscript(mine.person.id, theirs.messageId, "forged", "model")

                return yield* store.history(theirs.person.id)
            })
        )

        expect(result).toStrictEqual([
            { direction: "inbound", text: "theirs", mediaUrl: null, transcript: null }
        ])
    })

    it("resolves the same phone to the same person", async () => {
        const result = await runKoa(
            {},
            Effect.gen(function* () {
                const first = yield* recordFor("one", "a1")
                const second = yield* recordFor("two", "a2")
                return [first.person.id, second.person.id]
            })
        )

        expect(result[0]).toBe(result[1])
    })
})

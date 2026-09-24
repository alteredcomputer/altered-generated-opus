import { randomUUID } from "node:crypto"
import { createInterface } from "node:readline"
import { E164 } from "@opus/core/phone"
import { runCli } from "@opus/core/runtime"
import { Data, Effect, Layer, Option, Schema } from "effect"
import { Ledger, type LedgerRow } from "./ledger.ts"
import { OutboundMock } from "./messenger.ts"
import { ReceiveLive, receive, respond, respondLayer, type TurnOutcome } from "./pipeline.ts"
import { Store } from "./store.ts"

/**
 * The Koa command line. Plain text, no colour, short lines: it is read on a phone.
 *
 *   pnpm run koa chat --as <E.164>                  talk to Koa; Ctrl-D ends
 *   pnpm run koa chat --as <E.164> --say "<text>"   send one message and exit
 *   pnpm run koa ledger --person <E.164>            every event recorded for that person
 *
 * Chat runs the real pipeline, allowlist included, with the mock messenger: nothing is sent.
 */

class UsageError extends Data.TaggedError("UsageError")<{ readonly message: string }> {}

const USAGE =
    'usage: pnpm run koa chat --as <E.164> [--say "text"] | pnpm run koa ledger --person <E.164>'

const print = (line: string) => Effect.sync(() => process.stdout.write(`${line}\n`))

const flag = (args: readonly string[], name: string): string | undefined => {
    const index = args.indexOf(name)
    return index === -1 ? undefined : args[index + 1]
}

const phoneFlag = (args: readonly string[], name: string) =>
    Option.match(Schema.decodeUnknownOption(E164)(flag(args, name)), {
        onNone: () =>
            Effect.fail(
                new UsageError({ message: `${name} needs an E.164 number, like +15555550100` })
            ),
        onSome: phone => Effect.succeed(phone)
    })

const describeOutcome = (outcome: TurnOutcome): string | null => {
    switch (outcome._tag) {
        case "Replied":
            return null
        case "Skipped":
            return `(no reply: ${outcome.reason})`
        case "Failed":
            return "(the turn failed; the ledger has the error)"
    }
}

const say = (phone: E164, text: string) =>
    Effect.gen(function* () {
        const correlationId = randomUUID()
        const message = { phone, text, providerMessageId: `cli:${randomUUID()}`, mediaUrl: null }
        const recorded = yield* receive(message, correlationId)

        if (recorded._tag === "Duplicate") return yield* print("(duplicate, ignored)")

        const note = describeOutcome(yield* respond(message, recorded, correlationId))
        if (note !== null) yield* print(note)
    })

const chat = (args: readonly string[]) =>
    Effect.gen(function* () {
        const phone = yield* phoneFlag(args, "--as")
        const once = flag(args, "--say")

        if (once !== undefined) return yield* say(phone, once)

        yield* print(`Talking to Koa as ${phone}. Mock messenger: nothing is sent. Ctrl-D ends.`)
        const lines = createInterface({ input: process.stdin })[Symbol.asyncIterator]()

        while (true) {
            const next = yield* Effect.promise(() => lines.next())
            if (next.done === true) return
            if (next.value.trim().length > 0) yield* say(phone, next.value)
        }
    }).pipe(
        Effect.provide(
            Layer.mergeAll(
                ReceiveLive,
                respondLayer(OutboundMock((_to, text) => process.stdout.write(`koa: ${text}\n`)))
            )
        )
    )

const formatEvent = (event: LedgerRow): string => {
    const metrics = [
        event.model === null ? null : `model=${event.model}`,
        event.tokensIn === null ? null : `in=${event.tokensIn}`,
        event.tokensOut === null ? null : `out=${event.tokensOut}`,
        event.costUsd === null ? null : `cost=$${event.costUsd}`
    ].filter(part => part !== null)

    return [
        `${event.createdAt.toISOString()} ${event.kind}`,
        ...(metrics.length > 0 ? [`  ${metrics.join(" ")}`] : []),
        `  turn ${event.correlationId}`,
        `  ${JSON.stringify(event.payload)}`
    ].join("\n")
}

const ledger = (args: readonly string[]) =>
    Effect.gen(function* () {
        const phone = yield* phoneFlag(args, "--person")
        const person = yield* Effect.flatMap(Store, store => store.findPerson(phone))

        if (Option.isNone(person)) return yield* print(`no person with ${phone}`)

        const events = yield* Effect.flatMap(Ledger, l => l.forPerson(person.value.id))
        yield* print(`${events.length} events for ${phone}`)
        for (const event of events) yield* print(formatEvent(event))
    }).pipe(Effect.provide(ReceiveLive))

const main = (args: readonly string[]) => {
    const [command, ...rest] = args

    if (command === "chat") return chat(rest)
    if (command === "ledger") return ledger(rest)
    return Effect.fail(new UsageError({ message: USAGE }))
}

await runCli(main(process.argv.slice(2)))

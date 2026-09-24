import type { E164 } from "@opus/core/phone"
import { Database, type DatabaseError } from "@opus/db/client"
import { media, messages, persons } from "@opus/db/schema"
import { and, asc, eq, or } from "drizzle-orm"
import { Context, Effect, Layer, Option } from "effect"

type Person = { readonly id: string; readonly phone: E164 }

type InboundMessage = {
    readonly phone: E164
    readonly text: string
    readonly providerMessageId: string
    readonly mediaUrl: string | null
}

type Recorded =
    | { readonly _tag: "Recorded"; readonly person: Person; readonly messageId: string }
    | { readonly _tag: "Duplicate"; readonly person: Person }

type HistoryEntry = {
    readonly direction: "inbound" | "outbound"
    readonly text: string
    readonly mediaUrl: string | null
    readonly transcript: string | null
}

type StoreShape = {
    /** Upserts the person and inserts the message, unless its provider id was already seen. */
    readonly recordInbound: (message: InboundMessage) => Effect.Effect<Recorded, DatabaseError>
    readonly findPerson: (phone: E164) => Effect.Effect<Option.Option<Person>, DatabaseError>
    /** The person's conversation, oldest first: everything they sent and every reply that left. */
    readonly history: (personId: string) => Effect.Effect<readonly HistoryEntry[], DatabaseError>
    /**
     * Claims an idempotency key by writing the outbound row as pending before anything is sent.
     * `None` means the key was already claimed, so the send must not happen.
     */
    readonly claimOutbound: (
        personId: string,
        idempotencyKey: string,
        text: string
    ) => Effect.Effect<Option.Option<string>, DatabaseError>
    readonly markSent: (
        personId: string,
        messageId: string,
        providerMessageId: string
    ) => Effect.Effect<void, DatabaseError>
    readonly markFailed: (personId: string, messageId: string) => Effect.Effect<void, DatabaseError>
    readonly saveMedia: (
        personId: string,
        messageId: string,
        contentType: string,
        bytes: Uint8Array
    ) => Effect.Effect<void, DatabaseError>
    readonly saveTranscript: (
        personId: string,
        messageId: string,
        transcript: string,
        model: string
    ) => Effect.Effect<void, DatabaseError>
}

/**
 * Persons and their messages.
 *
 * @remarks
 * Every read and every update names the person in its WHERE clause, including updates addressed by
 * message id, so a wrong id can never reach into another person's conversation.
 */
class Store extends Context.Service<Store, StoreShape>()("@opus/koa/Store") {}

const StoreLive = Layer.effect(
    Store,
    Effect.gen(function* () {
        const database = yield* Database

        const recordInbound = (message: InboundMessage) =>
            Effect.gen(function* () {
                const [person] = yield* database.run("store.upsertPerson", db =>
                    db
                        .insert(persons)
                        .values({ phone: message.phone })
                        .onConflictDoUpdate({
                            target: persons.phone,
                            set: { phone: message.phone }
                        })
                        .returning({ id: persons.id })
                )
                if (person === undefined) return yield* Effect.die("person upsert returned no row")

                const [inserted] = yield* database.run("store.insertInbound", db =>
                    db
                        .insert(messages)
                        .values({
                            personId: person.id,
                            direction: "inbound",
                            status: "received",
                            text: message.text,
                            providerMessageId: message.providerMessageId,
                            mediaUrl: message.mediaUrl
                        })
                        .onConflictDoNothing({ target: messages.providerMessageId })
                        .returning({ id: messages.id })
                )

                const recordedPerson = { id: person.id, phone: message.phone }

                return inserted === undefined
                    ? ({ _tag: "Duplicate", person: recordedPerson } satisfies Recorded)
                    : ({
                          _tag: "Recorded",
                          person: recordedPerson,
                          messageId: inserted.id
                      } satisfies Recorded)
            })

        const findPerson = (phone: E164) =>
            database
                .run("store.findPerson", db =>
                    db.select({ id: persons.id }).from(persons).where(eq(persons.phone, phone))
                )
                .pipe(
                    Effect.map(([row]) =>
                        Option.map(Option.fromNullishOr(row), ({ id }) => ({ id, phone }))
                    )
                )

        const history = (personId: string) =>
            database.run("store.history", db =>
                db
                    .select({
                        direction: messages.direction,
                        text: messages.text,
                        mediaUrl: messages.mediaUrl,
                        transcript: messages.transcript
                    })
                    .from(messages)
                    .where(
                        and(
                            eq(messages.personId, personId),
                            or(eq(messages.direction, "inbound"), eq(messages.status, "sent"))
                        )
                    )
                    .orderBy(asc(messages.seq))
            )

        const claimOutbound = (personId: string, idempotencyKey: string, text: string) =>
            database
                .run("store.claimOutbound", db =>
                    db
                        .insert(messages)
                        .values({
                            personId,
                            direction: "outbound",
                            status: "pending",
                            text,
                            idempotencyKey
                        })
                        .onConflictDoNothing({ target: messages.idempotencyKey })
                        .returning({ id: messages.id })
                )
                .pipe(Effect.map(([row]) => Option.map(Option.fromNullishOr(row), ({ id }) => id)))

        const ownMessage = (personId: string, messageId: string) =>
            and(eq(messages.personId, personId), eq(messages.id, messageId))

        const markSent = (personId: string, messageId: string, providerMessageId: string) =>
            database
                .run("store.markSent", db =>
                    db
                        .update(messages)
                        .set({ status: "sent", providerMessageId, sentAt: new Date() })
                        .where(ownMessage(personId, messageId))
                )
                .pipe(Effect.asVoid)

        const markFailed = (personId: string, messageId: string) =>
            database
                .run("store.markFailed", db =>
                    db
                        .update(messages)
                        .set({ status: "failed" })
                        .where(ownMessage(personId, messageId))
                )
                .pipe(Effect.asVoid)

        const saveMedia = (
            personId: string,
            messageId: string,
            contentType: string,
            bytes: Uint8Array
        ) =>
            database
                .run("store.saveMedia", db =>
                    db
                        .insert(media)
                        .values({
                            messageId,
                            personId,
                            contentType,
                            byteLength: bytes.byteLength,
                            bytes
                        })
                        .onConflictDoNothing({ target: media.messageId })
                )
                .pipe(Effect.asVoid)

        const saveTranscript = (
            personId: string,
            messageId: string,
            transcript: string,
            model: string
        ) =>
            database
                .run("store.saveTranscript", db =>
                    db
                        .update(messages)
                        .set({ transcript, transcriptModel: model })
                        .where(ownMessage(personId, messageId))
                )
                .pipe(Effect.asVoid)

        return {
            recordInbound,
            findPerson,
            history,
            claimOutbound,
            markSent,
            markFailed,
            saveMedia,
            saveTranscript
        }
    })
)

export type { HistoryEntry, InboundMessage, Person, Recorded }
export { Store, StoreLive }

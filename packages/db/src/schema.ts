import { sql } from "drizzle-orm"
import {
    bigint,
    customType,
    index,
    integer,
    jsonb,
    numeric,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid
} from "drizzle-orm/pg-core"

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow()

/**
 * @remarks
 * Insertion order, for rows whose order matters. Timestamps tie within a millisecond and a random
 * id breaks the tie arbitrarily, which would scramble a conversation or a ledger read back in order.
 */
const sequence = () => bigint("seq", { mode: "number" }).notNull().generatedAlwaysAsIdentity()

const bytea = customType<{ data: Uint8Array; driverData: Uint8Array }>({
    dataType: () => "bytea"
})

/**
 * @remarks
 * One row per phone number that has ever texted in. The phone is E.164 and unique, so an inbound
 * from a known number always resolves to the same person.
 */
const persons = pgTable("persons", {
    id: uuid("id").primaryKey().defaultRandom(),
    phone: text("phone").notNull().unique(),
    createdAt: createdAt()
})

const messageDirection = pgEnum("message_direction", ["inbound", "outbound"])

/**
 * @remarks
 * `received` is the only inbound status. Outbound rows are written as `pending` before the send is
 * attempted, so the idempotency key is claimed first and a retry finds it taken.
 */
const messageStatus = pgEnum("message_status", ["received", "pending", "sent", "failed"])

/**
 * @remarks
 * Inbound messages are unique by the provider's message id, which is what turns a replayed or
 * retried webhook into a no-op. Outbound messages are unique by idempotency key, which is what
 * stops a retried turn from texting twice. Postgres treats nulls as distinct, so each column only
 * constrains the rows that carry it.
 */
const messages = pgTable(
    "messages",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        seq: sequence(),
        personId: uuid("person_id")
            .notNull()
            .references(() => persons.id),
        direction: messageDirection("direction").notNull(),
        status: messageStatus("status").notNull(),
        text: text("text").notNull(),
        providerMessageId: text("provider_message_id").unique(),
        idempotencyKey: text("idempotency_key").unique(),
        mediaUrl: text("media_url"),
        transcript: text("transcript"),
        transcriptModel: text("transcript_model"),
        sentAt: timestamp("sent_at", { withTimezone: true }),
        createdAt: createdAt()
    },
    table => [index("messages_person_seq_idx").on(table.personId, table.seq)]
)

/**
 * @remarks
 * The durable copy of a message's media. Provider links expire after 30 days, and D112 makes
 * voice notes source data, so the bytes are kept. They live in their own table so reading a
 * conversation never drags the bytes along.
 */
const media = pgTable("media", {
    messageId: uuid("message_id")
        .primaryKey()
        .references(() => messages.id),
    personId: uuid("person_id")
        .notNull()
        .references(() => persons.id),
    contentType: text("content_type").notNull(),
    byteLength: integer("byte_length").notNull(),
    bytes: bytea("bytes").notNull(),
    createdAt: createdAt()
})

const eventKind = pgEnum("event_kind", [
    "inbound",
    "skip",
    "error",
    "transcription.start",
    "transcription.end",
    "generation.start",
    "generation.end",
    "outbound"
])

/**
 * @remarks
 * The ledger (plan 08 phase 4, designed in phase 1). Append-only. Every event carries the
 * correlation id of the turn it belongs to, so one query reconstructs everything that happened for
 * one inbound. Model, tokens, and cost are columns rather than payload fields so cost questions are
 * a select, not an estimate. Cost is in US dollars, as the provider reports it.
 */
const events = pgTable(
    "events",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        seq: sequence(),
        kind: eventKind("kind").notNull(),
        personId: uuid("person_id").references(() => persons.id),
        correlationId: text("correlation_id").notNull(),
        model: text("model"),
        tokensIn: integer("tokens_in"),
        tokensOut: integer("tokens_out"),
        costUsd: numeric("cost_usd", { precision: 12, scale: 6 }),
        payload: jsonb("payload")
            .$type<Record<string, unknown>>()
            .notNull()
            .default(sql`'{}'::jsonb`),
        createdAt: createdAt()
    },
    table => [
        index("events_person_seq_idx").on(table.personId, table.seq),
        index("events_correlation_idx").on(table.correlationId)
    ]
)

const settings = pgTable("settings", {
    key: text("key").primaryKey(),
    value: jsonb("value").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
})

type EventKind = (typeof eventKind.enumValues)[number]

export type { EventKind }
export { eventKind, events, media, messageDirection, messageStatus, messages, persons, settings }

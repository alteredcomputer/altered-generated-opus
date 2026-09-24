import { Database, type DatabaseError } from "@opus/db/client"
import { type EventKind, events } from "@opus/db/schema"
import { asc, eq } from "drizzle-orm"
import { Context, Effect, Layer } from "effect"

type LedgerEntry = {
    readonly kind: EventKind
    readonly correlationId: string
    readonly personId?: string
    readonly model?: string
    readonly tokensIn?: number | null
    readonly tokensOut?: number | null
    readonly costUsd?: number | null
    readonly payload?: Record<string, unknown>
}

type LedgerRow = typeof events.$inferSelect

type LedgerShape = {
    /**
     * Appends one event. A failed write fails the caller: losing the record at the moment it is
     * needed is the failure this ledger exists to prevent (prior art A5).
     */
    readonly record: (entry: LedgerEntry) => Effect.Effect<void, DatabaseError>
    readonly forPerson: (personId: string) => Effect.Effect<readonly LedgerRow[], DatabaseError>
}

class Ledger extends Context.Service<Ledger, LedgerShape>()("@opus/koa/Ledger") {}

const LedgerLive = Layer.effect(
    Ledger,
    Effect.gen(function* () {
        const database = yield* Database

        const record = (entry: LedgerEntry) =>
            database
                .run("ledger.record", db =>
                    db.insert(events).values({
                        kind: entry.kind,
                        correlationId: entry.correlationId,
                        personId: entry.personId ?? null,
                        model: entry.model ?? null,
                        tokensIn: entry.tokensIn ?? null,
                        tokensOut: entry.tokensOut ?? null,
                        costUsd:
                            entry.costUsd === undefined || entry.costUsd === null
                                ? null
                                : String(entry.costUsd),
                        payload: entry.payload ?? {}
                    })
                )
                .pipe(
                    Effect.andThen(
                        Effect.logInfo("Ledger event", {
                            kind: entry.kind,
                            correlationId: entry.correlationId
                        })
                    )
                )

        const forPerson = (personId: string) =>
            database.run("ledger.forPerson", db =>
                db
                    .select()
                    .from(events)
                    .where(eq(events.personId, personId))
                    .orderBy(asc(events.createdAt), asc(events.id))
            )

        return { record, forPerson }
    })
)

export type { LedgerEntry, LedgerRow }
export { Ledger, LedgerLive }

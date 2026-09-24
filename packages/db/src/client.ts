import { neon } from "@neondatabase/serverless"
import { config } from "@opus/core/config"
import { DrizzleQueryError } from "drizzle-orm/errors"
import { drizzle } from "drizzle-orm/neon-http"
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core"
import { Context, Data, Effect, Layer, Redacted } from "effect"
import * as schema from "./schema.ts"

type Db = PgDatabase<PgQueryResultHKT, typeof schema>

/**
 * @remarks
 * Carries the driver's own message rather than drizzle's wrapper, because the wrapper quotes the
 * query parameters, and those are people's phone numbers and words. They do not belong in a log.
 */
class DatabaseError extends Data.TaggedError("DatabaseError")<{
    readonly operation: string
    readonly detail: string
}> {}

const describeFailure = (cause: unknown): string => {
    const inner = cause instanceof DrizzleQueryError ? cause.cause : cause
    return inner instanceof Error ? inner.message : "unknown database failure"
}

type DatabaseShape = {
    /** Runs one named operation, turning any rejection into a typed `DatabaseError`. */
    readonly run: <A>(
        operation: string,
        query: (db: Db) => Promise<A>
    ) => Effect.Effect<A, DatabaseError>
}

class Database extends Context.Service<Database, DatabaseShape>()("@opus/db/Database") {}

const fromDrizzle = (db: Db): DatabaseShape => ({
    run: (operation, query) =>
        Effect.tryPromise({
            try: () => query(db),
            catch: cause => new DatabaseError({ operation, detail: describeFailure(cause) })
        }).pipe(
            Effect.tapError(error =>
                Effect.logError("Database operation failed", {
                    operation,
                    detail: error.detail
                })
            )
        )
})

const connect = Effect.gen(function* () {
    const { url } = yield* config.database
    return drizzle({ client: neon(Redacted.value(url)), schema })
})

const DatabaseLive = Layer.effect(Database, Effect.map(connect, fromDrizzle))

export type { DatabaseShape, Db }
export { connect, Database, DatabaseError, DatabaseLive, describeFailure, fromDrizzle }

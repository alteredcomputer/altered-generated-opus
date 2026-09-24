import { fileURLToPath } from "node:url"
import { migrate } from "drizzle-orm/neon-http/migrator"
import { Effect } from "effect"
import { connect, DatabaseError, describeFailure } from "./client.ts"

/**
 * @remarks
 * Kept apart from the client because the app bundler treats a `new URL(..., import.meta.url)` as
 * an asset to bundle. Only the command line and the tests read the migrations folder.
 */
const MIGRATIONS_FOLDER = fileURLToPath(new URL("../drizzle", import.meta.url))

const runMigrations = Effect.gen(function* () {
    const db = yield* connect

    yield* Effect.tryPromise({
        try: () => migrate(db, { migrationsFolder: MIGRATIONS_FOLDER }),
        catch: cause => new DatabaseError({ operation: "migrate", detail: describeFailure(cause) })
    })
    yield* Effect.logInfo("Migrations applied", { folder: "packages/db/drizzle" })
})

export { MIGRATIONS_FOLDER, runMigrations }

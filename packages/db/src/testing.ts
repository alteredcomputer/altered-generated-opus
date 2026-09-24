import { PGlite } from "@electric-sql/pglite"
import { drizzle } from "drizzle-orm/pglite"
import { migrate } from "drizzle-orm/pglite/migrator"
import { Effect, Layer } from "effect"
import { Database, fromDrizzle, MIGRATIONS_FOLDER } from "./client.ts"
import * as schema from "./schema.ts"

/**
 * An in-process Postgres with the committed migrations applied, for tests.
 *
 * @remarks
 * Tests run the real queries and the real constraints rather than a hand-written fake, because the
 * rules worth testing (person scoping, replay dedupe, idempotency) live in the SQL itself.
 */
const DatabaseTest = Layer.effect(
    Database,
    Effect.promise(async () => {
        const db = drizzle({ client: new PGlite(), schema })
        await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER })
        return fromDrizzle(db)
    })
)

export { DatabaseTest }

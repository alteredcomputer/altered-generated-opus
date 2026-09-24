import { runCli } from "@opus/core/runtime"
import { Data, Effect, Layer } from "effect"
import { DatabaseLive, runMigrations } from "./client.ts"
import { isSettingKey, SETTING_KEYS, Settings, SettingsLive } from "./settings.ts"

/**
 * The database command line.
 *
 *   pnpm db migrate                    apply the committed migrations
 *   pnpm db settings list              every key and its current value, or "unset"
 *   pnpm db settings get <key>
 *   pnpm db settings set <key> <json>  the value is JSON: true, "text", ["+15550100"]
 *   pnpm db settings seed              write the seed value for every unset key
 */

class UsageError extends Data.TaggedError("UsageError")<{ readonly message: string }> {}

const USAGE = "usage: pnpm db migrate | pnpm db settings list | get <key> | set <key> <json> | seed"

const print = (line: string) => Effect.sync(() => process.stdout.write(`${line}\n`))

const settingKey = (key: string | undefined) =>
    key !== undefined && isSettingKey(key)
        ? Effect.succeed(key)
        : Effect.fail(new UsageError({ message: `unknown key. keys: ${SETTING_KEYS.join(", ")}` }))

const parseJson = (raw: string | undefined) =>
    Effect.try({
        try: () => JSON.parse(raw ?? "") as unknown,
        catch: () =>
            new UsageError({ message: 'the value must be JSON, for example true or "text"' })
    })

const settingsCommand = (args: readonly string[]) =>
    Effect.gen(function* () {
        const store = yield* Settings
        const [action, key, raw] = args

        switch (action) {
            case "list":
                for (const name of SETTING_KEYS) {
                    const value = yield* store.get(name).pipe(
                        Effect.map(value => JSON.stringify(value)),
                        Effect.catchTag("SettingMissing", () => Effect.succeed("unset"))
                    )
                    yield* print(`${name} = ${value}`)
                }
                return
            case "get":
                return yield* print(JSON.stringify(yield* store.get(yield* settingKey(key))))
            case "set": {
                const name = yield* settingKey(key)
                const value = yield* store.set(name, yield* parseJson(raw))
                return yield* print(`${name} = ${JSON.stringify(value)}`)
            }
            case "seed": {
                const written = yield* store.seed
                return yield* print(
                    written.length === 0 ? "nothing to seed" : `seeded: ${written.join(", ")}`
                )
            }
            default:
                return yield* new UsageError({ message: USAGE })
        }
    }).pipe(Effect.provide(SettingsLive.pipe(Layer.provide(DatabaseLive))))

const main = (args: readonly string[]) => {
    const [command, ...rest] = args

    if (command === "migrate")
        return runMigrations.pipe(Effect.andThen(print("migrations applied")))
    if (command === "settings") return settingsCommand(rest)
    return Effect.fail(new UsageError({ message: USAGE }))
}

await runCli(main(process.argv.slice(2)))

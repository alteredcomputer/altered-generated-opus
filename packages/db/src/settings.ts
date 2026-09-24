import { E164 } from "@opus/core/phone"
import { eq } from "drizzle-orm"
import { Context, Data, Effect, Layer, Schema } from "effect"
import { Database, type DatabaseError } from "./client.ts"
import { settings } from "./schema.ts"

/**
 * Every settings key, declared once with the schema its value must satisfy.
 *
 * @remarks
 * The key names mirror the `controls` declared on feature graph nodes. A key that is not here
 * cannot be read or written, so a typo is a type error rather than a silently missing value.
 */
const SETTINGS = {
    "koa.sendEnabled": Schema.Boolean,
    "koa.allowlist": Schema.Array(E164),
    "koa.systemPrompt": Schema.NonEmptyString,
    "ai.model.koa": Schema.NonEmptyString,
    "ai.model.transcription": Schema.NonEmptyString
} as const

type SettingKey = keyof typeof SETTINGS
type SettingValue<K extends SettingKey> = (typeof SETTINGS)[K]["Type"]

const SETTING_KEYS = Object.keys(SETTINGS) as readonly SettingKey[]

const isSettingKey = (key: string): key is SettingKey => Object.hasOwn(SETTINGS, key)

/**
 * @remarks
 * Written by `pnpm db settings seed`, and only where a key is absent, so seeding never overwrites a
 * value someone chose. These are the values the system starts from, not fallbacks: a read of an
 * unseeded key still fails. Every seed grants nothing: sending is off and the allowlist is empty.
 *
 * The prompt is a functional placeholder for allowlist-only testing. Koa's real voice, first reply,
 * and onboarding intents wait on Round 10 (Q76, Q77). The models are placeholders the owner can
 * change without a deploy.
 */
const SEED: { readonly [K in SettingKey]: SettingValue<K> } = {
    "koa.sendEnabled": false,
    "koa.allowlist": [],
    "koa.systemPrompt": [
        "PLACEHOLDER PROMPT - for allowlist-only testing, to be replaced by the Round 10 copy.",
        "",
        "You are Koa, an early-access alignment agent, talking with one person over iMessage.",
        "Be helpful, direct, and brief. Write like a thoughtful person texting: short messages,",
        "no markdown, no lists unless asked. Ask one question at a time.",
        "Use plain hyphens for dashes, never em dashes.",
        "Do not promote any program, product, or offer. If you do not know something, say so."
    ].join("\n"),
    "ai.model.koa": "anthropic/claude-sonnet-5",
    "ai.model.transcription": "google/gemini-3.8-flash"
}

/** A required setting has no value. Nothing is ever assumed in its place. */
class SettingMissing extends Data.TaggedError("SettingMissing")<{ readonly key: SettingKey }> {}

/** A setting's stored or proposed value does not satisfy its schema. */
class SettingInvalid extends Data.TaggedError("SettingInvalid")<{
    readonly key: SettingKey
    readonly issue: string
}> {}

type SettingsShape = {
    readonly get: <K extends SettingKey>(
        key: K
    ) => Effect.Effect<SettingValue<K>, SettingMissing | SettingInvalid | DatabaseError>
    readonly set: <K extends SettingKey>(
        key: K,
        value: unknown
    ) => Effect.Effect<SettingValue<K>, SettingInvalid | DatabaseError>
    /** Writes the seed value for every absent key and returns the keys it wrote. */
    readonly seed: Effect.Effect<readonly SettingKey[], DatabaseError>
}

class Settings extends Context.Service<Settings, SettingsShape>()("@opus/db/Settings") {}

const validate = <K extends SettingKey>(key: K, value: unknown) =>
    Schema.decodeUnknownEffect(SETTINGS[key] as Schema.Codec<SettingValue<K>>)(value).pipe(
        Effect.mapError(error => new SettingInvalid({ key, issue: error.message }))
    )

const SettingsLive = Layer.effect(
    Settings,
    Effect.gen(function* () {
        const database = yield* Database

        const get = <K extends SettingKey>(key: K) =>
            Effect.gen(function* () {
                const [row] = yield* database.run("settings.get", db =>
                    db.select({ value: settings.value }).from(settings).where(eq(settings.key, key))
                )
                if (row === undefined) return yield* new SettingMissing({ key })

                return yield* validate(key, row.value)
            })

        const set = <K extends SettingKey>(key: K, value: unknown) =>
            Effect.gen(function* () {
                const valid = yield* validate(key, value)

                yield* database.run("settings.set", db =>
                    db
                        .insert(settings)
                        .values({ key, value: valid })
                        .onConflictDoUpdate({
                            target: settings.key,
                            set: { value: valid, updatedAt: new Date() }
                        })
                )
                yield* Effect.logInfo("Setting changed", { key })

                return valid
            })

        const seed = database
            .run("settings.seed", db =>
                db
                    .insert(settings)
                    .values(SETTING_KEYS.map(key => ({ key, value: SEED[key] })))
                    .onConflictDoNothing()
                    .returning({ key: settings.key })
            )
            .pipe(
                Effect.map(rows => rows.map(row => row.key).filter(isSettingKey)),
                Effect.tap(written => Effect.logInfo("Settings seeded", { written }))
            )

        return { get, set, seed }
    })
)

export type { SettingKey, SettingValue }
export { isSettingKey, SEED, SETTING_KEYS, SettingInvalid, SettingMissing, Settings, SettingsLive }

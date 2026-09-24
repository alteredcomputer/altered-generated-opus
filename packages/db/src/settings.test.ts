import { Effect, Exit, Layer } from "effect"
import { describe, expect, it } from "vitest"
import { Database } from "./client.ts"
import { settings } from "./schema.ts"
import { Settings, SettingsLive } from "./settings.ts"
import { DatabaseTest } from "./testing.ts"

const provide = <A, E>(effect: Effect.Effect<A, E, Settings | Database>) =>
    effect.pipe(Effect.provide(SettingsLive.pipe(Layer.provideMerge(DatabaseTest))))

const run = <A, E>(effect: Effect.Effect<A, E, Settings | Database>) =>
    Effect.runPromiseExit(provide(effect))

const failure = <A, E extends { readonly _tag: string }>(
    effect: Effect.Effect<A, E, Settings | Database>
) => Effect.runPromise(provide(Effect.flip(effect))).then(error => error._tag)

describe("settings store", () => {
    it("fails with SettingMissing for an unset key rather than assuming a value", async () => {
        expect(await failure(Effect.flatMap(Settings, s => s.get("koa.sendEnabled")))).toBe(
            "SettingMissing"
        )
    })

    it("seeds sending off and an empty allowlist, and never overwrites a chosen value", async () => {
        const exit = await run(
            Effect.gen(function* () {
                const store = yield* Settings
                yield* store.set("ai.model.koa", "chosen/model")
                const written = yield* store.seed

                return {
                    written,
                    sendEnabled: yield* store.get("koa.sendEnabled"),
                    allowlist: yield* store.get("koa.allowlist"),
                    model: yield* store.get("ai.model.koa")
                }
            })
        )

        expect(exit).toStrictEqual(
            Exit.succeed({
                written: [
                    "koa.sendEnabled",
                    "koa.allowlist",
                    "koa.systemPrompt",
                    "ai.model.transcription"
                ],
                sendEnabled: false,
                allowlist: [],
                model: "chosen/model"
            })
        )
    })

    it("refuses to store an allowlist entry that is not E.164", async () => {
        expect(
            await failure(Effect.flatMap(Settings, s => s.set("koa.allowlist", ["555-0100"])))
        ).toBe("SettingInvalid")
    })

    it("fails with SettingInvalid when the stored value is malformed", async () => {
        const corruptThenRead = Effect.gen(function* () {
            const database = yield* Database
            yield* database.run("corrupt", db =>
                db.insert(settings).values({ key: "koa.sendEnabled", value: "yes" })
            )
            return yield* Effect.flatMap(Settings, s => s.get("koa.sendEnabled"))
        })

        expect(await failure(corruptThenRead)).toBe("SettingInvalid")
    })
})

import type { E164 } from "@opus/core/phone"
import { Settings, SettingsLive } from "@opus/db/settings"
import { DatabaseTest } from "@opus/db/testing"
import { ConfigProvider, Effect, Layer, References } from "effect"
import { Ledger, LedgerLive } from "./ledger.ts"
import { type Outbound, OutboundMock } from "./messenger.ts"
import { type GenerationRequest, Models } from "./models.ts"
import { Store, StoreLive } from "./store.ts"
import { type FetchedMedia, Media, MediaFetchError } from "./voice.ts"

const PHONE = "+15555550100" as E164
const OTHER_PHONE = "+15555550199" as E164

/** Records every request and answers with a fixed text, so tests can count and inspect calls. */
const fakeModels = (calls: GenerationRequest[], text = "a reply from the fake model") =>
    Layer.succeed(Models, {
        generate: request =>
            Effect.sync(() => {
                calls.push(request)
                return { text, model: request.model, tokensIn: 10, tokensOut: 5, costUsd: 0.0001 }
            })
    })

const fakeMedia = (media: FetchedMedia | "unreachable") =>
    Layer.succeed(Media, {
        fetch: () =>
            media === "unreachable"
                ? Effect.fail(new MediaFetchError({ detail: "unreachable in test" }))
                : Effect.succeed(media)
    })

type Fixture = {
    readonly outbound?: Layer.Layer<Outbound, never, Settings>
    readonly models?: Layer.Layer<Models>
    readonly media?: Layer.Layer<Media>
    readonly env?: Record<string, string>
}

/**
 * The real store, ledger, and settings on a fresh in-process Postgres, with fakes only at the
 * edges that would reach the network. Environment comes from `env` alone, never the process.
 */
const koaTest = (fixture: Fixture = {}) =>
    Layer.mergeAll(
        StoreLive,
        LedgerLive,
        fixture.models ?? fakeModels([]),
        fixture.media ?? fakeMedia("unreachable"),
        fixture.outbound ?? OutboundMock(() => undefined)
    ).pipe(
        Layer.provideMerge(SettingsLive),
        Layer.provideMerge(DatabaseTest),
        Layer.provideMerge(ConfigProvider.layer(ConfigProvider.fromUnknown(fixture.env ?? {}))),
        Layer.provideMerge(Layer.succeed(References.MinimumLogLevel, "Error"))
    )

type KoaTest = Layer.Success<ReturnType<typeof koaTest>>

const runKoa = <A, E>(fixture: Fixture, effect: Effect.Effect<A, E, KoaTest>) =>
    Effect.runPromise(effect.pipe(Effect.provide(koaTest(fixture))))

/** Seeds every setting, then applies overrides. The seed itself grants nothing. */
const seedSettings = (overrides: {
    readonly allowlist?: readonly E164[]
    readonly sendEnabled?: boolean
}) =>
    Effect.gen(function* () {
        const settings = yield* Settings
        yield* settings.seed
        if (overrides.allowlist !== undefined)
            yield* settings.set("koa.allowlist", overrides.allowlist)
        if (overrides.sendEnabled !== undefined)
            yield* settings.set("koa.sendEnabled", overrides.sendEnabled)
    })

const ledgerKinds = (personId: string) =>
    Effect.flatMap(Ledger, ledger => ledger.forPerson(personId)).pipe(
        Effect.map(events => events.map(event => event.kind))
    )

const inbound = (text: string, providerMessageId: string, phone: E164 = PHONE) => ({
    phone,
    text,
    providerMessageId,
    mediaUrl: null
})

export {
    fakeMedia,
    fakeModels,
    inbound,
    koaTest,
    ledgerKinds,
    OTHER_PHONE,
    PHONE,
    runKoa,
    Store,
    seedSettings
}

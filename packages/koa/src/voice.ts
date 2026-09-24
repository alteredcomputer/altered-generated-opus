import { Settings } from "@opus/db/settings"
import { Cause, Context, Data, Effect, Layer } from "effect"
import { Ledger } from "./ledger.ts"
import { Models } from "./models.ts"
import { Store } from "./store.ts"

class MediaFetchError extends Data.TaggedError("MediaFetchError")<{ readonly detail: string }> {}

type FetchedMedia = { readonly contentType: string; readonly bytes: Uint8Array }

type MediaShape = {
    readonly fetch: (url: string) => Effect.Effect<FetchedMedia, MediaFetchError>
}

/** Downloads provider media. A service so tests never reach the network. */
class Media extends Context.Service<Media, MediaShape>()("@opus/koa/Media") {}

const MediaLive = Layer.succeed(Media, {
    fetch: url =>
        Effect.gen(function* () {
            //  The URL comes from a verified provider payload, but it is still only ever fetched over
            //  https, so a malformed payload cannot point the server at an internal address by scheme.
            if (!url.startsWith("https://"))
                return yield* new MediaFetchError({ detail: "media url is not https" })

            const response = yield* Effect.tryPromise({
                try: signal => fetch(url, { signal }),
                catch: cause =>
                    new MediaFetchError({
                        detail: cause instanceof Error ? cause.message : "fetch failed"
                    })
            })
            if (!response.ok)
                return yield* new MediaFetchError({ detail: `status ${response.status}` })

            const bytes = yield* Effect.tryPromise({
                try: () => response.arrayBuffer(),
                catch: () => new MediaFetchError({ detail: "body could not be read" })
            })

            return {
                contentType: response.headers.get("content-type") ?? "application/octet-stream",
                bytes: new Uint8Array(bytes)
            }
        })
})

const TRANSCRIBE_SYSTEM =
    "Transcribe the attached voice note verbatim, in its original language. Reply with the transcript only."

type MediaTarget = {
    readonly personId: string
    readonly messageId: string
    readonly mediaUrl: string
    readonly correlationId: string
}

/**
 * Keeps a durable copy of an inbound's media and, for audio, stores a transcript on the message.
 *
 * @remarks
 * Never fails. Each step that goes wrong is recorded as an error event with its stage and the turn
 * carries on without it: the message row and its URL already exist, so nothing is dropped, and the
 * agent is told plainly that an attachment arrived without a transcript.
 */
const ingestMedia = (target: MediaTarget) =>
    Effect.gen(function* () {
        const store = yield* Store
        const ledger = yield* Ledger
        const models = yield* Models
        const settings = yield* Settings
        const media = yield* Media
        const { personId, messageId, correlationId } = target

        const stage = <A, E, R>(name: string, effect: Effect.Effect<A, E, R>) =>
            effect.pipe(Effect.tapCause(cause => recordFailure(name, cause)))

        const recordFailure = (name: string, cause: Cause.Cause<unknown>) =>
            ledger
                .record({
                    kind: "error",
                    correlationId,
                    personId,
                    payload: { stage: name, messageId, error: Cause.pretty(cause) }
                })
                .pipe(
                    Effect.catchCause(ledgerCause =>
                        Effect.logError("Could not record media failure", {
                            stage: name,
                            cause: Cause.pretty(ledgerCause)
                        })
                    )
                )

        const fetched = yield* stage("media.fetch", media.fetch(target.mediaUrl))
        yield* stage(
            "media.store",
            store.saveMedia(personId, messageId, fetched.contentType, fetched.bytes)
        )

        if (!fetched.contentType.startsWith("audio/")) return

        const model = yield* stage("transcription.model", settings.get("ai.model.transcription"))
        yield* ledger.record({
            kind: "transcription.start",
            correlationId,
            personId,
            model,
            payload: {
                messageId,
                contentType: fetched.contentType,
                bytes: fetched.bytes.byteLength
            }
        })

        const generation = yield* stage(
            "transcription",
            models.generate({
                model,
                system: TRANSCRIBE_SYSTEM,
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "file", data: fetched.bytes, mediaType: fetched.contentType }
                        ]
                    }
                ]
            })
        )

        yield* stage(
            "transcription.store",
            store.saveTranscript(personId, messageId, generation.text, model)
        )
        yield* ledger.record({
            kind: "transcription.end",
            correlationId,
            personId,
            model,
            tokensIn: generation.tokensIn,
            tokensOut: generation.tokensOut,
            costUsd: generation.costUsd,
            payload: { messageId, transcriptLength: generation.text.length }
        })
    }).pipe(
        Effect.catchCause(cause =>
            Effect.logWarning("Media ingestion stopped early", {
                messageId: target.messageId,
                cause: Cause.pretty(cause)
            })
        )
    )

export type { FetchedMedia }
export { ingestMedia, Media, MediaFetchError, MediaLive }

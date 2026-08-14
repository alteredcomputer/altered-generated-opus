import { Cause, Effect, Exit, Layer, Logger } from "effect"

/**
 * @remarks
 * Structured JSON everywhere except a local terminal, so production logs stay machine-readable and
 * greppable by correlation id. `mergeWithExisting` is off so the default logger does not double
 * every line.
 */
const loggingLayer = Layer.mergeAll(
    Logger.layer([
        process.env.APP_ENV === "development" ? Logger.consolePretty() : Logger.consoleJson
    ])
)

/**
 * Runs a request-scoped effect and surfaces failure as a rejected promise.
 *
 * @remarks
 * Route handlers stay thin: they build an effect, hand it here, and translate the outcome into a
 * response. Defects are logged with their full cause before they propagate, so nothing fails
 * silently even when the handler above has no idea what went wrong.
 */
const runRequest = async <A, E>(effect: Effect.Effect<A, E>): Promise<A> => {
    const exit = await Effect.runPromiseExit(effect.pipe(Effect.provide(loggingLayer)))

    if (Exit.isSuccess(exit)) return exit.value

    await Effect.runPromise(
        Effect.logError("Request failed", { cause: Cause.pretty(exit.cause) }).pipe(
            Effect.provide(loggingLayer)
        )
    )

    throw new Error(Cause.pretty(exit.cause))
}

export { loggingLayer, runRequest }

import { Cause, Effect, Exit, Layer, Logger, References } from "effect"

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

/**
 * @remarks
 * Command lines print their own output to stdout, so logs go to stderr as uncoloured logfmt and a
 * transcript on stdout stays clean and readable on a phone. Info and debug lines are suppressed:
 * the event ledger is the record of what happened, and warnings and errors still surface.
 */
const cliLoggingLayer = Layer.mergeAll(
    Logger.layer([Logger.withConsoleError(Logger.formatLogFmt)]),
    Layer.succeed(References.MinimumLogLevel, "Warn")
)

/**
 * Runs a command-line program to completion.
 *
 * @remarks
 * A failure prints its full cause to stderr and sets a non-zero exit code, so a script that chains
 * commands stops at the first one that failed.
 */
const runCli = async <E>(effect: Effect.Effect<void, E>): Promise<void> => {
    const exit = await Effect.runPromiseExit(effect.pipe(Effect.provide(cliLoggingLayer)))

    if (Exit.isFailure(exit)) {
        process.stderr.write(`${Cause.pretty(exit.cause)}\n`)
        process.exitCode = 1
    }
}

export { loggingLayer, runCli, runRequest }

import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { config } from "@opus/core/config"
import { generateText, type ModelMessage } from "ai"
import { type Config, Context, Data, Effect, Layer, Redacted } from "effect"

type GenerationRequest = {
    readonly model: string
    readonly system: string
    readonly messages: readonly ModelMessage[]
}

type Generation = {
    readonly text: string
    readonly model: string
    readonly tokensIn: number | null
    readonly tokensOut: number | null
    /** US dollars as OpenRouter reports it; null when the provider did not report a cost. */
    readonly costUsd: number | null
}

class ModelError extends Data.TaggedError("ModelError")<{
    readonly model: string
    readonly detail: string
}> {}

type ModelsShape = {
    readonly generate: (
        request: GenerationRequest
    ) => Effect.Effect<Generation, ModelError | Config.ConfigError>
}

/**
 * Every model call in Koa goes through here, so every call reports tokens and cost the same way.
 */
class Models extends Context.Service<Models, ModelsShape>()("@opus/koa/Models") {}

const readCost = (metadata: unknown): number | null => {
    const cost = (metadata as { openrouter?: { usage?: { cost?: unknown } } } | undefined)
        ?.openrouter?.usage?.cost
    return typeof cost === "number" ? cost : null
}

/**
 * @remarks
 * The key is read per call rather than when the layer is built, so a missing key fails the one
 * turn that needed it, inside the turn, where it is recorded in the ledger as an error.
 */
const ModelsLive = Layer.succeed(Models, {
    generate: ({ model, system, messages }) =>
        Effect.gen(function* () {
            const { openrouterApiKey } = yield* config.ai
            const openrouter = createOpenRouter({ apiKey: Redacted.value(openrouterApiKey) })

            return yield* Effect.tryPromise({
                try: abortSignal =>
                    generateText({
                        model: openrouter.chat(model, { usage: { include: true } }),
                        system,
                        messages: [...messages],
                        abortSignal
                    }),
                catch: cause =>
                    new ModelError({
                        model,
                        detail: cause instanceof Error ? cause.message : "unknown model failure"
                    })
            }).pipe(
                Effect.map(
                    (result): Generation => ({
                        text: result.text.trim(),
                        model,
                        tokensIn: result.usage.inputTokens ?? null,
                        tokensOut: result.usage.outputTokens ?? null,
                        costUsd: readCost(result.providerMetadata)
                    })
                )
            )
        })
})

export type { Generation, GenerationRequest }
export { ModelError, Models, ModelsLive }

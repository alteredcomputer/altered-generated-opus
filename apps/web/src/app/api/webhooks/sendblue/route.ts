import { runRequest } from "@opus/core/runtime"
import { Effect } from "effect"

export const dynamic = "force-dynamic"

/**
 * Inbound iMessage webhook.
 *
 * @remarks
 * This is the stable URL to configure in Sendblue. It is deliberately inert: it acknowledges
 * receipt and records that a message arrived, and it does nothing else.
 *
 * Processing stays off until the messaging integration is wired, because verifying Sendblue's
 * signature is the messaging adapter's job and guessing at that scheme would be worse than not
 * checking at all. Since no action is taken on the payload, an unverified request cannot cause
 * anything to happen. Nothing here may act on the body until verification lands with it.
 *
 * Acknowledging rather than erroring keeps the provider from marking the endpoint unhealthy while
 * the rest of the system is built.
 */
const POST = async (request: Request): Promise<Response> => {
    await runRequest(
        Effect.gen(function* () {
            const contentLength = request.headers.get("content-length")

            yield* Effect.logInfo("Inbound iMessage webhook received", {
                processed: false,
                reason: "messaging integration not yet wired",
                contentLength
            })
        })
    )

    return Response.json({ received: true, processed: false })
}

export { POST }

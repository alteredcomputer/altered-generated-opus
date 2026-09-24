import { runRequest } from "@opus/core/runtime"
import { ReceiveLive } from "@opus/koa/pipeline"
import { handleSendblueWebhook } from "@opus/koa/webhook"
import { Effect } from "effect"
import { after } from "next/server"

export const dynamic = "force-dynamic"

/**
 * Inbound iMessage webhook: the stable URL configured in Sendblue.
 *
 * @remarks
 * Verification, persistence, and the turn all live in `@opus/koa`. The turn runs in `after`, which
 * keeps the function alive past the response on Vercel; it records its own failures in the ledger,
 * and `runRequest` logs anything that escapes.
 */
const POST = (request: Request): Promise<Response> =>
    runRequest(
        handleSendblueWebhook(request, turn => after(() => runRequest(turn))).pipe(
            Effect.provide(ReceiveLive)
        )
    )

export { POST }

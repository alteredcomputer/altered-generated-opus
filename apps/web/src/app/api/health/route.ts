import { config } from "@opus/core/config"
import { reportReadiness } from "@opus/core/readiness"
import { runRequest } from "@opus/core/runtime"
import { Effect } from "effect"

export const dynamic = "force-dynamic"

/**
 * Liveness and provisioning status.
 *
 * @remarks
 * Outside production this lists exactly which environment variables are missing, which is what
 * makes provisioning verifiable without a deploy-and-see loop. In production it reports only a
 * count, because the set of integrations a system depends on is itself information worth not
 * publishing. No value is ever read, so no value can ever leak.
 */
const GET = async (): Promise<Response> => {
    const body = await runRequest(
        Effect.gen(function* () {
            const runtime = yield* config.runtime
            const readiness = reportReadiness()

            yield* Effect.logDebug("Health check", {
                environment: runtime.environment,
                ready: readiness.ready,
                missingCount: readiness.missingCount
            })

            return {
                status: readiness.ready ? "ok" : "incomplete",
                environment: runtime.environment,
                outboundEnabled: runtime.outboundEnabled,
                missingCount: readiness.missingCount,
                ...(runtime.environment === "production"
                    ? {}
                    : { capabilities: readiness.capabilities })
            }
        })
    )

    return Response.json(body, { headers: { "cache-control": "no-store" } })
}

export { GET }

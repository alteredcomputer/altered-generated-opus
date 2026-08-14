import { ENV } from "./config.ts"

/**
 * @remarks
 * Which environment variables each capability needs to work at all. This drives the readiness
 * report so provisioning can be verified without deploying a feature and waiting for it to break.
 *
 * It reads `process.env` directly rather than going through Effect's config layer, because its job
 * is to report on absence rather than to consume values. Nothing here reads a value.
 */
const REQUIREMENTS = {
    database: [ENV.databaseUrl],
    redis: [ENV.redisUrl, ENV.redisRestUrl, ENV.redisRestToken],
    queue: [ENV.qstashUrl, ENV.qstashToken, ENV.qstashCurrentSigningKey, ENV.qstashNextSigningKey],
    ai: [ENV.openrouterApiKey],
    imessage: [
        ENV.sendblueApiKey,
        ENV.sendblueApiSecret,
        ENV.sendbluePhoneNumber,
        ENV.sendblueSigningSecret
    ],
    operator: [ENV.operatorPhoneNumber],
    auth: [ENV.authSecret, ENV.resendApiKey, ENV.authEmailFrom],
    payments: [ENV.autumnSecretKey],
    publishing: [ENV.zernioApiKey, ENV.zernioXAccountId]
} as const satisfies Record<string, readonly string[]>

type Capability = keyof typeof REQUIREMENTS

type CapabilityReadiness = {
    readonly ready: boolean
    /** Names only. A value is never read, so a value can never leak. */
    readonly missing: readonly string[]
}

type ReadinessReport = {
    readonly ready: boolean
    readonly missingCount: number
    readonly capabilities: Record<Capability, CapabilityReadiness>
}

const isPresent = (name: string): boolean => {
    const value = process.env[name]
    return typeof value === "string" && value.trim().length > 0
}

const reportReadiness = (): ReadinessReport => {
    const capabilities = {} as Record<Capability, CapabilityReadiness>
    let missingCount = 0

    for (const capability of Object.keys(REQUIREMENTS) as Capability[]) {
        const missing = REQUIREMENTS[capability].filter(name => !isPresent(name))

        missingCount += missing.length
        capabilities[capability] = { ready: missing.length === 0, missing }
    }

    return { ready: missingCount === 0, missingCount, capabilities }
}

export type { Capability, CapabilityReadiness, ReadinessReport }
export { REQUIREMENTS, reportReadiness }

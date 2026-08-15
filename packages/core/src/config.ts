import { Config, Redacted } from "effect"

/**
 * @remarks
 * Every environment variable name is declared exactly once, here. The typed configs below and the
 * readiness report in `./readiness.ts` both reference these constants, so a rename cannot leave one
 * of them behind.
 */
const ENV = {
    appEnv: "APP_ENV",
    siteUrl: "NEXT_PUBLIC_SITE_URL",
    outboundEnabled: "OUTBOUND_ENABLED",

    databaseUrl: "DATABASE_URL",

    redisUrl: "REDIS_URL",
    redisRestUrl: "UPSTASH_REDIS_REST_URL",
    redisRestToken: "UPSTASH_REDIS_REST_TOKEN",

    qstashUrl: "QSTASH_URL",
    qstashToken: "QSTASH_TOKEN",
    qstashCurrentSigningKey: "QSTASH_CURRENT_SIGNING_KEY",
    qstashNextSigningKey: "QSTASH_NEXT_SIGNING_KEY",

    openrouterApiKey: "OPENROUTER_API_KEY",

    sendblueApiKey: "SENDBLUE_API_KEY",
    sendblueApiSecret: "SENDBLUE_API_SECRET",
    sendbluePhoneNumber: "SENDBLUE_PHONE_NUMBER",
    sendblueSigningSecret: "SENDBLUE_SIGNING_SECRET",

    operatorPhoneNumber: "OPERATOR_PHONE_NUMBER",

    authSecret: "AUTH_SECRET",
    resendApiKey: "RESEND_API_KEY",
    authEmailFrom: "AUTH_EMAIL_FROM",

    autumnSecretKey: "AUTUMN_SECRET_KEY",

    zernioApiKey: "ZERNIO_API_KEY",
    zernioXAccountId: "ZERNIO_X_ACCOUNT_ID"
} as const

const APP_ENVIRONMENTS = ["development", "preview", "production"] as const

type AppEnvironment = (typeof APP_ENVIRONMENTS)[number]

/**
 * @remarks
 * A secret that must be present and non-empty. `Config.redacted` alone accepts an empty string,
 * which is the fail-open case we refuse: an unset credential has to fail, not read as blank.
 */
const secret = (name: string) => Config.nonEmptyString(name).pipe(Config.map(Redacted.make))

/**
 * @remarks
 * Runtime identity. This is the only group loaded on every request, so it stays tiny and every
 * member has a safe default that cannot grant access to anything.
 */
const runtime = Config.all({
    environment: Config.literals(APP_ENVIRONMENTS, ENV.appEnv).pipe(
        Config.withDefault("development" satisfies AppEnvironment)
    ),
    siteUrl: Config.string(ENV.siteUrl).pipe(Config.withDefault("http://localhost:3000")),

    //  The master kill switch for live outbound writes. Absent means off, never on.
    outboundEnabled: Config.boolean(ENV.outboundEnabled).pipe(Config.withDefault(false))
})

/**
 * @remarks
 * Capability groups are loaded by the feature that needs them, at the moment it needs them, and
 * they fail when incomplete. Nothing here has a default: a missing credential must surface as a
 * loud failure on the one route that depends on it, never as a silently degraded system.
 */
const database = Config.all({
    url: secret(ENV.databaseUrl)
})

const redis = Config.all({
    url: secret(ENV.redisUrl),
    restUrl: Config.nonEmptyString(ENV.redisRestUrl),
    restToken: secret(ENV.redisRestToken)
})

const queue = Config.all({
    url: Config.nonEmptyString(ENV.qstashUrl),
    token: secret(ENV.qstashToken),
    currentSigningKey: secret(ENV.qstashCurrentSigningKey),
    nextSigningKey: secret(ENV.qstashNextSigningKey)
})

const ai = Config.all({
    openrouterApiKey: secret(ENV.openrouterApiKey)
})

const imessage = Config.all({
    apiKey: secret(ENV.sendblueApiKey),
    apiSecret: secret(ENV.sendblueApiSecret),
    phoneNumber: Config.nonEmptyString(ENV.sendbluePhoneNumber),
    signingSecret: secret(ENV.sendblueSigningSecret)
})

const operator = Config.all({
    phoneNumber: Config.nonEmptyString(ENV.operatorPhoneNumber)
})

/**
 * @remarks
 * The public number, on its own. The site's call to action needs it without needing the messaging
 * credentials, and it is read as an option so a missing value renders an honest page rather than a
 * broken link.
 */
const contact = Config.all({
    phoneNumber: Config.option(Config.nonEmptyString(ENV.sendbluePhoneNumber))
})

const auth = Config.all({
    secret: secret(ENV.authSecret),
    resendApiKey: secret(ENV.resendApiKey),
    emailFrom: Config.nonEmptyString(ENV.authEmailFrom)
})

const payments = Config.all({
    autumnSecretKey: secret(ENV.autumnSecretKey)
})

const publishing = Config.all({
    zernioApiKey: secret(ENV.zernioApiKey),
    zernioXAccountId: Config.nonEmptyString(ENV.zernioXAccountId)
})

const config = {
    runtime,
    contact,
    database,
    redis,
    queue,
    ai,
    imessage,
    operator,
    auth,
    payments,
    publishing
}

export type { AppEnvironment }
export { APP_ENVIRONMENTS, config, ENV }

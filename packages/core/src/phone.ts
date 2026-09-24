import { Schema } from "effect"

/**
 * @remarks
 * Validation only, never normalisation: Sendblue delivers numbers in E.164 already, and a number
 * that arrives in any other shape is rejected rather than rewritten into something it may not be.
 */
const E164 = Schema.String.check(Schema.isPattern(/^\+[1-9]\d{6,14}$/))

type E164 = typeof E164.Type

export { E164 }

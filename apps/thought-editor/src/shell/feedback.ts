import { ValidationError } from "../data/writes.ts"
import { showToast } from "./toast.ts"

/**
 * Awaits a write and reports the outcome in the footer. Returns the result, or `undefined` when
 * the write was refused (the reason is already shown) so callers can simply stay put.
 */
export const runWrite = async <T>(work: Promise<T>, success: string): Promise<T | undefined> => {
    try {
        const result = await work
        showToast(success)
        return result
    } catch (error) {
        showToast(
            error instanceof ValidationError
                ? error.message
                : "Could not save. Details in the console.",
            "failure"
        )
        return undefined
    }
}

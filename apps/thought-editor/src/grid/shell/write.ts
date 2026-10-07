import { log } from "../../observability/log.ts"
import { showToast, trackActivity } from "./toast.ts"

/**
 * Runs a write to the shared store with the footer spinning, then a success toast, or a failure
 * toast that says what went wrong: a validation message as written, otherwise the failed
 * operation. The write itself already logged the cause. Resolves whether it succeeded.
 */
export const runWrite = async (work: Promise<unknown>, success: string, subtitle?: string) => {
    try {
        await trackActivity(work)
        showToast({ kind: "success", title: success, ...(subtitle && { subtitle }) })
        return true
    } catch (cause) {
        const message = cause instanceof Error ? cause.message : "The write failed."
        log("error", "grid write failed", { success, message })
        showToast({ kind: "failure", title: message })
        return false
    }
}

/**
 * A touch-only device (a phone, with no hover and a coarse pointer) opens the keyboard only when
 * the person taps a field. Moving focus from code there summons or swaps the iOS keyboard mid
 * gesture, which in WKWebView has crashed the Apple shell (D175), so code never moves focus on
 * such a device. Desktop, and an iPad with a pointer, keep keyboard-first focus.
 */
const touchOnly =
    typeof matchMedia !== "undefined" && matchMedia("(hover: none) and (pointer: coarse)").matches

/** Focuses `element` for keyboard-first use; a no-op on a touch-only device. */
export const focusFromCode = (element: HTMLElement | null | undefined) => {
    if (!touchOnly) element?.focus()
}

/**
 * The pure half of the drawn block caret (`caret.tsx`): which fields get one, how the text splits
 * around it, and where it lands on screen. Kept free of the DOM so it is testable without layout.
 */

export type Field = HTMLInputElement | HTMLTextAreaElement

/** Input types whose value is plain visible text, so a mirror of the value lays out like it. */
const TEXT_TYPES = new Set(["text", "search", "url", "email", "tel"])

/** Whether a focused element gets the drawn caret: an editable text input or textarea. */
export const isTextField = (el: {
    tagName: string
    type?: string
    readOnly?: boolean
    disabled?: boolean
}) =>
    !el.readOnly &&
    !el.disabled &&
    (el.tagName === "TEXTAREA" || (el.tagName === "INPUT" && TEXT_TYPES.has(el.type ?? "")))

/**
 * The text before the caret, the character under it, and the rest. The character is one whole
 * code point (an emoji is not cut in half), or empty at the end of the text or before a line
 * break, where the caret sits on blank space.
 */
export const splitAt = (value: string, offset: number) => {
    const before = value.slice(0, offset)
    const next = String.fromCodePoint(value.codePointAt(offset) ?? 10)
    const char = next === "\n" ? "" : next
    return { before, char, after: value.slice(offset + char.length) }
}

export type Rect = { left: number; top: number; right: number; bottom: number }

/** A field's geometry, as read from the element and its computed style. */
export type FieldBox = {
    rect: Rect
    clientLeft: number
    clientTop: number
    clientHeight: number
    paddingTop: number
    paddingBottom: number
    scrollLeft: number
    scrollTop: number
    lineHeight: number
    multiline: boolean
}

/** Where the caret's marker fell in the mirror, from the mirror's padding edge. */
export type Marker = { left: number; top: number }

export type CaretBox = { x: number; y: number; height: number }

/**
 * The caret's viewport position. Both fields start their text at the padding edge less their
 * scroll; a textarea's lines stack from the top, while a single-line input centres its one line
 * in the content box, as every engine does.
 */
export const caretBox = (field: FieldBox, marker: Marker): CaretBox => {
    const content = field.clientHeight - field.paddingTop - field.paddingBottom
    const top = field.multiline
        ? marker.top - field.scrollTop
        : field.paddingTop + (content - field.lineHeight) / 2
    return {
        x: field.rect.left + field.clientLeft + marker.left - field.scrollLeft,
        y: field.rect.top + field.clientTop + top,
        height: field.lineHeight
    }
}

/**
 * Whether the caret's leading edge, at mid-line, lies inside every clipping box (the field's own
 * text area, then each scrolling ancestor), so it never floats over text scrolled out of view.
 */
export const isInside = (caret: CaretBox, clips: Rect[]) => {
    const x = caret.x
    const y = caret.y + caret.height / 2
    return clips.every(
        clip => x >= clip.left && x <= clip.right && y >= clip.top && y <= clip.bottom
    )
}

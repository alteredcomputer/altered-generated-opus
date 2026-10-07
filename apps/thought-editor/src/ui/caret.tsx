import { useEffect, useRef, useState } from "react"
import {
    type CaretBox,
    caretBox,
    type Field,
    isInside,
    isTextField,
    type Rect,
    splitAt
} from "./caret-math.ts"

/**
 * The computed styles that decide where text wraps and how wide it is, copied onto the mirror so
 * it lays the value out exactly as the field does.
 */
const MIRRORED = [
    "direction",
    "fontFamily",
    "fontSize",
    "fontStyle",
    "fontWeight",
    "fontStretch",
    "fontVariant",
    "fontVariantLigatures",
    "fontFeatureSettings",
    "fontVariationSettings",
    "lineHeight",
    "letterSpacing",
    "wordSpacing",
    "textAlign",
    "textIndent",
    "textTransform",
    "tabSize",
    "wordBreak",
    "overflowWrap",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft"
] as const

type Drawn = CaretBox & { char: string; font: string; size: string; weight: string }

/** The scrolling ancestors' boxes, which clip the field and so the caret too. */
const clipsOf = (field: Field): Rect[] => {
    const clips: Rect[] = []
    for (let el = field.parentElement; el; el = el.parentElement) {
        const style = getComputedStyle(el)
        if (style.overflowX !== "visible" || style.overflowY !== "visible")
            clips.push(el.getBoundingClientRect())
    }
    return clips
}

/** Lays the value out in the mirror up to the caret and reads where the caret's cell falls. */
const measure = (field: Field, mirror: HTMLDivElement): Drawn | null => {
    const style = getComputedStyle(field)
    for (const key of MIRRORED) mirror.style[key] = style[key]
    const multiline = field instanceof HTMLTextAreaElement
    const paddingX = Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight)
    mirror.style.width = `${field.clientWidth - paddingX}px`
    mirror.style.whiteSpace = multiline ? style.whiteSpace : "pre"

    const { before, char, after } = splitAt(field.value, field.selectionStart ?? 0)
    const marker = document.createElement("span")
    // A zero-width space gives an empty cell a line box to sit in, and changes no wrap.
    marker.textContent = char || "​"
    mirror.replaceChildren(before, marker, after)

    const lineHeight = Number.parseFloat(style.lineHeight) || marker.getBoundingClientRect().height
    const rect = field.getBoundingClientRect()
    const box = caretBox(
        {
            rect,
            clientLeft: field.clientLeft,
            clientTop: field.clientTop,
            clientHeight: field.clientHeight,
            paddingTop: Number.parseFloat(style.paddingTop),
            paddingBottom: Number.parseFloat(style.paddingBottom),
            scrollLeft: field.scrollLeft,
            scrollTop: field.scrollTop,
            lineHeight,
            multiline
        },
        { left: marker.offsetLeft, top: marker.offsetTop }
    )
    mirror.replaceChildren()

    const inner: Rect = {
        left: rect.left + field.clientLeft,
        top: rect.top + field.clientTop,
        right: rect.left + field.clientLeft + field.clientWidth,
        bottom: rect.top + field.clientTop + field.clientHeight
    }
    if (!isInside(box, [inner, ...clipsOf(field)])) return null
    return { ...box, char, font: style.fontFamily, size: style.fontSize, weight: style.fontWeight }
}

/** What the caret depends on; while it is unchanged, the last measurement stands. */
const signature = (field: Field) => {
    const rect = field.getBoundingClientRect()
    return [
        field.value,
        field.selectionStart,
        field.selectionEnd,
        field.scrollLeft,
        field.scrollTop,
        rect.left,
        rect.top,
        rect.width,
        rect.height,
        document.fonts.status
    ].join("\u0000")
}

/**
 * A drawn block caret for every text field in the classic editor, one character cell wide, since
 * `caret-shape: block` is Chromium-only and Safari and WKWebView draw a thin bar. Mounted once:
 * it follows the focused input or textarea, measures the caret with a hidden mirror laid out like
 * the field, and draws a cell over it. The native caret turns transparent only while the drawn
 * one stands in for it (`html[data-block-caret]` in theme.css); a range selection or an IME
 * composition hides the drawn caret and hands back the native one. It reads the field every frame
 * while focused, as the grid's caret does, because no single event covers every caret move
 * (arrows, clicks, undo, IME, scrolling, a resize), and it re-measures only when something moved.
 */
export function BlockCaret() {
    const mirror = useRef<HTMLDivElement>(null)
    const [field, setField] = useState<Field | null>(null)
    const [drawn, setDrawn] = useState<Drawn | null>(null)

    useEffect(() => {
        const follow = () => {
            const active = document.activeElement
            setField(
                (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) &&
                    isTextField(active)
                    ? active
                    : null
            )
        }
        follow()
        document.addEventListener("focusin", follow)
        document.addEventListener("focusout", follow)
        return () => {
            document.removeEventListener("focusin", follow)
            document.removeEventListener("focusout", follow)
        }
    }, [])

    useEffect(() => {
        const root = document.documentElement
        const box = mirror.current
        if (!field || !box) {
            setDrawn(null)
            return
        }
        let composing = false
        const compose = (event: Event) => {
            composing = event.type === "compositionstart"
        }
        field.addEventListener("compositionstart", compose)
        field.addEventListener("compositionend", compose)

        let frame = 0
        let last = ""
        const tick = () => {
            frame = requestAnimationFrame(tick)
            const collapsed = field.selectionStart === field.selectionEnd
            const on = collapsed && !composing
            root.toggleAttribute("data-block-caret", on)
            if (!on) {
                last = ""
                setDrawn(null)
                return
            }
            const next = signature(field)
            if (next === last) return
            last = next
            setDrawn(measure(field, box))
        }
        tick()
        return () => {
            cancelAnimationFrame(frame)
            field.removeEventListener("compositionstart", compose)
            field.removeEventListener("compositionend", compose)
            root.removeAttribute("data-block-caret")
        }
    }, [field])

    return (
        <>
            <div ref={mirror} className="caret-mirror" aria-hidden />
            {drawn && (
                <span
                    // A new key restarts the blink, so the caret stays solid while it moves.
                    key={`${drawn.x},${drawn.y}`}
                    className="caret"
                    aria-hidden
                    style={{
                        left: drawn.x,
                        top: drawn.y,
                        height: drawn.height,
                        lineHeight: `${drawn.height}px`,
                        fontFamily: drawn.font,
                        fontSize: drawn.size,
                        fontWeight: drawn.weight
                    }}
                >
                    {drawn.char}
                </span>
            )}
        </>
    )
}

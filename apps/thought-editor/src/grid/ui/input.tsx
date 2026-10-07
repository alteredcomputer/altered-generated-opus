import { type CSSProperties, useEffect, useLayoutEffect, useRef, useState } from "react"
import { type Cells, cells, rows } from "./box.tsx"
import { width } from "./cells.ts"
import { useGridSize } from "./metrics.ts"
import { gridText } from "./text.tsx"
import { color, type Token } from "./theme.ts"

type Element = HTMLInputElement | HTMLTextAreaElement

/**
 * The field whose `focused` prop is set. The key router puts focus back on it when the reader
 * clicked away (to select text, say) and then types, so one field always owns the caret.
 */
export const focusOwner: { current: Element | null } = { current: null }

type FieldProps = {
    value: string
    onInput: (value: string) => void
    placeholder?: string
    /** For screen readers, since the grid draws labels as plain text. */
    label: string
    focused?: boolean
    width?: Cells
    flexGrow?: number
    bg?: Token
    fg?: Token
    placeholderFg?: Token
}

/** Where the block caret sits: x in pixels from the field's left edge, y in rows. */
export type Caret = { x: number; row: number; char: string }

/** The character under a block caret: the next one, or the placeholder's while empty. */
export const caretChar = (value: string, offset: number, placeholder: string) =>
    [...value.slice(offset)][0] ?? (value ? " " : ([...placeholder][0] ?? " "))

/** A single-line caret: the cells before it, less however far the field has scrolled. */
export const inputCaret = (
    value: string,
    offset: number,
    scrollLeft: number,
    cw: number,
    placeholder: string
): Caret => ({
    x: width(value.slice(0, offset)) * cw - scrollLeft,
    row: 0,
    char: caretChar(value, offset, placeholder)
})

/** Snaps a measured position to the cell it falls in. */
export const toCell = (px: number, size: number) => Math.round(px / size)

const fieldStyle = (props: FieldProps): CSSProperties =>
    ({
        "--f-bg": color(props.bg ?? "bg"),
        "--f-fg": color(props.fg ?? "fg"),
        "--f-placeholder": color(props.placeholderFg ?? "fgFaint"),
        ...(props.width !== undefined && { width: cells(props.width), flexShrink: 0 }),
        ...(props.flexGrow !== undefined && { flexGrow: props.flexGrow })
    }) as CSSProperties

/**
 * Focus follows the `focused` prop, as in OpenTUI: gaining it puts the caret at the end, losing
 * it scrolls the text back to the start (the TUI's native-feeling field). Returns whether the
 * element really has focus, which is when the caret is drawn.
 */
const useFieldFocus = (ref: { current: Element | null }, focused: boolean) => {
    const [active, setActive] = useState(false)
    useEffect(() => {
        const el = ref.current
        if (!el) return
        if (focused) {
            focusOwner.current = el
            if (document.activeElement !== el) {
                el.focus({ preventScroll: true })
                el.setSelectionRange(el.value.length, el.value.length)
            }
            return () => {
                if (focusOwner.current === el) focusOwner.current = null
            }
        }
        if (document.activeElement === el) el.blur()
        el.scrollLeft = 0
        el.scrollTop = 0
    }, [focused, ref])
    useEffect(() => {
        const el = ref.current
        if (!el) return
        const on = () => setActive(true)
        const off = () => setActive(false)
        el.addEventListener("focus", on)
        el.addEventListener("blur", off)
        setActive(document.activeElement === el)
        return () => {
            el.removeEventListener("focus", on)
            el.removeEventListener("blur", off)
        }
    }, [ref])
    return active
}

/**
 * Follows the selection every frame while focused: the selection has no single change event that
 * every engine fires for every caret move (arrows, clicks, IME, undo), and a frame read is cheap.
 * A range selection hides the block caret and shows the native highlight instead.
 */
const useCaret = <T,>(active: boolean, measure: () => T, idle: T) => {
    const [state, setState] = useState<T>(idle)
    const read = useRef(measure)
    read.current = measure
    const rest = useRef(idle)
    useEffect(() => {
        if (!active) return setState(rest.current)
        let frame = 0
        let last = ""
        const tick = () => {
            const next = read.current()
            const key = JSON.stringify(next)
            if (key !== last) {
                last = key
                setState(next)
            }
            frame = requestAnimationFrame(tick)
        }
        tick()
        return () => cancelAnimationFrame(frame)
    }, [active])
    return state
}

function BlockCaret({ caret }: { caret: Caret | null }) {
    if (!caret) return null
    return (
        <span
            // A new key restarts the blink, so the caret shows solid while it moves.
            key={`${caret.x},${caret.row}`}
            className="g-caret"
            style={{ left: `${caret.x}px`, top: rows(caret.row) }}
        >
            {caret.char}
        </span>
    )
}

/** The caret, and how far the field has scrolled: pixels for an input, rows for a textarea. */
type InputView = { caret: Caret | null; scroll: number }
const idleInput: InputView = { caret: null, scroll: 0 }

/**
 * A native single-line input on the grid, with the drawn block caret (D172, D176). The native
 * element keeps focus, the caret, selection, IME, and the clipboard, but its glyphs are
 * transparent: engines centre an input's text in its line by their own rounding (Chromium draws
 * it a pixel lower than block text at a 15 px line), so the visible text is drawn as ordinary grid
 * text, scrolled with the input, and every engine puts it on the same pixels.
 */
export function Input(props: FieldProps) {
    const { cw } = useGridSize()
    const ref = useRef<HTMLInputElement>(null)
    const active = useFieldFocus(ref, props.focused ?? false)
    const placeholder = props.placeholder ?? ""
    const view = useCaret<InputView>(
        active,
        () => {
            const el = ref.current
            if (!el || el.selectionStart === null) return idleInput
            const scroll = el.scrollLeft
            const collapsed = el.selectionStart === el.selectionEnd
            return {
                caret: collapsed
                    ? inputCaret(el.value, el.selectionStart, scroll, cw, placeholder)
                    : null,
                scroll
            }
        },
        idleInput
    )

    return (
        <div className="g-field" style={fieldStyle(props)}>
            <div className="g-field-text" aria-hidden>
                <span
                    style={{
                        transform: `translateX(${-view.scroll}px)`,
                        ...(!props.value && { color: "var(--f-placeholder)" })
                    }}
                >
                    {gridText(props.value || placeholder)}
                </span>
            </div>
            <input
                ref={ref}
                value={props.value}
                placeholder={props.placeholder}
                aria-label={props.label}
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                onChange={event => props.onInput(event.target.value)}
            />
            <BlockCaret caret={view.caret} />
        </div>
    )
}

type TextareaProps = FieldProps & { minRows?: number; maxRows?: number }

/**
 * A native textarea on the grid that grows by whole rows with its wrapped text, drawn like
 * `Input` (transparent native glyphs, grid text on top). The caret's row and column come from a
 * hidden mirror with the same width and wrapping, snapped to the cell.
 */
export function Textarea({ minRows = 1, maxRows = 12, ...props }: TextareaProps) {
    const { cw, lh } = useGridSize()
    const ref = useRef<HTMLTextAreaElement>(null)
    const mirror = useRef<HTMLDivElement>(null)
    const [height, setHeight] = useState(minRows)
    const active = useFieldFocus(ref, props.focused ?? false)

    /** Lays the text out in the mirror with a marker at `offset`; returns the marker's cell. */
    const layout = (offset: number) => {
        const box = mirror.current
        if (!box) return null
        const value = ref.current?.value ?? props.value
        const marker = document.createElement("span")
        marker.textContent = caretChar(value, offset, props.placeholder ?? "")
        box.replaceChildren(value.slice(0, offset), marker, `${value.slice(offset)}​`)
        return {
            col: toCell(marker.offsetLeft, cw),
            row: toCell(marker.offsetTop, lh),
            rows: Math.max(1, toCell(box.offsetHeight, lh)),
            char: marker.textContent
        }
    }

    useLayoutEffect(() => {
        const measured = layout(props.value.length)
        if (measured) setHeight(Math.max(minRows, Math.min(maxRows, measured.rows)))
    })

    const view = useCaret<InputView>(
        active,
        () => {
            const el = ref.current
            if (!el) return idleInput
            const scroll = toCell(el.scrollTop, lh)
            if (el.selectionStart !== el.selectionEnd) return { caret: null, scroll }
            const at = layout(el.selectionStart)
            return {
                caret: at && { x: at.col * cw, row: at.row - scroll, char: at.char },
                scroll
            }
        },
        idleInput
    )

    return (
        <div
            className="g-field g-field-area"
            style={{ ...fieldStyle(props), height: rows(height) }}
        >
            <div ref={mirror} className="g-mirror" aria-hidden />
            <div className="g-field-text g-field-text-area" aria-hidden>
                <div
                    style={{
                        transform: `translateY(${-view.scroll * lh}px)`,
                        ...(!props.value && { color: "var(--f-placeholder)" })
                    }}
                >
                    {gridText(props.value || (props.placeholder ?? ""))}
                </div>
            </div>
            <textarea
                ref={ref}
                value={props.value}
                placeholder={props.placeholder}
                aria-label={props.label}
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                onChange={event => props.onInput(event.target.value)}
            />
            <BlockCaret caret={view.caret} />
        </div>
    )
}

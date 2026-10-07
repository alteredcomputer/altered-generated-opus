import { Children, type CSSProperties, Fragment, isValidElement, type ReactNode } from "react"
import { type Cells, cells } from "./box.tsx"
import { segments } from "./cells.ts"
import { color, type Token } from "./theme.ts"

export type Attribute = "bold" | "dim" | "italic" | "underline" | "inverse"

type Inline = {
    fg?: Token
    bg?: Token
    attributes?: Attribute[]
    children?: ReactNode
}

const inlineClass = (attributes: Attribute[] = []) =>
    attributes
        .filter(attribute => attribute !== "inverse")
        .map(attribute => `g-${attribute}`)
        .join(" ")

const inlineStyle = ({ fg, bg, attributes = [] }: Inline): CSSProperties => {
    const inverse = attributes.includes("inverse")
    const front = inverse ? (bg ?? "bg") : fg
    const back = inverse ? (fg ?? "fg") : bg
    return {
        ...(front && { color: color(front) }),
        ...(back && { background: color(back) })
    }
}

/**
 * Strings render as runs the font draws on the grid; a character the font lacks (↵, ✓, braille)
 * is pinned to its cells, so it cannot shift what follows.
 */
const gridText = (children: ReactNode): ReactNode =>
    Children.map(children, child => {
        if (typeof child === "number") return String(child)
        if (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment)
            return gridText(child.props.children)
        if (typeof child !== "string") return isValidElement(child) ? child : null
        const parts = segments(child)
        if (parts.length === 1 && parts[0]?.cells === undefined) return child
        return parts.map((part, index) =>
            part.cells === undefined ? (
                part.text
            ) : (
                <span
                    // biome-ignore lint/suspicious/noArrayIndexKey: segments are positional.
                    key={index}
                    className="g-cell"
                    style={{ "--n": part.cells } as CSSProperties}
                >
                    {part.text}
                </span>
            )
        )
    })

export function Span(props: Inline) {
    return (
        <span className={inlineClass(props.attributes)} style={inlineStyle(props)}>
            {gridText(props.children)}
        </span>
    )
}

export function Strong(props: Omit<Inline, "attributes">) {
    return <Span {...props} attributes={["bold"]} />
}

export type TextProps = Inline & {
    /** none clips at the edge (fit the text first, see cells.ts); word and char wrap by row. */
    wrapMode?: "none" | "word" | "char"
    flexGrow?: number
    flexShrink?: number
    width?: Cells
    /** Lets the reader select and copy this text with the mouse. */
    selectable?: boolean
}

/** A block of text on the grid: OpenTUI's `text`. Children are strings, `Span`, and `Strong`. */
export function Text(props: TextProps) {
    const style: CSSProperties = inlineStyle(props)
    if (props.flexGrow !== undefined) style.flexGrow = props.flexGrow
    if (props.flexShrink !== undefined) style.flexShrink = props.flexShrink
    if (props.width !== undefined) {
        style.width = cells(props.width)
        style.flexShrink ??= 0
    }
    return (
        <div
            className={[
                "g-text",
                `g-wrap-${props.wrapMode ?? "word"}`,
                inlineClass(props.attributes),
                props.selectable ? "g-selectable" : ""
            ].join(" ")}
            style={style}
        >
            {gridText(props.children)}
        </div>
    )
}

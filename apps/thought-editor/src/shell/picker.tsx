import { useEffect, useRef, useState } from "react"
import { matches } from "../data/search.ts"
import { focusFromCode } from "../keyboard/focus.ts"
import { useKeyLayer } from "../keyboard/layers.ts"
import { Keys } from "../ui/kbd.tsx"

export type PickerItem = {
    id: string
    title: string
    section?: string
    keys?: string[]
    destructive?: boolean
    checked?: boolean
    run: () => void
}

type PickerProps = {
    items: PickerItem[]
    placeholder: string
    position: "top" | "bottom"
    onClose: () => void
    /** Keys the picker does not use itself, so view shortcuts keep working while it is open. */
    onOtherKey?: (event: KeyboardEvent) => void
}

/**
 * The floating, filterable list behind Cmd-K and the dataset filter. It owns the keyboard while
 * open and hands focus back to wherever it was when it closes.
 */
export function Picker({ items, placeholder, position, onClose, onOtherKey }: PickerProps) {
    const [query, setQuery] = useState("")
    const [index, setIndex] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)
    const listRef = useRef<HTMLDivElement>(null)

    const visible = items.filter(item => matches(query, item.title, item.section ?? ""))
    const cursor = Math.max(0, Math.min(index, visible.length - 1))

    useEffect(() => {
        const previous = document.activeElement
        const input = inputRef.current
        focusFromCode(input)
        return () => {
            //  Let go of the keyboard before the input unmounts, then hand focus back.
            if (document.activeElement === input) input?.blur()
            if (previous instanceof HTMLElement) focusFromCode(previous)
        }
    }, [])

    useEffect(() => {
        listRef.current
            ?.querySelector(`[data-index="${cursor}"]`)
            ?.scrollIntoView({ block: "nearest" })
    }, [cursor])

    const choose = (item: PickerItem | undefined) => {
        if (!item) return
        onClose()
        item.run()
    }

    const step = (delta: number) =>
        setIndex((cursor + delta + visible.length) % Math.max(visible.length, 1))

    useKeyLayer(event => {
        const plain = !event.metaKey && !event.ctrlKey && !event.altKey
        if (event.key === "Escape") onClose()
        else if (event.key === "ArrowDown" || (event.key === "Tab" && !event.shiftKey)) step(1)
        else if (event.key === "ArrowUp" || (event.key === "Tab" && event.shiftKey)) step(-1)
        else if (event.key === "Enter" && plain && !event.shiftKey) choose(visible[cursor])
        else {
            if (!plain) onOtherKey?.(event)
            return
        }
        event.preventDefault()
    }, true)

    return (
        <>
            <button
                type="button"
                className="picker-backdrop"
                aria-label="Close"
                onClick={onClose}
            />
            <div className={`picker picker-${position}`} role="dialog" aria-label={placeholder}>
                <div className="picker-list" ref={listRef} role="listbox">
                    {visible.length === 0 && <p className="picker-empty">No matches.</p>}
                    {visible.map((item, i) => (
                        <div key={item.id}>
                            {item.section && item.section !== visible[i - 1]?.section && (
                                <p className="picker-section">{item.section}</p>
                            )}
                            <button
                                type="button"
                                role="option"
                                data-index={i}
                                className="picker-item"
                                aria-selected={i === cursor}
                                data-destructive={item.destructive}
                                onMouseMove={() => setIndex(i)}
                                onClick={() => choose(item)}
                            >
                                <span>
                                    {item.checked !== undefined && (
                                        <span className="mark">
                                            {item.checked ? "[x] " : "[ ] "}
                                        </span>
                                    )}
                                    {item.title}
                                </span>
                                {item.keys && <Keys keys={item.keys} />}
                            </button>
                        </div>
                    ))}
                </div>
                <input
                    ref={inputRef}
                    className="picker-search"
                    placeholder={placeholder}
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    value={query}
                    onChange={event => {
                        setQuery(event.target.value)
                        setIndex(0)
                    }}
                />
            </div>
        </>
    )
}

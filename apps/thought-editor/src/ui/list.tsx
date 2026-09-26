import { type ReactNode, useEffect, useRef } from "react"
import "./list.css"

type ClickModifiers = { shiftKey: boolean; metaKey: boolean; ctrlKey: boolean }

type ListProps<T> = {
    items: T[]
    getId: (item: T) => string
    section: string
    empty: string
    cursor: string | null
    selected: string[]
    onClick: (id: string, modifiers: ClickModifiers) => void
    onActivate: (id: string) => void
    renderRow: (item: T) => ReactNode
    /** Right-hand pane, Raycast's list detail. */
    inspector?: ReactNode
    inspectorWidth?: string
}

/**
 * Rows never take focus, so typing always lands in the search bar, as in Raycast. When anything
 * is selected every row shows a markdown checkbox, which is the only selection affordance.
 */
export function List<T>(props: ListProps<T>) {
    const { items, getId, section, empty, cursor, selected, inspector, inspectorWidth } = props
    const listRef = useRef<HTMLDivElement>(null)
    const selecting = selected.length > 0

    useEffect(() => {
        if (cursor)
            listRef.current
                ?.querySelector(`[data-id="${CSS.escape(cursor)}"]`)
                ?.scrollIntoView({ block: "nearest" })
    }, [cursor])

    return (
        <div className="split">
            <div className="list" ref={listRef} role="listbox">
                <p className="list-section">
                    <span>{section}</span>
                    <span className="faint">
                        {selecting ? `${selected.length} of ${items.length}` : items.length}
                    </span>
                </p>
                {items.length === 0 && <p className="list-empty">{empty}</p>}
                {items.map(item => {
                    const id = getId(item)
                    return (
                        // biome-ignore lint/a11y/useKeyWithClickEvents: rows are driven by the view's key layer (arrows, Enter), never by row focus.
                        <div
                            key={id}
                            data-id={id}
                            role="option"
                            tabIndex={-1}
                            aria-selected={id === cursor}
                            className="row"
                            onMouseDown={event => event.preventDefault()}
                            onClick={event => props.onClick(id, event)}
                            onDoubleClick={() => props.onActivate(id)}
                        >
                            {selecting && (
                                <span className="mark row-check">
                                    {selected.includes(id) ? "[x]" : "[ ]"}
                                </span>
                            )}
                            {props.renderRow(item)}
                        </div>
                    )
                })}
            </div>
            {inspector && (
                <aside className="inspector" style={{ width: inspectorWidth }}>
                    {inspector}
                </aside>
            )}
        </div>
    )
}

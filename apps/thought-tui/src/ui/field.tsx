import type { InputRenderable } from "@opentui/core"
import { useEffect, useRef } from "react"
import { useUi } from "../config/provider.tsx"

const SELECT_ALL = [{ name: "a", ctrl: true, action: "select-all" as const }]

/**
 * A single-line text field that behaves like a native one: a fixed width, so long text scrolls
 * inside it instead of stretching its background; the caret jumps to the end when it gains focus
 * and the text scrolls back to the start when it loses it; Ctrl-A selects everything (Cmd-A
 * belongs to the terminal).
 */
export function Field({
    value,
    width,
    focused,
    placeholder,
    active,
    onChange
}: {
    value: string
    width: number
    focused: boolean
    placeholder: string
    /** Highlighted as the form's current field. */
    active: boolean
    onChange: (value: string) => void
}) {
    const { colors } = useUi()
    const ref = useRef<InputRenderable>(null)

    useEffect(() => {
        const input = ref.current
        if (!input) return
        if (focused) input.gotoBufferEnd()
        else input.cursorOffset = 0
    }, [focused])

    const bg = active ? colors.bgCursor : colors.bg
    return (
        <input
            ref={ref}
            width={width}
            flexShrink={0}
            focused={focused}
            value={value}
            placeholder={placeholder}
            placeholderColor={colors.fgFaint}
            textColor={colors.fg}
            focusedTextColor={colors.fg}
            backgroundColor={bg}
            focusedBackgroundColor={bg}
            cursorColor={colors.fg}
            keyBindings={SELECT_ALL}
            onInput={onChange}
        />
    )
}

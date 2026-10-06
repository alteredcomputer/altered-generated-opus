import { useUi } from "../config/provider.tsx"

/** A label followed by its key cap, the way footer actions and dialogs show their keys. */
export function Caps({ title, keys, strong }: { title?: string; keys: string; strong?: boolean }) {
    const { colors } = useUi()
    return (
        <text>
            {title && <span fg={strong ? colors.fg : colors.fgMuted}>{`${title} `}</span>}
            <span fg={colors.fgMuted} bg={colors.bgCursor}>{` ${keys} `}</span>
        </text>
    )
}

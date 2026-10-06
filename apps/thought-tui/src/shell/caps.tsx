import { color } from "../ui/theme.ts"

/** A label followed by its key cap, the way footer actions and dialogs show their keys. */
export function Caps({ title, keys, strong }: { title?: string; keys: string; strong?: boolean }) {
    return (
        <text>
            {title && <span fg={strong ? color.fg : color.fgMuted}>{`${title} `}</span>}
            <span fg={color.fgMuted} bg={color.bgChip}>{` ${keys} `}</span>
        </text>
    )
}

import { Span, Text } from "../ui/index.ts"

/** A label followed by its key cap, the way footer actions and dialogs show their keys. */
export function Caps({ title, keys, strong }: { title?: string; keys: string; strong?: boolean }) {
    return (
        <Text wrapMode="none" flexShrink={0}>
            {title && <Span fg={strong ? "fg" : "fgMuted"}>{`${title} `}</Span>}
            <Span fg="fgMuted" bg="bgCursor">{` ${keys} `}</Span>
        </Text>
    )
}

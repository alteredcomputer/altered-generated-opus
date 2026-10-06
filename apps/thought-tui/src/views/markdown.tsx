import { color } from "../ui/theme.ts"

/**
 * Markdown-shaped building blocks for detail panes: literal `#` marks that recede behind the words
 * they mark, `---` rules, chips, and key/value tables (D139, D172).
 */
export const Mark = ({ children }: { children: string }) => (
    <text fg={color.fgFaint}>{children}</text>
)

export const Heading = ({ level, children }: { level: 1 | 2; children: string }) => (
    <text>
        <span fg={color.fgFaint}>{`${"#".repeat(level)} `}</span>
        <strong fg={color.fg}>{children}</strong>
    </text>
)

export const Chips = ({ labels }: { labels: string[] }) =>
    labels.length === 0 ? (
        <text fg={color.fgFaint}>None</text>
    ) : (
        <box flexDirection="row" flexWrap="wrap" gap={1}>
            {labels.map(chip => (
                <text key={chip} fg={color.accent} bg={color.bgChip}>{` ${chip} `}</text>
            ))}
        </box>
    )

type Row = { key: string; value: string; note?: string }

export const Table = ({ rows }: { rows: Row[] }) => {
    if (rows.length === 0) return <text fg={color.fgFaint}>None</text>
    const keyWidth = Math.max(...rows.map(row => row.key.length)) + 2
    return (
        <box flexDirection="column">
            {rows.map((row, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: attribute names may repeat.
                <box key={i} flexDirection="row">
                    <text width={keyWidth} flexShrink={0} fg={color.fgFaint}>
                        {row.key}
                    </text>
                    <box flexDirection="row" flexWrap="wrap" flexShrink={1} columnGap={2}>
                        <text fg={color.fg}>{row.value}</text>
                        {row.note && <text fg={color.fgFaint}>{row.note}</text>}
                    </box>
                </box>
            ))}
        </box>
    )
}

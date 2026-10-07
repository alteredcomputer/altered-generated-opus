import { useUi } from "../config/provider.tsx"
import { Box, Span, Text, width } from "../ui/index.ts"

export type AttributeRow = {
    name: string
    value: string
    /** Built in (alias, content): marked with the lock glyph. */
    builtIn?: boolean
    /** Set by the system, not editable (created, modified, added): name and value dimmed. */
    system?: boolean
}

/**
 * Everything about a thought as one uniform list of name and value (D174): no headings and no
 * rules, just one blank row between the groups. `inspector.gap` spaces the rows out. Values can
 * be selected and copied with the mouse.
 */
export function AttributeList({ groups }: { groups: AttributeRow[][] }) {
    const { config } = useUi()
    const rows = groups.flat()
    const lock = ` ${config.glyphs.lock}`
    const nameWidth =
        Math.max(...rows.map(row => width(row.name) + (row.builtIn ? width(lock) : 0))) + 3
    return (
        <Box gap={1}>
            {groups
                .filter(group => group.length)
                .map(group => (
                    <Box key={group.map(row => row.name).join()} gap={config.inspector.gap}>
                        {group.map(row => (
                            <Box key={row.name} flexDirection="row">
                                <Text width={nameWidth} wrapMode="none">
                                    <Span fg={row.system ? "fgFaint" : "fgMuted"}>{row.name}</Span>
                                    {row.builtIn && <Span fg="fgFaint">{lock}</Span>}
                                </Text>
                                <Text
                                    flexShrink={1}
                                    selectable={Boolean(row.value)}
                                    fg={row.system ? "fgMuted" : row.value ? "fg" : "fgFaint"}
                                >
                                    {row.value || "Empty"}
                                </Text>
                            </Box>
                        ))}
                    </Box>
                ))}
        </Box>
    )
}

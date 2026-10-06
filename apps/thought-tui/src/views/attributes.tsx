import { useUi } from "../config/provider.tsx"
import { width } from "../ui/text.ts"

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
 * rules, just one blank row between the groups. `inspector.gap` spaces the rows out.
 */
export function AttributeList({ groups }: { groups: AttributeRow[][] }) {
    const { colors, config } = useUi()
    const rows = groups.flat()
    const lock = ` ${config.glyphs.lock}`
    const nameWidth =
        Math.max(...rows.map(row => width(row.name) + (row.builtIn ? width(lock) : 0))) + 3
    return (
        <box flexDirection="column" gap={1}>
            {groups
                .filter(group => group.length)
                .map(group => (
                    <box
                        key={group.map(row => row.name).join()}
                        flexDirection="column"
                        gap={config.inspector.gap}
                    >
                        {group.map(row => (
                            <box key={row.name} flexDirection="row">
                                <text width={nameWidth} flexShrink={0} wrapMode="none">
                                    <span fg={row.system ? colors.fgFaint : colors.fgMuted}>
                                        {row.name}
                                    </span>
                                    {row.builtIn && <span fg={colors.fgFaint}>{lock}</span>}
                                </text>
                                <text
                                    flexShrink={1}
                                    fg={
                                        row.system
                                            ? colors.fgMuted
                                            : row.value
                                              ? colors.fg
                                              : colors.fgFaint
                                    }
                                >
                                    {row.value || "Empty"}
                                </text>
                            </box>
                        ))}
                    </box>
                ))}
        </box>
    )
}

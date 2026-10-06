import { useTerminalDimensions } from "@opentui/react"
import { useUi } from "../config/provider.tsx"
import { width } from "../ui/text.ts"
import { inset } from "../ui/theme.ts"
import type { HelpEntry } from "./frame.tsx"
import { useKeyLayer } from "./keyboard.ts"
import { Overlay } from "./overlay.tsx"

/**
 * Every shortcut on one screen, grouped and laid out in columns: a map to read, not a menu to
 * search. Any key or a click closes it.
 */
export function KeyMap({ sections, onClose }: { sections: HelpEntry[]; onClose: () => void }) {
    const { colors } = useUi()
    const screen = useTerminalDimensions()
    useKeyLayer(() => {
        onClose()
        return true
    })

    const groups = new Map<string, HelpEntry[]>()
    for (const entry of sections) {
        const key = entry.section ?? "Navigate"
        groups.set(key, [...(groups.get(key) ?? []).filter(e => e.title !== entry.title), entry])
    }

    const columnWidth = 34
    const panelWidth = Math.min(screen.width - 2, columnWidth * 3 + 2 * inset + 2)
    const columns = Math.max(1, Math.floor((panelWidth - 2 - 2 * inset) / columnWidth))
    const cols: { title: string; entries: HelpEntry[] }[][] = Array.from(
        { length: columns },
        () => []
    )
    const heights = Array<number>(columns).fill(0)
    for (const [title, entries] of groups) {
        const shortest = heights.indexOf(Math.min(...heights))
        cols[shortest]?.push({ title, entries })
        heights[shortest] = (heights[shortest] ?? 0) + entries.length + 2
    }
    const height = Math.max(...heights) + 4

    return (
        <Overlay width={panelWidth} height={height} onClose={onClose}>
            <box flexDirection="row" paddingX={inset} paddingY={1} gap={0}>
                {cols.map((col, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: columns are positional.
                    <box key={i} width={columnWidth} flexDirection="column">
                        {col.map(group => (
                            <box key={group.title} flexDirection="column" marginBottom={1}>
                                <text fg={colors.fgFaint}>{group.title}</text>
                                {group.entries.map(entry => (
                                    <text key={entry.title} wrapMode="none">
                                        <span fg={colors.accent}>
                                            {entry.title.padEnd(
                                                columnWidth - 4 - width(entry.hint)
                                            )}
                                        </span>
                                        <span fg={colors.fgMuted}>{entry.hint}</span>
                                    </text>
                                ))}
                            </box>
                        ))}
                    </box>
                ))}
            </box>
        </Overlay>
    )
}

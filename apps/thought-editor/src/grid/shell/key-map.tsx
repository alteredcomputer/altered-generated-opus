import { Box, inset, padEnd, Span, Text, useGridSize, width } from "../ui/index.ts"
import type { HelpEntry } from "./frame.tsx"
import { useKeyLayer } from "./keyboard.ts"
import { Overlay } from "./overlay.tsx"

/**
 * Every shortcut on one screen, grouped and laid out in columns: a map to read, not a menu to
 * search. The keys shown are the ones that work in this host (D176). Any key or a click closes it.
 */
export function KeyMap({ sections, onClose }: { sections: HelpEntry[]; onClose: () => void }) {
    const screen = useGridSize()
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
    const panelWidth = Math.min(screen.cols - 2, columnWidth * 3 + 2 * inset + 2)
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
            <Box flexDirection="row" paddingX={inset} paddingY={1}>
                {cols.map((col, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: columns are positional.
                    <Box key={i} width={columnWidth}>
                        {col.map(group => (
                            <Box key={group.title} marginBottom={1}>
                                <Text fg="fgFaint">{group.title}</Text>
                                {group.entries.map(entry => (
                                    <Text key={entry.title} wrapMode="none">
                                        <Span fg="accent">
                                            {padEnd(
                                                entry.title,
                                                columnWidth - 4 - width(entry.hint)
                                            )}
                                        </Span>
                                        <Span fg="fgMuted">{entry.hint}</Span>
                                    </Text>
                                ))}
                            </Box>
                        ))}
                    </Box>
                ))}
            </Box>
        </Overlay>
    )
}

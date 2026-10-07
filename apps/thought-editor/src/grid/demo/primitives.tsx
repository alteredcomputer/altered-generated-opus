import { useState } from "react"
import {
    Box,
    GridRoot,
    Input,
    inset,
    type Mode,
    ScrollBox,
    Span,
    Strong,
    Text,
    Textarea,
    useGridSize
} from "../ui/index.ts"

/**
 * Every primitive on one page (`/grid?primitives`), for checking the grid by eye and for the
 * engine parity screenshots: borders that must join, glyphs the font lacks, wraps, the carets.
 */
export function PrimitivesPage() {
    const [mode, setMode] = useState<Mode>("dark")
    return (
        <GridRoot mode={mode}>
            <Primitives mode={mode} onToggle={() => setMode(mode === "dark" ? "light" : "dark")} />
        </GridRoot>
    )
}

const LONG =
    "Keep surfaces so plain that getting them exactly right is cheap. Every length is a whole number of cells, so nothing lands between pixels."

function Primitives({ mode, onToggle }: { mode: Mode; onToggle: () => void }) {
    const size = useGridSize()
    const [line, setLine] = useState("Type here")
    const [area, setArea] = useState(LONG)
    const [focus, setFocus] = useState<"line" | "area">("line")

    return (
        <Box flexGrow={1} paddingX={inset} paddingY={1} gap={1}>
            <Box flexDirection="row" gap={2}>
                <Text flexGrow={1}>
                    <Strong fg="fg">ALTERED</Strong>
                    <Span fg="fgFaint"> GRID PRIMITIVES</Span>
                </Text>
                <Box onMouseDown={onToggle}>
                    <Text>
                        <Span fg="fgMuted">{`${mode} `}</Span>
                        <Span fg="fgMuted" bg="bgCursor">
                            {" ⌘⇧D "}
                        </Span>
                    </Text>
                </Box>
            </Box>
            <Text fg="fgMuted">
                {`${size.cols} x ${size.rows} cells, ${size.cw} x ${size.lh} px, cell width by ${size.method}`}
            </Text>

            <Box flexDirection="row" gap={2}>
                <Box border borderColor="fgFaint" width={20} height={5} paddingX={1}>
                    <Text>single</Text>
                </Box>
                <Box border borderStyle="rounded" borderColor="fgFaint" width={20} height={5}>
                    <Text>rounded</Text>
                </Box>
                <Box border={["left"]} borderColor="rule" paddingLeft={1} height={5}>
                    <Text fg="fgMuted">left only</Text>
                </Box>
                <Box border={["top", "left"]} borderColor="fgMuted" width={14} height={5}>
                    <Text fg="fgMuted">top and left</Text>
                </Box>
            </Box>

            <Box flexDirection="row" gap={2}>
                <Text>
                    <Span attributes={["bold"]}>bold</Span> <Span attributes={["dim"]}>dim</Span>{" "}
                    <Span attributes={["italic"]}>italic</Span>{" "}
                    <Span attributes={["underline"]}>underline</Span>{" "}
                    <Span attributes={["inverse"]}>inverse</Span>{" "}
                    <Span fg="attention">attention</Span>
                </Text>
            </Box>
            <Text fg="fgMuted">{"0123456789".repeat(6)}</Text>
            <Text>{"↵ ⇧ ⇥ ⌄ ✓ ← ⌘ • ⣏⣩ ⢦⠞ ⡱⢎ 日本 ok|"}</Text>
            <Text>
                <Span fg="fgMuted" bg="bgCursor">
                    {" ^K "}
                </Span>
                <Span> Actions </Span>
                <Span fg="fgMuted" bg="bgCursor">
                    {" ⌘E "}
                </Span>
                <Span> Edit Thought</Span>
            </Text>

            <Box flexDirection="row" gap={2}>
                <Box width={30} border={["left"]} paddingLeft={1}>
                    <Text wrapMode="word">{LONG}</Text>
                </Box>
                <Box width={30} border={["left"]} paddingLeft={1}>
                    <Text wrapMode="char">{LONG}</Text>
                </Box>
                <Box width={30} border={["left"]} paddingLeft={1}>
                    <Text wrapMode="none">{LONG}</Text>
                </Box>
            </Box>

            <Box flexDirection="row" gap={2} height={8}>
                <ScrollBox width={30} border borderColor="fgFaint">
                    {Array.from({ length: 40 }, (_, i) => (
                        <Box
                            // biome-ignore lint/suspicious/noArrayIndexKey: a fixed demo list.
                            key={i}
                            paddingX={1}
                            backgroundColor={i % 2 ? "bgHover" : "bg"}
                        >
                            <Text>{`Row ${i + 1}`}</Text>
                        </Box>
                    ))}
                </ScrollBox>
                <Box flexGrow={1} gap={1}>
                    <Box flexDirection="row" onMouseDown={() => setFocus("line")}>
                        <Box width={10}>
                            <Text fg={focus === "line" ? "fg" : "fgMuted"}>Input</Text>
                        </Box>
                        <Input
                            label="Input"
                            width={30}
                            value={line}
                            focused={focus === "line"}
                            bg={focus === "line" ? "bgCursor" : "bg"}
                            placeholder="› Placeholder"
                            onInput={setLine}
                        />
                    </Box>
                    <Box flexDirection="row" onMouseDown={() => setFocus("area")}>
                        <Box width={10}>
                            <Text fg={focus === "area" ? "fg" : "fgMuted"}>Textarea</Text>
                        </Box>
                        <Textarea
                            label="Textarea"
                            width={30}
                            maxRows={5}
                            value={area}
                            focused={focus === "area"}
                            bg={focus === "area" ? "bgCursor" : "bg"}
                            onInput={setArea}
                        />
                    </Box>
                </Box>
            </Box>
        </Box>
    )
}

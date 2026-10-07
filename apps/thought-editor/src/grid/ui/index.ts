/**
 * The grid's closed set of primitives (D176), mirroring OpenTUI's intrinsics: `box`, `text`,
 * `span`, `strong`, `scrollbox`, `input`, and a textarea. Views compose these and nothing else;
 * `closed-styling.test.ts` (run by check:tests) enforces that no file outside this folder styles
 * anything.
 */
export { Box, type BoxProps, type Cells, type Side } from "./box.tsx"
export {
    charCells,
    ellipsize,
    ellipsizeMiddle,
    fitRow,
    padEnd,
    padStart,
    width,
    wrappedRows
} from "./cells.ts"
export { focusOwner, Input, Textarea } from "./input.tsx"
export { type Metrics, useGridSize } from "./metrics.ts"
export { GridRoot } from "./root.tsx"
export { ScrollBox } from "./scroll-box.tsx"
export { type Attribute, Span, Strong, Text } from "./text.tsx"
export { type Colors, dark, inset, light, type Mode, type Token } from "./theme.ts"

import { describe, expect, it } from "vitest"
import type { BoxProps } from "./box.tsx"
import type { TextProps } from "./text.tsx"

/**
 * The closed-styling constraint (D176), run by `check:tests`. Outside `src/grid/ui/`, no grid file
 * may style anything itself: no `className=`, no `style=`, no CSS import, no lowercase JSX element.
 * It fails closed: no files found, or a file that cannot be read, is a failure.
 */
const files = import.meta.glob<string>(["/src/**/*.{ts,tsx,css}", "!/src/**/*.test.ts"], {
    query: "?raw",
    import: "default",
    eager: true
})

const rules: { name: string; pattern: RegExp }[] = [
    { name: "a className prop", pattern: /\bclassName\s*=/ },
    { name: "a style prop", pattern: /\bstyle\s*=/ },
    { name: "a CSS import", pattern: /\bimport\s[^;]*?["'][^"']*\.css(\?[^"']*)?["']/ },
    { name: "a CSS import", pattern: /\bimport\s+["']@fontsource/ },
    // A lowercase tag not right after a name, bracket, or paren (which would be a type argument).
    { name: "a lowercase JSX element", pattern: /(?<![\w$)\]])<[a-z][\w-]*(?=[\s/>])/ }
]

const inGrid = (path: string) => path.startsWith("/src/grid/")
const inPrimitives = (path: string) => path.startsWith("/src/grid/ui/")

const violations = (path: string, source: unknown) => {
    if (typeof source !== "string" || source.length === 0) return [`${path}: unreadable`]
    if (path.endsWith(".css")) return [`${path}: a stylesheet outside src/grid/ui`]
    return rules.flatMap(rule =>
        source
            .split("\n")
            .flatMap((line, index) =>
                rule.pattern.test(line) ? [`${path}:${index + 1}: ${rule.name}`] : []
            )
    )
}

/** The files a source imports by relative path, resolved from the app root. */
const imports = (path: string, source: string) =>
    [
        ...source.matchAll(
            /\bfrom\s+["'](\.{1,2}\/[^"']+)["']|\bimport\s+["'](\.{1,2}\/[^"']+)["']/g
        )
    ].map(match => {
        const parts = path.split("/").slice(0, -1)
        for (const part of (match[1] ?? match[2] ?? "").split("/")) {
            if (part === "..") parts.pop()
            else if (part !== ".") parts.push(part)
        }
        return parts.join("/")
    })

describe("closed styling", () => {
    const grid = Object.keys(files).filter(inGrid)

    it("finds the grid's files", () => {
        expect(grid.length).toBeGreaterThan(10)
        expect(grid.some(inPrimitives)).toBe(true)
    })

    it("keeps every style outside the primitives out of the grid", () => {
        const found = grid
            .filter(path => !inPrimitives(path))
            .flatMap(path => violations(path, files[path]))
        expect(found).toEqual([])
    })

    it("uses only cell, row, and token lengths in the grid stylesheet", () => {
        const css = files["/src/grid/ui/grid.css"]
        expect(typeof css).toBe("string")
        const stray = String(css)
            .split("\n")
            .map((line, index) => ({ line: line.trim(), at: index + 1 }))
            .filter(({ line }) => /\d(px|em|rem|pt|vh|vw|ch)\b/.test(line))
            .filter(({ line }) => !/^(--lh|--bw|font-size): \d+px;$/.test(line))
            .filter(({ line }) => line !== "--cw: round(1ch, 1px);")
        expect(stray).toEqual([])
    })

    it("keeps the two editors' styles apart", () => {
        const crossing = Object.entries(files).flatMap(([path, source]) =>
            imports(path, source)
                .filter(target =>
                    inGrid(path)
                        ? !inGrid(target) && !/^\/src\/(data|observability)\//.test(target)
                        : inGrid(target)
                )
                .map(target => `${path} -> ${target}`)
        )
        expect(crossing).toEqual([])
    })

    it("gives the primitives no className or style props", () => {
        // @ts-expect-error: styling is closed to the primitive props.
        const box: BoxProps = { className: "x" }
        // @ts-expect-error: styling is closed to the primitive props.
        const text: TextProps = { style: { color: "red" } }
        expect([box, text]).toHaveLength(2)
    })
})

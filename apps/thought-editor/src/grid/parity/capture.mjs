/**
 * Engine parity for the grid (D176): the main screens in Chromium and WebKit at 1280x800 and
 * 390x844, every grid element's layout box compared to the pixel, and a pixel diff of each
 * screenshot pair. Box mismatches fail the run; pixel diffs are reported, since the engines
 * rasterise glyphs differently even on identical boxes. Run against a served build:
 *
 *   GRID_URL=http://localhost:4173 node src/grid/parity/capture.mjs
 *
 * ENGINES (default chromium,webkit) and OUT (default the system temp folder) are optional.
 */
import { mkdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { chromium, webkit } from "playwright"

const base = process.env.GRID_URL ?? "http://localhost:4173"
const out = process.env.OUT ?? join(tmpdir(), "grid-parity")
const engines = (process.env.ENGINES ?? "chromium,webkit").split(",")
const launchers = { chromium, webkit }
const sizes = [
    { name: "desktop", width: 1280, height: 800 },
    { name: "phone", width: 390, height: 844 }
]
const screens = [
    { name: "primitives", path: "/grid?primitives", keys: [] },
    { name: "list", path: "/grid", keys: [] },
    { name: "selection", path: "/grid", keys: ["ArrowDown", "Enter", "Shift+ArrowDown"] },
    { name: "actions", path: "/grid", keys: ["ControlOrMeta+k"] },
    { name: "keys", path: "/grid", keys: ["ControlOrMeta+/"] },
    {
        name: "edit",
        path: "/grid",
        keys: ["ArrowDown", "ArrowDown", "ArrowDown", "ArrowDown", "ControlOrMeta+e", "Tab", "Tab"]
    },
    { name: "datasets", path: "/grid", keys: ["ControlOrMeta+b", "ArrowDown"] },
    { name: "light", path: "/grid", keys: ["ControlOrMeta+Shift+d"] }
]
/** Every page sees the same clock, so ages and dates match across engines. */
const NOW = new Date("2026-10-07T12:00:00Z")

const say = line => process.stdout.write(`${line}\n`)

/** Each grid element's box, keyed by its position in the tree, rounded to whole pixels. */
const readBoxes = () => {
    const root = document.querySelector(".g-root")
    if (!root) return { error: "no .g-root" }
    const boxes = {}
    const walk = (element, path) => {
        const rect = element.getBoundingClientRect()
        if (/\bg-/.test(element.getAttribute("class") ?? ""))
            boxes[path] = [rect.x, rect.y, rect.width, rect.height].map(Math.round).join(",")
        for (const [i, child] of Array.from(element.children).entries()) walk(child, `${path}/${i}`)
    }
    walk(root, "root")
    return {
        boxes,
        cell: [root.dataset.cellMethod, getComputedStyle(root).getPropertyValue("--cw")]
    }
}

/** The share of pixels that differ between two PNGs, drawn in the page with a canvas. */
const pixelDiff = async (page, a, b) =>
    page.evaluate(
        async ([a, b]) => {
            const load = src =>
                new Promise((resolve, reject) => {
                    const image = new Image()
                    image.onload = () => resolve(image)
                    image.onerror = reject
                    image.src = `data:image/png;base64,${src}`
                })
            const [x, y] = await Promise.all([load(a), load(b)])
            const pixels = image => {
                const canvas = document.createElement("canvas")
                canvas.width = image.width
                canvas.height = image.height
                const context = canvas.getContext("2d")
                context.drawImage(image, 0, 0)
                return context.getImageData(0, 0, image.width, image.height).data
            }
            const p = pixels(x)
            const q = pixels(y)
            if (p.length !== q.length) return 1
            let differing = 0
            for (let i = 0; i < p.length; i += 4)
                if (
                    Math.abs(p[i] - q[i]) +
                        Math.abs(p[i + 1] - q[i + 1]) +
                        Math.abs(p[i + 2] - q[i + 2]) >
                    48
                )
                    differing++
            return differing / (p.length / 4)
        },
        [a.toString("base64"), b.toString("base64")]
    )

mkdirSync(out, { recursive: true })
const results = {}
const browsers = {}
for (const engine of engines) browsers[engine] = await launchers[engine].launch()

for (const size of sizes)
    for (const screen of screens) {
        const id = `${screen.name}-${size.name}`
        results[id] = {}
        for (const engine of engines) {
            const context = await browsers[engine].newContext({
                viewport: { width: size.width, height: size.height },
                deviceScaleFactor: 1
            })
            const page = await context.newPage()
            await page.clock.setFixedTime(NOW)
            await page.goto(`${base}${screen.path}`)
            await page.waitForSelector(".g-root[data-cell-method]")
            await page.waitForTimeout(300)
            for (const key of screen.keys) {
                await page.keyboard.press(key)
                await page.waitForTimeout(120)
            }
            await page.waitForTimeout(300)
            const shot = await page.screenshot({ animations: "disabled", caret: "initial" })
            writeFileSync(join(out, `${id}-${engine}.png`), shot)
            results[id][engine] = { ...(await page.evaluate(readBoxes)), shot }
            await context.close()
        }
    }

const report = { base, engines, screens: {} }
let mismatches = 0
for (const [id, byEngine] of Object.entries(results)) {
    const [first, ...rest] = engines
    const reference = byEngine[first]
    const entry = {
        cell: Object.fromEntries(engines.map(e => [e, byEngine[e].cell])),
        boxes: 0,
        mismatched: [],
        pixels: {}
    }
    entry.boxes = Object.keys(reference.boxes ?? {}).length
    for (const engine of rest) {
        const other = byEngine[engine]
        const paths = new Set([
            ...Object.keys(reference.boxes ?? {}),
            ...Object.keys(other.boxes ?? {})
        ])
        for (const path of paths)
            if (reference.boxes?.[path] !== other.boxes?.[path])
                entry.mismatched.push({
                    path,
                    [first]: reference.boxes?.[path] ?? null,
                    [engine]: other.boxes?.[path] ?? null
                })
        const page = await browsers[first].newPage()
        entry.pixels[engine] = await pixelDiff(page, reference.shot, other.shot)
        await page.close()
    }
    mismatches += entry.mismatched.length
    report.screens[id] = entry
    say(
        `${id}: ${entry.boxes} boxes, ${entry.mismatched.length} mismatched, cell ${JSON.stringify(entry.cell)}, pixels ${JSON.stringify(entry.pixels)}`
    )
}
writeFileSync(join(out, "report.json"), JSON.stringify(report, null, 4))
for (const browser of Object.values(browsers)) await browser.close()

if (mismatches) {
    say(`${mismatches} layout boxes differ between engines; see ${join(out, "report.json")}.`)
    process.exit(1)
}
say("Every layout box matches to the pixel.")

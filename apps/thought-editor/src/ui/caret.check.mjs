/**
 * Browser check for the classic editor's drawn block caret (ui/caret.tsx): it exists, sits one
 * cell past typed text in the search field and after a wrap in the thought textarea, hides on a
 * range selection and on blur, and the native caret is transparent only while it is drawn. The
 * expected positions come from cell arithmetic on the field's own box, not from the mirror the
 * caret measures with. Run against a served build:
 *
 *   EDITOR_URL=http://localhost:4173 node src/ui/caret.check.mjs
 *
 * ENGINES (default chromium) may add webkit where it is installed.
 */
import { chromium, webkit } from "playwright"

const base = process.env.EDITOR_URL ?? "http://localhost:4173"
const engines = (process.env.ENGINES ?? "chromium").split(",")
const launchers = { chromium, webkit }
const sizes = [
    { name: "desktop", width: 1280, height: 800 },
    { name: "phone", width: 390, height: 844 }
]

const failures = []
const say = line => process.stdout.write(`${line}\n`)
const expect = (label, ok, detail) => {
    say(`${ok ? "ok  " : "FAIL"} ${label}${ok ? "" : `: ${detail}`}`)
    if (!ok) failures.push(label)
}

/** The drawn caret's box, and where `cells` cells across and `row` rows down the field fall. */
const readCaret = (page, cells, row) =>
    page.evaluate(
        ([cells, row]) => {
            const field = document.activeElement
            const caret = document.querySelector(".caret")
            if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement))
                return { error: "no focused field" }
            const style = getComputedStyle(field)
            const context = document.createElement("canvas").getContext("2d")
            context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
            const cw = context.measureText("0").width
            const lh = Number.parseFloat(style.lineHeight)
            const rect = field.getBoundingClientRect()
            const padTop = Number.parseFloat(style.paddingTop)
            const content = field.clientHeight - padTop - Number.parseFloat(style.paddingBottom)
            const top =
                field instanceof HTMLTextAreaElement
                    ? padTop + row * lh - field.scrollTop
                    : padTop + (content - lh) / 2
            const box = caret?.getBoundingClientRect()
            return {
                caret: box && { x: box.x, y: box.y, width: box.width, height: box.height },
                pointer: caret && getComputedStyle(caret).pointerEvents,
                native: style.caretColor,
                expected: {
                    x:
                        rect.left +
                        field.clientLeft +
                        Number.parseFloat(style.paddingLeft) +
                        cells * cw -
                        field.scrollLeft,
                    y: rect.top + field.clientTop + top,
                    width: cw,
                    height: lh
                },
                cols: Math.floor(
                    (field.clientWidth -
                        Number.parseFloat(style.paddingLeft) -
                        Number.parseFloat(style.paddingRight)) /
                        cw
                )
            }
        },
        [cells, row]
    )

const near = (a, b) => Math.abs(a - b) <= 1.5
const placed = (label, read) => {
    const { caret, expected } = read
    expect(
        `${label}: caret at the expected cell`,
        caret &&
            near(caret.x, expected.x) &&
            near(caret.y, expected.y) &&
            near(caret.width, expected.width) &&
            near(caret.height, expected.height),
        JSON.stringify(read)
    )
}

const transparent = color => /^rgba\(0, 0, 0, 0\)$|^transparent$/.test(color)

for (const engine of engines) {
    const browser = await launchers[engine].launch()
    for (const size of sizes) {
        const label = `${engine} ${size.name}`
        const page = await browser.newPage({ viewport: size })
        await page.goto(base)
        await page.waitForSelector(".search:visible")
        await page.locator(".search:visible").click()
        await page.keyboard.type("hello")
        await page.waitForTimeout(100)

        const search = await readCaret(page, 5, 0)
        placed(`${label} search`, search)
        expect(`${label} search: pointer-events none`, search.pointer === "none", search.pointer)
        expect(
            `${label} search: native caret transparent`,
            transparent(search.native),
            search.native
        )

        await page.keyboard.press("Shift+ArrowLeft")
        await page.keyboard.press("Shift+ArrowLeft")
        await page.waitForTimeout(100)
        const selected = await readCaret(page, 0, 0)
        expect(`${label} search: hidden on a selection`, !selected.caret, "caret still drawn")
        expect(
            `${label} search: native caret back on a selection`,
            !transparent(selected.native),
            selected.native
        )

        await page.keyboard.press("Control+a")
        await page.keyboard.press("Backspace")
        await page.keyboard.press("Control+n")
        await page.waitForSelector("#content:visible")
        await page.locator("#content:visible").click()
        const { cols } = await readCaret(page, 0, 0)
        await page.keyboard.type("x".repeat(cols + 3))
        await page.waitForTimeout(100)
        placed(`${label} textarea after a wrap (${cols} cols)`, await readCaret(page, 3, 1))

        await page.keyboard.press("Enter")
        await page.keyboard.type("ab")
        await page.waitForTimeout(100)
        placed(`${label} textarea after a line break`, await readCaret(page, 2, 2))

        await page.evaluate(() => document.activeElement?.blur())
        await page.waitForTimeout(100)
        expect(
            `${label} hidden on blur`,
            (await page.locator(".caret").count()) === 0,
            "caret still drawn"
        )
        await page.close()
    }
    await browser.close()
}

if (failures.length) {
    say(`${failures.length} failed`)
    process.exit(1)
}
say("all passed")

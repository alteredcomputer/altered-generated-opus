import { GeistMono } from "geist/font/mono"
import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import type { ReactNode } from "react"
import "./globals.css"

/**
 * @remarks
 * Two monospace faces are declared and `--font-mono` in globals.css picks one, so the Geist Mono
 * trial (D139) flips back to Berkeley Mono by editing that single line. Berkeley is not preloaded
 * while unused; set `preload` back to true when it is picked again. Both fallback stacks are
 * monospace, so a failed load never breaks the character-based measurements the layout uses.
 */
const berkeleyMono = localFont({
    src: "../../public/fonts/berkeley-mono-variable.woff2",
    weight: "100 900",
    display: "swap",
    preload: false,
    variable: "--font-berkeley-mono",
    fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"]
})

export const metadata: Metadata = {
    title: "ALTERED",
    description: "Never lose your best thinking again.",

    //  Stays off until the owner has approved the copy.
    robots: { index: false, follow: false }
}

export const viewport: Viewport = {
    //  Equal to --bg in globals.css, light and dark; keep them in step.
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#fafafa" },
        { media: "(prefers-color-scheme: dark)", color: "#202020" }
    ]
}

const RootLayout = ({ children }: { children: ReactNode }) => (
    <html className={`${GeistMono.variable} ${berkeleyMono.variable}`} lang="en">
        <body>{children}</body>
    </html>
)

export default RootLayout

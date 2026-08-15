import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import type { ReactNode } from "react"
import "./globals.css"

/**
 * @remarks
 * Berkeley Mono, variable, as the single typeface. The fallback stack is listed so that a failed
 * font load degrades to another monospace rather than to a proportional face, which would break
 * the character-based measurements the layout is built on.
 */
const berkeleyMono = localFont({
    src: "../../public/fonts/berkeley-mono-variable.woff2",
    weight: "100 900",
    display: "swap",
    variable: "--font-mono",
    fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"]
})

export const metadata: Metadata = {
    title: "ALTERED",
    description: "Never lose your best thinking again.",

    //  Stays off until the owner has approved the copy.
    robots: { index: false, follow: false }
}

export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#fbfbfc" },
        { media: "(prefers-color-scheme: dark)", color: "#1c1c1f" }
    ]
}

const RootLayout = ({ children }: { children: ReactNode }) => (
    <html className={berkeleyMono.variable} lang="en">
        <body>{children}</body>
    </html>
)

export default RootLayout

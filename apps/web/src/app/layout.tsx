import type { Metadata } from "next"
import type { ReactNode } from "react"
import "./globals.css"

export const metadata: Metadata = {
    title: "ALTERED",
    description: "Knowledge orchestration infrastructure.",
    robots: { index: false, follow: false }
}

const RootLayout = ({ children }: { children: ReactNode }) => (
    <html lang="en">
        <body>{children}</body>
    </html>
)

export default RootLayout

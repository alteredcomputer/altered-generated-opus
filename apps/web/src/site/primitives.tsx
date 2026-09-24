import type { ReactNode } from "react"
import styles from "./primitives.module.css"

/**
 * @remarks
 * The page is built from markdown shapes only: a heading, prose, a divider, and a link. The
 * markdown syntax (`# `, `---`, `[label](target)`) is real text rather than CSS decoration, so it
 * copies and reads as markdown. Headings keep the `#` out of the accessible name, so a screen
 * reader says the heading rather than "number sign".
 */

const Heading = ({ level, children }: { level: 1 | 2 | 3; children: ReactNode }) => {
    const Tag = `h${level}` as const
    const marker = level === 3 ? "## " : "# "

    return (
        <Tag className={styles.heading}>
            <span aria-hidden="true">{marker}</span>
            {children}
        </Tag>
    )
}

const Prose = ({ children }: { children: ReactNode }) => <p className={styles.prose}>{children}</p>

const Divider = () => <p aria-hidden="true">---</p>

const MarkdownLink = ({ label, target, href }: { label: string; target: string; href: string }) => (
    <p>
        <a href={href}>
            [{label}]({target})
        </a>
    </p>
)

export { Divider, Heading, MarkdownLink, Prose }

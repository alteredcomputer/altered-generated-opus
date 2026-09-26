import type { ReactNode } from "react"
import styles from "./primitives.module.css"

/**
 * @remarks
 * The page is built from markdown shapes only. The markdown syntax (`#`, `**`, `>`, `---`,
 * `[label](target)`, front-matter keys) is real text rather than CSS decoration, so it copies and
 * reads as markdown. Every syntax mark is muted and kept out of the accessibility tree, so a
 * screen reader says the words rather than "number sign" or "greater than".
 */

const Mark = ({ children }: { children: ReactNode }) => (
    <span aria-hidden="true" className={styles.mark}>
        {children}
    </span>
)

const FrontMatter = ({ field, value }: { field: string; value: string }) => (
    <header className={styles.frontMatter}>
        <Mark>---</Mark>
        <p>
            <Mark>{field}: </Mark>
            <span className={styles.value}>{value}</span>
        </p>
        <Mark>---</Mark>
    </header>
)

const Heading = ({ level, children }: { level: 1 | 2 | 3; children: ReactNode }) => {
    const Tag = `h${level}` as const

    return (
        <Tag className={styles.heading}>
            <Mark>{"#".repeat(level)} </Mark>
            {children}
        </Tag>
    )
}

const Prose = ({ children }: { children: ReactNode }) => <p className={styles.prose}>{children}</p>

const Strong = ({ children }: { children: ReactNode }) => (
    <p className={styles.prose}>
        <Mark>**</Mark>
        <strong className={styles.strong}>{children}</strong>
        <Mark>**</Mark>
    </p>
)

const Divider = () => (
    <p aria-hidden="true" className={styles.mark}>
        ---
    </p>
)

const Blockquote = ({ children }: { children: ReactNode }) => (
    <blockquote className={styles.quote}>
        <p>
            <Mark>&gt; </Mark>
            <em>{children}</em>
        </p>
    </blockquote>
)

const MarkdownLink = ({
    label,
    target,
    href,
    prominent = false
}: {
    label: string
    target: string
    href: string
    prominent?: boolean
}) => (
    <p>
        <a className={prominent ? styles.prominent : undefined} href={href}>
            [{label}]({target})
        </a>
    </p>
)

export { Blockquote, Divider, FrontMatter, Heading, MarkdownLink, Prose, Strong }

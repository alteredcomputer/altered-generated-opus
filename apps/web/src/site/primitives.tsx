import type { ReactNode } from "react"
import type { Block } from "./content.ts"
import styles from "./primitives.module.css"

/**
 * @remarks
 * The page is built from four shapes only: a labelled section, prose, a list, and a two-column
 * pair. Constraining the vocabulary is what keeps the layout on the baseline grid and keeps copy
 * editable as data rather than as markup.
 */

const Label = ({ children }: { children: ReactNode }) => (
    <div className={styles.label}>{children}</div>
)

const Prose = ({ children }: { children: ReactNode }) => <p className={styles.prose}>{children}</p>

const Pairs = ({ items }: { items: readonly (readonly [string, string])[] }) => (
    <dl className={styles.pairs}>
        {items.map(([term, description]) => (
            <div className={styles.pair} key={term}>
                <dt className={styles.term}>{term}</dt>
                <dd className={styles.description}>{description}</dd>
            </div>
        ))}
    </dl>
)

const List = ({ items }: { items: readonly string[] }) => (
    <ul className={styles.list}>
        {items.map(item => (
            <li className={styles.item} key={item}>
                <span className={styles.bullet}>-</span>
                <span>{item}</span>
            </li>
        ))}
    </ul>
)

const renderBlock = (block: Block, index: number) => {
    const key = `${block.kind}-${index}`

    if (block.kind === "prose") return <Prose key={key}>{block.text}</Prose>
    if (block.kind === "list") return <List items={block.items} key={key} />

    return <Pairs items={block.items} key={key} />
}

const Section = ({ label, blocks }: { label: string; blocks: readonly Block[] }) => (
    <section className={styles.section}>
        <Label>{label}</Label>
        <div className={styles.body}>{blocks.map(renderBlock)}</div>
    </section>
)

export { Label, List, Pairs, Prose, Section }

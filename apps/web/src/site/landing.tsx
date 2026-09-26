import { config } from "@opus/core/config"
import { runRequest } from "@opus/core/runtime"
import { Effect, Option } from "effect"
import {
    type Block,
    footer,
    frontMatter,
    introduction,
    type Section,
    sections,
    tagline,
    textKoa
} from "./content.ts"
import styles from "./landing.module.css"
import {
    Blockquote,
    Divider,
    FrontMatter,
    Heading,
    MarkdownLink,
    Prose,
    Strong
} from "./primitives.tsx"

/**
 * @remarks
 * The call to action opens a text thread, because the conversation is where the sale happens and
 * because a page that asks you to text an agent should prove the agent exists in one tap.
 *
 * If the number is not configured the link is rendered as plain text. An invented or empty href
 * would look fine and silently lose every lead, which is the worst possible failure here.
 */
const TextKoa = ({ label, phoneNumber }: { label: string; phoneNumber: Option.Option<string> }) =>
    Option.isNone(phoneNumber) ? (
        <Prose>
            {label} - {textKoa.unavailable}
        </Prose>
    ) : (
        <MarkdownLink
            href={`sms:${phoneNumber.value}`}
            label={label}
            prominent
            target={textKoa.target}
        />
    )

const renderBlock = (phoneNumber: Option.Option<string>) => (block: Block, index: number) => {
    const key = `${block.kind}-${index}`

    if (block.kind === "prose") return <Prose key={key}>{block.text}</Prose>
    if (block.kind === "question")
        return (
            <Heading key={key} level={3}>
                {block.text}
            </Heading>
        )
    if (block.kind === "textKoa")
        return <TextKoa key={key} label={block.label} phoneNumber={phoneNumber} />

    return (
        <MarkdownLink href={`#${block.to}`} key={key} label={block.label} target={`#${block.to}`} />
    )
}

const SectionView = ({
    section,
    level,
    phoneNumber
}: {
    section: Section
    level: 1 | 2
    phoneNumber: Option.Option<string>
}) => (
    <section className={styles.stack} id={section.id}>
        {level === 2 && <Divider />}
        <Heading level={level}>{section.heading}</Heading>
        {section.blocks.map(renderBlock(phoneNumber))}
    </section>
)

/**
 * @remarks
 * Laid out as one honest markdown document (D139): front matter, the tagline as bold body text,
 * the single h1 opening the introduction, then `---`-divided h2 sections.
 */
const Landing = async () => {
    const phoneNumber = await runRequest(
        Effect.gen(function* () {
            const contact = yield* config.contact

            if (Option.isNone(contact.phoneNumber))
                yield* Effect.logWarning(
                    "Landing page rendered without a contact number; the call to action is disabled"
                )

            return contact.phoneNumber
        })
    )

    return (
        <main className={styles.page}>
            <FrontMatter field={frontMatter.field} value={frontMatter.value} />
            <Strong>{tagline}</Strong>

            <SectionView level={1} phoneNumber={phoneNumber} section={introduction} />
            {sections.map(section => (
                <SectionView
                    key={section.id}
                    level={2}
                    phoneNumber={phoneNumber}
                    section={section}
                />
            ))}

            <footer className={styles.stack}>
                <Divider />
                <Blockquote>{footer}</Blockquote>
            </footer>
        </main>
    )
}

export { Landing }

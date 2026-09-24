import { config } from "@opus/core/config"
import { runRequest } from "@opus/core/runtime"
import { Effect, Option } from "effect"
import { type Block, footer, hero, sections, textKoa } from "./content.ts"
import styles from "./landing.module.css"
import { Divider, Heading, MarkdownLink, Prose } from "./primitives.tsx"

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
        <MarkdownLink href={`sms:${phoneNumber.value}`} label={label} target={textKoa.target} />
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
            <header className={styles.logo}>
                <p>{hero.logo}</p>
            </header>

            <Heading level={1}>{hero.headline}</Heading>
            {hero.subtitle.map(paragraph => (
                <Prose key={paragraph}>{paragraph}</Prose>
            ))}

            {sections.map(section => (
                <section className={styles.section} id={section.id} key={section.id}>
                    <Divider />
                    <Heading level={2}>{section.heading}</Heading>
                    {section.blocks.map(renderBlock(phoneNumber))}
                </section>
            ))}

            <footer className={styles.section}>
                <Divider />
                <p>{footer}</p>
            </footer>
        </main>
    )
}

export { Landing }

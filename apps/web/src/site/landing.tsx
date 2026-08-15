import { config } from "@opus/core/config"
import { runRequest } from "@opus/core/runtime"
import { Effect, Option } from "effect"
import { hero, sections } from "./content.ts"
import styles from "./landing.module.css"
import { Section } from "./primitives.tsx"

/**
 * @remarks
 * The call to action opens a text thread, because the conversation is where the sale happens and
 * because a page that asks you to text an agent should prove the agent exists in one tap.
 *
 * If the number is not configured the button is not rendered as a link. An invented or empty href
 * would look fine and silently lose every lead, which is the worst possible failure here.
 */
const CallToAction = ({ phoneNumber }: { phoneNumber: Option.Option<string> }) => {
    if (Option.isNone(phoneNumber))
        return (
            <div className={styles.callToActionUnavailable}>
                {hero.callToAction} - unavailable, no contact number configured
            </div>
        )

    return (
        <div className={styles.callToActionGroup}>
            <a className={styles.callToAction} href={`sms:${phoneNumber.value}`}>
                {hero.callToAction}
            </a>
            <span className={styles.callToActionNote}>{hero.callToActionNote}</span>
        </div>
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
            <header className={styles.header}>
                <span>{hero.title}</span>
                <span aria-hidden="true" className="cursor" />
            </header>

            <div className={styles.hero}>
                <h1 className={styles.headline}>{hero.headline}</h1>
                <p className={styles.subhead}>{hero.subhead}</p>
                <CallToAction phoneNumber={phoneNumber} />
            </div>

            {sections.map(section => (
                <Section blocks={section.blocks} key={section.id} label={section.label} />
            ))}

            <footer className={styles.footer}>
                <span>ALTERED</span>
                <span>Generated, and said so.</span>
            </footer>
        </main>
    )
}

export { Landing }

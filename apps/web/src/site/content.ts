/**
 * Every word on the public site, in one place.
 *
 * @remarks
 * The structure is already data, so moving it to a settings store or CMS is a swap rather than a
 * rewrite.
 *
 * Interim state (D118): every price, date, and deliverable is gone, and only existing copy that
 * traces to a decision remains until Q80 settles the explainer's sections. Nothing here ships as
 * final until the owner approves it. The page is marked no-index until he does.
 */

type Block =
    | { readonly kind: "prose"; readonly text: string }
    | { readonly kind: "list"; readonly items: readonly string[] }
    | { readonly kind: "pairs"; readonly items: readonly (readonly [string, string])[] }

type Section = {
    readonly id: string
    readonly label: string
    readonly blocks: readonly Block[]
}

const hero = {
    title: "ALTERED",
    headline: "You already know what to build. You keep un-deciding it.",
    subhead:
        "Koa is an always-on iMessage agent that holds every decision you have made and the reasoning behind it, so you stop re-deriving your own conclusions and start shipping.",
    //  D116
    callToActionLabel: "Koa - early access",
    //  D103
    callToAction: "Text Koa",
    callToActionNote: "Opens a text thread."
} as const

const sections: readonly Section[] = [
    {
        id: "who",
        label: "WHO THIS IS FOR",
        blocks: [
            {
                kind: "prose",
                text: "You have the idea. You have re-scoped it four times. The blocker is not effort."
            },
            //  D081, D018
            {
                kind: "prose",
                text: "It is not for you if you have no direction at all, if the budget would hurt, or if the thing standing between you and shipping is a skill you have not learned yet."
            }
        ]
    }
]

export type { Block, Section }
export { hero, sections }

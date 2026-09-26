/**
 * Every word on the public site, in one place.
 *
 * @remarks
 * The structure is already data, so moving it to a settings store or CMS is a swap rather than a
 * rewrite.
 *
 * Drafted for the owner's review under D136, which lifts D118's "no new sentences" rule for this
 * pass. Every claim carries the decision it traces to. Nothing here ships as final until he
 * approves it, and the page stays no-index until he does. Pass two (D139) holds the copy: long
 * paragraphs are split into shorter chunks, with no words changed.
 */

type SectionId = "introduction" | "early-access" | "who" | "faq"

type Block =
    | { readonly kind: "prose"; readonly text: string }
    | { readonly kind: "question"; readonly text: string }
    | { readonly kind: "textKoa"; readonly label: string }
    | { readonly kind: "anchor"; readonly label: string; readonly to: SectionId }

type Section = {
    readonly id: SectionId
    readonly heading: string
    readonly blocks: readonly Block[]
}

//  D139: the logo as a front-matter field; plan 04's agent notes record why this key
const frontMatter = { field: "name", value: "altered" } as const

//  D136, drafted toward his note; alternatives are in plan 04's agent notes. D139: body text, not a heading
const tagline = "You know what you want to build. You just can't lock it in."

const introduction: Section = {
    id: "introduction",
    heading: "Introduction",
    blocks: [
        //  D019, compass: switching ships under pressure, and un-deciding
        {
            kind: "prose",
            text: "Every time the pressure hits, the plan shifts. A new idea looks better, a deadline gets closer, and you pivot again. A month later you are re-deriving conclusions you already reached."
        },
        //  D075, D101: an alignment agent on iMessage, with memory and self-scheduled reach-outs
        //  D019: the few that matter
        {
            kind: "prose",
            text: "Koa is an alignment agent you text on iMessage. It remembers what you decide and why, reaches out on its own when it judges you need it, and keeps you pointed at the few things that matter."
        },
        //  D060: deciding stays human; D067: never lose your best thinking
        { kind: "prose", text: "The decisions stay yours. Koa makes sure you stop losing them." },
        //  D116, D100: early access, an early and evolving generated build
        {
            kind: "prose",
            text: "Koa is in early access. This version is generated, and it is still evolving."
        }
    ]
}

const textKoa = {
    //  The visible target inside the parentheses; the real href is the sms: link.
    target: "text Koa",
    unavailable: "unavailable, no contact number configured"
} as const

const sections: readonly Section[] = [
    {
        id: "early-access",
        heading: "Early access program",
        blocks: [
            //  D136, D078
            { kind: "prose", text: "Early access to Koa comes through the Layer 1 program." },
            //  D078, D127: the founding program, mentioned without a price
            {
                kind: "prose",
                text: "Layer 1 is our founding program, for people who want ALTERED custom built around the one thing they have been stuck on for years."
            },
            //  D113: the real product on a threshold, never a feature gate
            {
                kind: "prose",
                text: "The free version is not a demo. It is the real Koa, memory and reach-outs included, up to a limit on time and usage."
            },
            //  D136, his phrasing
            {
                kind: "prose",
                text: "Try the generated version of the product and learn more about Layer 1. Text Koa using the link below."
            },
            //  D103, D136
            { kind: "textKoa", label: "Get early access to Koa" }
        ]
    },
    {
        id: "who",
        heading: "Who this is for",
        blocks: [
            //  D081, D136: his own example
            {
                kind: "prose",
                text: "You have an idea you want to build. Maybe it is an app, a social presence, or a company. You have redefined what it actually is about fifteen times this month."
            },
            //  Compass, the problems we solve: switching ships
            {
                kind: "prose",
                text: "You keep hitting the same roadblocks. Something new pulls you sideways."
            },
            //  Compass, the problems we solve: context re-explained, nothing reminds you
            {
                kind: "prose",
                text: "You re-explain your whole situation to every AI chat and get generic answers back. The quiet, important work drops because nothing reminds you."
            },
            //  D081: technical or not, a direction they cannot hold
            {
                kind: "prose",
                text: "You do not need to be technical. You need a direction you keep losing hold of, and the commitment to see it through."
            },
            //  D018, D081: the disqualification list
            {
                kind: "prose",
                text: "It is not for you if you have no direction at all, if the budget would hurt, or if the thing standing between you and shipping is a skill you have not learned yet."
            },
            //  D018
            { kind: "prose", text: "It is not a cure for procrastination either." }
        ]
    },
    {
        id: "faq",
        heading: "Frequently asked questions",
        blocks: [
            { kind: "question", text: "Who is Koa built for?" },
            //  D081
            {
                kind: "prose",
                text: "Solo builders, thinkers, founders, and creators who know where they want to go and keep losing the thread on the way there. Technical or not."
            },
            //  D081
            {
                kind: "prose",
                text: "If you have re-decided the same thing three times this week, it was built for you."
            },
            { kind: "question", text: "Is Koa right for me?" },
            //  D081, D018
            {
                kind: "prose",
                text: "Probably, if you have a direction and keep drifting off it. The quickest way to know is to text it."
            },
            //  D125: the first reply asks what they are working on
            {
                kind: "prose",
                text: "Koa asks what you are working on and what keeps getting in the way, and goes from there."
            },
            { kind: "question", text: "When is ALTERED officially going to ship?" },
            //  D082: no hard date; D100: Koa early access exists now
            { kind: "prose", text: "When it is ready. Koa's early access build exists now." },
            //  D100: the hand-written core is the long-term V1; D082: no hard date
            {
                kind: "prose",
                text: "The full ALTERED platform is being written by hand, line by line, and we would rather ship it right than ship it on a date."
            },
            { kind: "question", text: "What approach are you taking to building with AI?" },
            //  D100: generated under strict guardrails; D116: disclosed on purpose, authorship as a future feature
            {
                kind: "prose",
                text: "Two tracks, on purpose. Koa's early access build, like this page, is generated by AI under strict guardrails, and we say so openly because tracking who authored what is part of what we are building."
            },
            //  D122: the hand-written mirror, refinement, the MacBook framing; D100: migration by transform
            {
                kind: "prose",
                text: "The core platform is written by hand as the refined mirror of the generated build: the same product with every detail and edge case handled, for the same reason people buy a MacBook over a Windows laptop. When it lands, the generated build migrates into it."
            },
            { kind: "question", text: "What happens to what I tell Koa?" },
            //  D101: persistent memory; D113: memory works the same either side of the wall
            {
                kind: "prose",
                text: "Koa keeps it. Memory is the whole point, so what you tell it stays, on the free version and in the program alike."
            },
            //  D101: history carries into the program; D100: data migrates by transform
            {
                kind: "prose",
                text: "Your conversation history carries into the program, and when the hand-written platform lands, your data moves into it rather than starting over."
            },
            { kind: "question", text: "How can I get access?" },
            //  D136: the answer links back to the early access section; D127: Koa carries the pitch
            {
                kind: "prose",
                text: "Through the early access program. Text Koa, try it, and ask it about Layer 1."
            },
            { kind: "anchor", label: "Early access program", to: "early-access" }
        ]
    }
]

//  D116, D136
const footer = "This page was intentionally generated by AI."

export type { Block, Section, SectionId }
export { footer, frontMatter, introduction, sections, tagline, textKoa }

/**
 * Every word on the public site, in one place.
 *
 * @remarks
 * Copy and offer facts live together here so that a price or a date is stated once and rendered
 * everywhere from that one value. This is the shape a settings store or CMS would take, which is
 * the intended destination: the structure is already data, so moving it out of source is a swap
 * rather than a rewrite.
 *
 * Nothing here ships until the owner approves it. The page is marked no-index until he does.
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

/**
 * @remarks
 * The commercial facts. Every one of these traces to a locked decision, and no claim appears on the
 * page that is not derived from this object.
 */
const offer = {
    programName: "ALTERED Koa Layer 1",
    depositUsd: 100,
    totalUsd: 499,
    balanceUsd: 399,
    launchDate: "2026-11-05",
    launchDateLabel: "November 5, 2026",
    programMonths: 6
} as const

const hero = {
    title: "ALTERED",
    headline: "You already know what to build. You keep un-deciding it.",
    subhead:
        "Koa is an always-on iMessage agent that holds every decision you have made and the reasoning behind it, so you stop re-deriving your own conclusions and start shipping.",
    callToAction: "Start an application",
    callToActionNote: "Opens a text thread. No call, no form."
} as const

const sections: readonly Section[] = [
    {
        id: "layer-1",
        label: "WHAT LAYER 1 IS",
        blocks: [
            {
                kind: "prose",
                text: `Layer 1 is the first wave of people to use ALTERED. It is a ${offer.programMonths}-month program, and the people in it shape what the platform becomes. That is the whole reason the cohort is small.`
            },
            {
                kind: "prose",
                text: "You are not buying access to a finished product. You are reserving a seat, at a fixed price, in the version of it that gets built around the people who are there first."
            }
        ]
    },
    {
        id: "the-date",
        label: `WHAT ARRIVES ON ${offer.launchDateLabel.toUpperCase()}`,
        blocks: [
            {
                kind: "prose",
                text: "One date, and an exact list. If a thing is not on this list, we are not promising it."
            },
            {
                kind: "pairs",
                items: [
                    [
                        "Memory",
                        "Koa remembers what you told it, months later, with the reasoning attached and the original source still reachable."
                    ],
                    [
                        "Self-scheduled reach-outs",
                        "It texts you first, on its own schedule, about the thing you said mattered."
                    ],
                    [
                        "Voice notes",
                        "Talk for four minutes instead of typing for twenty. Both the audio and the transcript are kept."
                    ],
                    [
                        "Notes import",
                        "Bring in what you have already written and make it queryable instead of archived."
                    ]
                ]
            },
            {
                kind: "prose",
                text: `The ${offer.programMonths}-month program begins that day. If we miss the date, your deposit comes back.`
            }
        ]
    },
    {
        id: "the-deposit",
        label: "WHAT THE DEPOSIT DOES",
        blocks: [
            {
                kind: "pairs",
                items: [
                    [
                        "Holds a build slot",
                        "Time set aside to shape the product around your specific work, rather than around an average user who does not exist."
                    ],
                    [
                        "Locks the price",
                        `$${offer.totalUsd} total, whatever the price becomes later.`
                    ],
                    [
                        "Opens the room now",
                        "You are in the Discord from the day you reserve, while the thing is still being decided, not after."
                    ]
                ]
            }
        ]
    },
    {
        id: "who",
        label: "WHO THIS IS FOR",
        blocks: [
            {
                kind: "prose",
                text: "Detail-obsessed technical founders who are building something real and cannot finish it. You have the idea. You have re-scoped it four times. The blocker is not effort."
            },
            {
                kind: "prose",
                text: "It is not for you if you have no direction at all, if the budget would hurt, or if the thing standing between you and shipping is a skill you have not learned yet. We would be taking your money to solve a problem we do not solve."
            }
        ]
    },
    {
        id: "mechanism",
        label: "HOW IT WORKS",
        blocks: [
            {
                kind: "prose",
                text: "It is a text thread. That is deliberate. Anything you have to open an app to use is a thing you will stop using in a week."
            },
            {
                kind: "prose",
                text: "Underneath, your thinking is stored as structured, queryable records with real references back to where each one came from, rather than as a pile of text a model skims. That is why it can tell you what you decided in March and why."
            }
        ]
    },
    {
        id: "ethos",
        label: "WHY WE ARE SELLING THIS BEFORE IT EXISTS",
        blocks: [
            {
                kind: "prose",
                text: "Because the alternative was generating it, and we will not do that to this part."
            },
            {
                kind: "prose",
                text: "ALTERED is infrastructure. Other people's work will sit on top of its data model. A wrong column name or a missed primitive does not show up as a bug, it shows up two years later as a product that quietly turned into every other product. So the core is written by hand, by one person, on purpose."
            },
            {
                kind: "prose",
                text: "Everything around it - this page, the docs, the posts you found this through - is generated, and we say so. Human truth first. Machines on top of it, never underneath it."
            }
        ]
    },
    {
        id: "price",
        label: "PRICE",
        blocks: [
            {
                kind: "pairs",
                items: [
                    ["Today", `$${offer.depositUsd}`],
                    [`On ${offer.launchDateLabel}`, `$${offer.balanceUsd}`],
                    ["Total", `$${offer.totalUsd}`]
                ]
            },
            {
                kind: "prose",
                text: "Full refund, guaranteed. Once the program starts and you have actually used it, tell us why it did not work and the money goes back. Until then the deposit is what funds the build."
            }
        ]
    }
]

export type { Block, Section }
export { hero, offer, sections }

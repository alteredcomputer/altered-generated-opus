import { defineNodes } from "../model/node.ts"

/**
 * The feature graph's content: what this repository actually is, right now.
 *
 * @remarks
 * Authoring order is meaningful. Domains read top-down, and within a domain, children read in
 * composition order, because smaller pieces compose into larger ones.
 *
 * This file is the contract. Nodes are written before the code they describe, and reconciled with
 * reality before every merge.
 */
const nodes = defineNodes([
    //  === Governance ===

    {
        id: "governance",
        title: "Governance",
        description:
            "The contracts that steer every agent session: what may be touched, what has been decided, and what is still open. Nothing in this repo is built without them.",
        status: "done",
        data: { quality: { logging: "n/a", errorHandling: "n/a", tests: "n/a", security: true } }
    },
    {
        id: "governance-operating-contract",
        parent: "governance",
        title: "Operating contract",
        description:
            "The rules an agent reads first: the hard wall around the hand-written core, default-deny on external writes, the git policy, the quality bar, and the itemised security pass.",
        sources: ["AGENTS.md"],
        status: "done",
        data: { quality: { logging: "n/a", errorHandling: "n/a", tests: "n/a", security: true } }
    },
    {
        id: "governance-knowledge-base",
        parent: "governance",
        title: "Knowledge base",
        description:
            "The durable memory of the project: locked decisions with their reasoning, the open-question register, the owner's compass and macro plan, the direction record, guardrails and resource inventory, prior-art failures to avoid, and the resume file. Written so a restarted session loses nothing.",
        sources: ["knowledge/*.md", "README.md"],
        status: "done",
        data: {
            quality: { logging: "n/a", errorHandling: "n/a", tests: "n/a", security: true },
            docs: {
                title: "Knowledge base",
                description: "Decisions, constraints, open questions, prior art, and current state."
            }
        }
    },
    {
        id: "governance-source-archive",
        parent: "governance",
        title: "Source archive",
        description:
            "Verbatim records of the conversations the knowledge base distils from, preserved unaltered so no derivation loses its evidence. Content rules that apply to authored copy deliberately do not apply here.",
        sources: ["knowledge/sources/**"],
        relations: [{ type: "uses", to: "governance-knowledge-base" }],
        status: "done",
        data: { quality: { logging: "n/a", errorHandling: "n/a", tests: "n/a", security: true } }
    },
    {
        id: "governance-plans",
        parent: "governance",
        title: "Execution plans",
        description:
            "End-to-end plans, one per workstream, plus a master file carrying order and status. Written so a fresh agent can execute a plan from the file alone when the owner opens a chat and says next or finish. Executing agents append dated notes and update status in place.",
        sources: ["knowledge/plans/**"],
        relations: [{ type: "uses", to: "governance-knowledge-base" }],
        status: "done",
        data: {
            quality: { logging: "n/a", errorHandling: "n/a", tests: "n/a", security: true },
            docs: {
                title: "Plans",
                description: "The protocol for picking up a plan, the order, and the daily KPI log."
            }
        }
    },

    //  === Platform ===

    {
        id: "platform",
        title: "Platform",
        description:
            "Runtime foundations shared by every surface: configuration, provisioning readiness, and observability.",
        status: "in-progress"
    },
    {
        id: "platform-configuration",
        parent: "platform",
        title: "Configuration",
        description:
            "Declares every environment variable exactly once and exposes typed, per-capability config groups. Capability groups have no defaults, so a missing credential fails loudly on the route that needs it instead of silently degrading the system.",
        sources: ["packages/core/src/config.ts", ".env.example"],
        status: "done",
        data: {
            quality: { logging: "n/a", errorHandling: true, tests: false, security: true },
            remarks: [
                "Secrets are wrapped in Redacted so they cannot be printed by accident.",
                "Only the runtime group carries defaults, and every default is inert: outbound writes default to off."
            ]
        }
    },
    {
        id: "platform-readiness",
        parent: "platform",
        title: "Provisioning readiness",
        description:
            "Reports which capabilities are fully configured and which environment variables are absent, by name only. Makes provisioning verifiable without deploying a feature and waiting for it to break.",
        sources: ["packages/core/src/readiness.ts"],
        relations: [{ type: "uses", to: "platform-configuration" }],
        status: "done",
        data: {
            quality: { logging: "n/a", errorHandling: true, tests: false, security: true },
            remarks: ["Reads names, never values, so it cannot leak a secret."]
        }
    },
    {
        id: "platform-observability",
        parent: "platform",
        title: "Observability and request execution",
        description:
            "Structured JSON logging in deployed environments, readable output locally, a single entry point that runs a request-scoped effect and logs the full cause of any failure before it propagates, and a command-line runner that keeps logs on stderr, uncoloured, so a printed transcript stays clean.",
        sources: ["packages/core/src/runtime.ts"],
        status: "in-progress",
        data: {
            quality: { logging: true, errorHandling: true, tests: false, security: true },
            todos: [
                {
                    text: "Add correlation ids propagated through every request and log line.",
                    priority: 2
                },
                { text: "Add tracing spans once there is more than one hop to trace.", priority: 4 }
            ]
        }
    },
    {
        id: "platform-package",
        parent: "platform",
        title: "Core package definition",
        description: "Manifest and TypeScript configuration for the shared platform package.",
        sources: ["packages/core/package.json", "packages/core/tsconfig.json"],
        status: "done",
        data: { quality: { logging: "n/a", errorHandling: "n/a", tests: "n/a", security: "n/a" } }
    },

    //  === Web ===

    {
        id: "web",
        title: "Web application",
        description:
            "The single deployed surface. It serves the public site, the operator dashboard, and the API routes including inbound webhooks, so there is one deployment and one set of environment variables.",
        status: "in-progress"
    },
    {
        id: "web-application-shell",
        parent: "web",
        title: "Application shell",
        description:
            "Next.js configuration and the root layout, including the typeface declaration and the theme colour. Next's own agent-instruction generation is disabled here, because a nested instruction file would sit below the operating contract and dilute it.",
        sources: [
            "apps/web/package.json",
            "apps/web/tsconfig.json",
            "apps/web/next.config.ts",
            "apps/web/src/app/layout.tsx"
        ],
        status: "done",
        data: {
            quality: { logging: "n/a", errorHandling: "n/a", tests: false, security: true },
            remarks: ["Indexing stays disabled until the owner approves the copy."]
        }
    },
    {
        id: "web-visual-system",
        parent: "web",
        title: "Visual system",
        description:
            "Berkeley Mono on a strict baseline grid, with one pure monochrome neutral ramp (zero chroma: blacks, whites, and greys) resolved through light-dark so both themes come from a single palette, and a single accent used only for selection and focus. Every vertical measurement is a multiple of one line.",
        sources: ["apps/web/src/app/globals.css", "apps/web/public/fonts/**"],
        status: "in-progress",
        data: {
            quality: { logging: "n/a", errorHandling: "n/a", tests: "n/a", security: "n/a" },
            ui: { brandPalette: true, radiusRule: true, responsive: true },
            todos: [
                {
                    text: "Confirm dark-first against the current system-preference behaviour. His notes specify a dark grey background; the page currently follows the reader's setting.",
                    priority: 2
                },
                {
                    text: "Confirm the border radius rule. Zero was an agent assumption, not a stated preference.",
                    priority: 2
                },
                {
                    text: "Confirm the accent (Q39, open). Currently a warm amber, which lands on 'human' in his semantic colour map, but chosen by taste rather than from it. Left untouched by the monochrome change (D118).",
                    priority: 3
                },
                {
                    text: "Consider an ASCII, dither, or CRT treatment for the hero. Among his most repeated visual requests, and entirely absent so far.",
                    priority: 3
                }
            ],
            remarks: [
                "The blinking block cursor is the only motion on the page, and it respects reduced-motion.",
                "Grounded in knowledge/design-reference.md, which ranks his stated preferences and lists where this implementation currently conflicts with them."
            ]
        }
    },
    {
        id: "web-site-copy",
        parent: "web",
        title: "Site copy",
        description:
            "Every word on the public site, in one module. Interim state (D118): no price, no date, and no deliverables; the call to action is 'Text Koa' under the 'Koa - early access' label (D103, D116), and the only explainer kept is existing copy that traces to a decision: the headline, what Koa is, and who it is for.",
        sources: ["apps/web/src/site/content.ts"],
        status: "in-progress",
        data: {
            quality: { logging: "n/a", errorHandling: "n/a", tests: "n/a", security: "n/a" },
            todos: [
                { text: "Owner approval of every line before indexing is enabled.", priority: 1 },
                {
                    text: "Write the explainer's section set once Q80 is answered: Koa only, Koa plus one line on the founding program, or the program with its price.",
                    priority: 1
                },
                {
                    text: "Move the offer facts into a validated data file when the full rewrite states them (plan 04 step 1).",
                    priority: 3
                }
            ],
            remarks: [
                "Already shaped as data rather than markup, so moving it to a store is a swap rather than a rewrite."
            ]
        }
    },
    {
        id: "web-site-primitives",
        parent: "web",
        title: "Site primitives",
        description:
            "The four shapes the page is built from: a labelled section, prose, a list, and a two-column pair. Constraining the vocabulary keeps the layout on the baseline grid and lets copy stay editable as data.",
        sources: ["apps/web/src/site/primitives.tsx", "apps/web/src/site/primitives.module.css"],
        relations: [{ type: "uses", to: "web-visual-system" }],
        status: "done",
        data: {
            quality: { logging: "n/a", errorHandling: "n/a", tests: false, security: "n/a" },
            ui: { brandPalette: true, radiusRule: true, responsive: true }
        }
    },
    {
        id: "web-landing-page",
        parent: "web",
        title: "Landing page",
        description:
            "The public page, in its interim form (D118): a headline, what Koa is, a 'Text Koa' button under the 'Koa - early access' label that opens an sms: link to the configured contact number, who it is for, and the generated-and-disclosed footer. The thread, not the page, is the funnel (D103). If the contact number is not configured the call to action renders disabled rather than as a link to nowhere.",
        sources: [
            "apps/web/src/app/page.tsx",
            "apps/web/src/site/landing.tsx",
            "apps/web/src/site/landing.module.css"
        ],
        relations: [
            { type: "composes", to: "web-site-primitives" },
            { type: "uses", to: "web-site-copy" },
            { type: "uses", to: "platform-configuration" }
        ],
        status: "in-progress",
        data: {
            quality: { logging: true, errorHandling: true, tests: false, security: true },
            ui: { brandPalette: true, radiusRule: true, responsive: true },
            todos: [
                {
                    text: "Copy review and approval with the owner, then enable indexing.",
                    priority: 1
                },
                {
                    text: "Add the proof section once the staged conversation assets exist.",
                    priority: 2
                },
                {
                    text: "Add a frequently-asked-questions section built from real objections.",
                    priority: 3
                }
            ],
            remarks: [
                "Statically generated, so the contact number is read at build time and changing it needs a redeploy."
            ]
        }
    },
    {
        id: "web-health-endpoint",
        parent: "web",
        title: "Health and readiness endpoint",
        description:
            "Reports liveness and provisioning status. Outside production it names the missing variables so provisioning can be finished quickly; in production it reports only a count, because the set of integrations a system depends on is itself worth not publishing.",
        sources: ["apps/web/src/app/api/health/route.ts"],
        relations: [
            { type: "uses", to: "platform-readiness" },
            { type: "uses", to: "platform-observability" }
        ],
        status: "done",
        data: { quality: { logging: true, errorHandling: true, tests: false, security: true } }
    },

    //  === Feature graph ===

    {
        id: "feature-graph",
        title: "Feature graph",
        description:
            "A maintained, feature-level mirror of this repository. It lets the owner understand the codebase and its exact state of completion without reading code, and gives agents a contract to build against.",
        status: "in-progress",
        data: {
            docs: {
                title: "Feature graph",
                description:
                    "See knowledge/feature-graph.md for the model and the every-turn procedure."
            }
        }
    },
    {
        id: "feature-graph-model",
        parent: "feature-graph",
        title: "Node model",
        description:
            "Defines what a node is: title, description, dominant parent, typed relations, status, the source paths it accounts for, and dataset-shaped attributes for quality, todos, remarks, interface checks, documentation, and dynamic control keys.",
        sources: ["packages/graph/src/model/node.ts", "packages/graph/src/model/index.ts"],
        status: "done",
        data: { quality: { logging: "n/a", errorHandling: "n/a", tests: false, security: "n/a" } }
    },
    {
        id: "feature-graph-integrity-check",
        parent: "feature-graph",
        title: "Integrity and coverage check",
        description:
            "Validates that ids are unique, parents and relations resolve, and no parent cycle exists. Most importantly it enforces coverage: every file tracked by git must be claimed by at least one node, which turns drift into a failed check rather than a later discovery.",
        sources: ["packages/graph/src/model/check.ts"],
        relations: [{ type: "verifies", to: "feature-graph-content" }],
        status: "done",
        data: {
            quality: { logging: "n/a", errorHandling: true, tests: false, security: "n/a" },
            todos: [{ text: "Add a test for the coverage and cycle rules.", priority: 3 }]
        }
    },
    {
        id: "feature-graph-tree-view",
        parent: "feature-graph",
        title: "Tree rendering",
        description:
            "Renders the graph as an ordered, indented tree with status marks and todo counts. Authoring order is preserved rather than sorted, so the reading order follows composition.",
        sources: ["packages/graph/src/model/tree.ts"],
        status: "done",
        data: { quality: { logging: "n/a", errorHandling: "n/a", tests: false, security: "n/a" } }
    },
    {
        id: "feature-graph-cli",
        parent: "feature-graph",
        title: "Check command",
        description:
            "The `check:graph` entry point. Prints the tree, groups outstanding quality gaps, and exits non-zero on any integrity or coverage error so the check can gate a merge.",
        sources: ["packages/graph/src/cli.ts"],
        relations: [
            { type: "uses", to: "feature-graph-integrity-check" },
            { type: "uses", to: "feature-graph-tree-view" }
        ],
        status: "done",
        data: { quality: { logging: true, errorHandling: true, tests: false, security: "n/a" } }
    },
    {
        id: "feature-graph-content",
        parent: "feature-graph",
        title: "Graph content",
        description:
            "The nodes themselves: the current, honest description of everything in this repository.",
        sources: ["packages/graph/src/nodes/index.ts"],
        status: "in-progress",
        data: {
            quality: { logging: "n/a", errorHandling: "n/a", tests: "n/a", security: "n/a" }
        }
    },
    {
        id: "feature-graph-staleness",
        parent: "feature-graph",
        title: "Staleness and invalidation",
        description:
            "Not built yet. Each node will store a content hash of the files it claims; when that hash changes, every node related by `uses` or `composes` is flagged for re-verification. The motivating case is an inner component changing its padding and every composing component needing a fresh visual check.",
        status: "planned",
        data: {
            todos: [
                { text: "Store per-node source hashes and diff them on check.", priority: 3 },
                {
                    text: "Flag dependents stale, and make clearing a flag a deliberate act.",
                    priority: 3
                },
                {
                    text: "Add a frozen flag so a node that should not drift fails the check when its files change.",
                    priority: 4
                }
            ],
            remarks: [
                "Behaves like a dependency array: only what depends on a change is reconsidered, not the whole tree."
            ]
        }
    },
    {
        id: "feature-graph-scope-verification",
        parent: "feature-graph",
        title: "Minimalism and inherited spec packs",
        description:
            "Not built yet. Verifying that nothing extra was added is as important as verifying the feature works, and requirements that apply to a whole domain should be inherited by its subtree rather than restated on every node.",
        status: "planned",
        data: {
            todos: [
                {
                    text: "Add a minimalism attribute so unjustified scope is visible rather than invisible.",
                    priority: 3
                },
                {
                    text: "Let a subtree inherit a spec pack, so every API node carries the same security clauses by default.",
                    priority: 4
                }
            ]
        }
    },
    {
        id: "feature-graph-package",
        parent: "feature-graph",
        title: "Graph package definition",
        description: "Manifest and TypeScript configuration for the feature graph package.",
        sources: ["packages/graph/package.json", "packages/graph/tsconfig.json"],
        status: "done",
        data: { quality: { logging: "n/a", errorHandling: "n/a", tests: "n/a", security: "n/a" } }
    },
    {
        id: "feature-graph-dashboard",
        parent: "feature-graph",
        title: "Dashboard view",
        description:
            "Not built yet. The admin dashboard will render the graph as a collapsible tree with status, filterable todos sorted by priority, and the current values of any dynamic controls a node declares.",
        status: "planned",
        data: {
            todos: [
                {
                    text: "Render the tree in the dashboard once authentication exists.",
                    priority: 3
                },
                { text: "Add todo filtering by domain and priority.", priority: 3 }
            ]
        }
    },

    //  === Planned workstreams ===
    //
    //  One root per plan in knowledge/plans. Each plan names the child nodes it will add when it
    //  is executed; until then the root carries the contract so the graph and the plans agree.

    {
        id: "data-layer",
        title: "Data layer",
        description:
            "Postgres on Neon through Drizzle with a typed database service, the settings store that holds every value a human might change, and later an append-only audit log of operator actions. The database package and the settings store landed early, in plan 08 phase 1; plan 01 adds the audit log.",
        status: "in-progress",
        data: {
            controls: [
                "outbound.imessage",
                "outbound.payments",
                "outbound.publishing",
                "outbound.x"
            ],
            todos: [
                { text: "Audit table for operator actions (plan 01).", priority: 2 },
                {
                    text: "The outbound.* controls above are not read by anything yet; Koa's switch is koa.sendEnabled.",
                    priority: 3
                }
            ]
        }
    },
    {
        id: "data-layer-schema",
        parent: "data-layer",
        title: "Schema and migrations",
        description:
            "The tables every feature writes: persons, their messages, the stored bytes of their media, the event ledger, and settings. Every table holding a person's data carries the person id so reads filter on it at the query. Migrations are generated by drizzle-kit and committed.",
        sources: [
            "packages/db/src/schema.ts",
            "packages/db/drizzle.config.ts",
            "packages/db/drizzle/**"
        ],
        status: "done",
        data: { quality: { logging: "n/a", errorHandling: "n/a", tests: true, security: true } }
    },
    {
        id: "data-layer-database",
        parent: "data-layer",
        title: "Database service",
        description:
            "The typed database handle as an Effect service over the Neon HTTP driver, plus the migration runner. The connection string is a redacted secret and its absence is a loud failure.",
        sources: [
            "packages/db/src/client.ts",
            "packages/db/src/migrate.ts",
            "packages/db/src/testing.ts"
        ],
        relations: [
            { type: "uses", to: "data-layer-schema" },
            { type: "uses", to: "platform-configuration" }
        ],
        status: "done",
        data: { quality: { logging: true, errorHandling: true, tests: true, security: true } }
    },
    {
        id: "data-layer-settings",
        parent: "data-layer",
        title: "Settings store",
        description:
            "The one module every dynamic value is read through. Each key is declared once with its schema; a missing or malformed value is a typed failure, never a default that grants anything. A small CLI gets, sets, lists, and seeds values.",
        sources: [
            "packages/db/src/settings.ts",
            "packages/db/src/settings.test.ts",
            "packages/db/src/cli.ts"
        ],
        relations: [{ type: "uses", to: "data-layer-database" }],
        status: "done",
        data: {
            quality: { logging: true, errorHandling: true, tests: true, security: true },
            controls: [
                "koa.sendEnabled",
                "koa.allowlist",
                "koa.systemPrompt",
                "ai.model.koa",
                "ai.model.transcription"
            ],
            todos: [
                {
                    text: "Version the system prompt so an edit can be rolled back (plan 08 design).",
                    priority: 3
                }
            ]
        }
    },
    {
        id: "data-layer-package",
        parent: "data-layer",
        title: "Database package definition",
        description: "Manifest and TypeScript configuration for the database package.",
        sources: [
            "packages/db/package.json",
            "packages/db/tsconfig.json",
            "packages/db/vitest.config.ts"
        ],
        status: "done",
        data: { quality: { logging: "n/a", errorHandling: "n/a", tests: "n/a", security: "n/a" } }
    },
    {
        id: "koa",
        title: "Koa MVP",
        description:
            "The generated product (D100): the interactive Koa agent on iMessage through Sendblue, with persistent vector memory, self-scheduled reach-outs by agent judgment (D101), per-conversation concurrency control with a full event ledger, a per-user token budget, the wall (D113), an HITL hold for sensitive turns, and the sms-link funnel entry (D103). Fail-closed everywhere: absent webhook secret rejects, empty allowlist admits nobody, kill switches default off. Plan 08, built in six phases in series; phase 1 (the loop) is the children below.",
        relations: [{ type: "uses", to: "data-layer" }],
        status: "in-progress",
        data: {
            controls: [
                "koa.sendEnabled",
                "koa.allowlist",
                "koa.systemPrompt",
                "koa.dailyTokenBudgetPerUser",
                "koa.followupDailyCap",
                "koa.burstWindowMs",
                "ai.model.koa",
                "ai.model.embedding",
                "ai.model.sensitiveClassifier",
                "outbound.imessage"
            ],
            todos: [
                { text: "Phase 2: pgvector memory with person-scoped retrieval.", priority: 1 },
                {
                    text: "Phase 3: self-scheduling tool, cron drain, follow-up budget.",
                    priority: 1
                },
                {
                    text: "Phase 4: burst serialisation, idempotent sends, the event ledger.",
                    priority: 1
                },
                {
                    text: "Phase 5: token budget, the wall per Q70, sales lean, HITL hold.",
                    priority: 2
                },
                { text: "Phase 6: /go redirect, public number, cost views.", priority: 2 }
            ]
        }
    },
    {
        id: "koa-ledger",
        parent: "koa",
        title: "Event ledger",
        description:
            "Append-only record of everything the loop does: every inbound, skip, error, generation start and end with model, tokens, and cost, transcription, and outbound, each carrying a correlation id. It exists so a duplicate or timing bug can be diagnosed from data alone (prior art A3, D111). The schema is final now; the burst logic that reads it lands in phase 4.",
        sources: ["packages/koa/src/ledger.ts"],
        relations: [{ type: "uses", to: "data-layer-database" }],
        status: "in-progress",
        data: {
            quality: { logging: true, errorHandling: true, tests: true, security: true },
            todos: [
                {
                    text: "Phase 4: burst window and per-conversation serialisation, proven from the ledger.",
                    priority: 1
                }
            ]
        }
    },
    {
        id: "koa-store",
        parent: "koa",
        title: "Message store",
        description:
            "Persons and their messages. Every read takes a person id and filters on it in the query itself, so no code path can return another person's rows. Inbound messages are unique by provider message id, which is what makes a replayed webhook a no-op; outbound messages are unique by idempotency key, which is what makes a retried reply unable to double-text.",
        sources: [
            "packages/koa/src/store.ts",
            "packages/koa/src/store.test.ts",
            "packages/core/src/phone.ts"
        ],
        relations: [{ type: "uses", to: "data-layer-database" }],
        status: "done",
        data: { quality: { logging: true, errorHandling: true, tests: true, security: true } }
    },
    {
        id: "koa-voice-notes",
        parent: "koa",
        title: "Voice notes and media",
        description:
            "An inbound with a media attachment keeps the provider URL and a durable copy of the bytes in Postgres, because provider media links expire after 30 days (D112). Audio is transcribed by the model named in settings and the transcript is stored on the message, so the agent reads it and a human can too. A failure at any step is recorded, and the message is never dropped.",
        sources: ["packages/koa/src/voice.ts"],
        relations: [
            { type: "uses", to: "koa-store" },
            { type: "uses", to: "koa-ledger" },
            { type: "uses", to: "data-layer-settings" }
        ],
        status: "in-progress",
        data: {
            quality: { logging: true, errorHandling: true, tests: true, security: true },
            controls: ["ai.model.transcription"],
            todos: [
                {
                    text: "Move media bytes from Postgres to object storage once a bucket is approved; provisioning is denied today.",
                    priority: 3
                },
                {
                    text: "Verify transcription against a real iMessage voice note; the provider's audio format is unconfirmed, and OpenRouter refuses formats outside wav, mp3, aiff, aac, ogg, flac, m4a, and pcm (a .caf note would be recorded as a transcription error).",
                    priority: 1
                }
            ],
            remarks: [
                "The transcription model returned invented text for one second of silence in a 2026-09-24 check, so a transcript is the model's reading, not ground truth."
            ]
        }
    },
    {
        id: "koa-agent",
        parent: "koa",
        title: "Agent turn",
        description:
            "One reply to one person: the system prompt from settings, the person's own history as context, and everything the person wrote wrapped as untrusted data behind a per-turn boundary they cannot guess. The model comes from settings, and tokens and cost go to the ledger around every call.",
        sources: [
            "packages/koa/src/agent.ts",
            "packages/koa/src/agent.test.ts",
            "packages/koa/src/models.ts"
        ],
        relations: [
            { type: "uses", to: "koa-store" },
            { type: "uses", to: "koa-ledger" },
            { type: "uses", to: "data-layer-settings" }
        ],
        status: "in-progress",
        data: {
            quality: { logging: true, errorHandling: true, tests: true, security: true },
            controls: ["koa.systemPrompt", "ai.model.koa"],
            todos: [
                {
                    text: "The whole history is sent every turn; phase 2 memory replaces this with retrieval and compaction.",
                    priority: 1
                },
                {
                    text: "The seeded system prompt is a functional placeholder until Round 10 (Q76, Q77) supplies the copy.",
                    priority: 1
                }
            ]
        }
    },
    {
        id: "koa-messenger",
        parent: "koa",
        title: "Messenger",
        description:
            "How a reply leaves the system. A real Sendblue adapter is constructed only when OUTBOUND_ENABLED and koa.sendEnabled are both true; otherwise no sender exists at all and a skip event says which switch was off. A mock adapter behind the same interface records to the ledger and prints, for local conversation.",
        sources: ["packages/koa/src/messenger.ts"],
        relations: [
            { type: "uses", to: "koa-ledger" },
            { type: "uses", to: "data-layer-settings" }
        ],
        status: "in-progress",
        data: {
            quality: { logging: true, errorHandling: true, tests: true, security: true },
            controls: ["koa.sendEnabled"],
            todos: [
                {
                    text: "Phase 3: count follow-ups beyond the free 24-hour window against Sendblue's daily cap.",
                    priority: 2
                }
            ]
        }
    },
    {
        id: "koa-webhook",
        parent: "koa",
        title: "Inbound pipeline and Sendblue webhook",
        description:
            "The stable URL configured in Sendblue, and the pipeline behind it. The request must carry the shared signing secret (503 when it is not configured, 401 when it does not match); a replayed message id is a no-op. The message and an inbound event are persisted before the 200, then the turn runs: the allowlist admits nobody when empty, media is saved and transcribed, the agent replies, and the messenger sends or records why not.",
        sources: [
            "apps/web/src/app/api/webhooks/sendblue/route.ts",
            "packages/koa/src/webhook.ts",
            "packages/koa/src/webhook.test.ts",
            "packages/koa/src/pipeline.ts",
            "packages/koa/src/pipeline.test.ts",
            "packages/koa/src/testing.ts"
        ],
        relations: [
            { type: "uses", to: "koa-store" },
            { type: "uses", to: "koa-voice-notes" },
            { type: "uses", to: "koa-agent" },
            { type: "uses", to: "koa-messenger" },
            { type: "uses", to: "koa-ledger" },
            { type: "uses", to: "platform-observability" }
        ],
        status: "in-progress",
        data: {
            quality: { logging: true, errorHandling: true, tests: true, security: true },
            controls: ["koa.allowlist"],
            remarks: [
                "Verified locally under next start on 2026-09-24: 401 without or with a wrong header, 200 and persisted with the right one, replay a no-op, deferred turn recorded as skipped because OUTBOUND_ENABLED is off. Never yet exercised by Sendblue itself.",
                "Absorbed the inert web-imessage-webhook node in plan 08 phase 1; that id is retired and not reused."
            ],
            todos: [
                {
                    text: "Phase 4: messages arriving during a running turn each get their own turn today; the burst window fixes that.",
                    priority: 1
                },
                {
                    text: "Group-thread messages and senders that are not E.164 are acknowledged and logged but not stored.",
                    priority: 3
                }
            ]
        }
    },
    {
        id: "koa-cli",
        parent: "koa",
        title: "Koa command line",
        description:
            "Drives a local conversation through the same pipeline with the mock messenger, so the loop can be exercised without spending a message, and prints a person's ledger. Output is plain text, readable on a phone.",
        sources: ["packages/koa/src/cli.ts"],
        relations: [
            { type: "uses", to: "koa-webhook" },
            { type: "uses", to: "koa-ledger" }
        ],
        status: "done",
        data: {
            quality: { logging: true, errorHandling: true, tests: false, security: true },
            remarks: [
                "Chat refuses every number until it is on koa.allowlist, exactly like the webhook; add a test number with pnpm run db settings set, and remove it after."
            ]
        }
    },
    {
        id: "koa-package",
        parent: "koa",
        title: "Koa package definition",
        description: "Manifest and TypeScript configuration for the Koa package.",
        sources: [
            "packages/koa/package.json",
            "packages/koa/tsconfig.json",
            "packages/koa/vitest.config.ts"
        ],
        status: "done",
        data: { quality: { logging: "n/a", errorHandling: "n/a", tests: "n/a", security: "n/a" } }
    },
    {
        id: "dashboard",
        title: "Operator dashboard",
        description:
            "Not built yet. The phone-first shell every operator surface renders in: email-code login restricted to an operator allowlist that admits nobody when empty, bottom navigation, a home screen of readiness, kill switches, and the day's KPIs, installable as a PWA. Plan 01.",
        relations: [
            { type: "uses", to: "data-layer" },
            { type: "uses", to: "platform-readiness" }
        ],
        status: "planned",
        data: {
            todos: [
                { text: "Better Auth with email OTP via Resend; allowlist tests.", priority: 1 },
                { text: "Shell, home screen, PWA manifest, verified at 390px.", priority: 1 }
            ]
        }
    },
    {
        id: "outreach",
        title: "Outreach bench",
        description:
            "Not built yet. Sources candidate profiles by scraping public, logged-out Instagram surfaces from seed accounts and the owner's following (D095), with paste-in as fallback and X through Zernio as a gated later mode; scores each against a rubric with written reasoning; drafts one conversation opener per qualified profile; queues approved sends for a one-tap manual send until Q65 closes; and records approvals, sends, and replies as funnel events so the daily KPI is a query. No automation ever logs into the owner's account. Plan 02.",
        relations: [{ type: "uses", to: "data-layer" }],
        status: "planned",
        data: {
            controls: [
                "outreach.seedHandles",
                "outreach.scoreThreshold",
                "outreach.dailyBudgetCents",
                "outreach.excludedHandles",
                "outreach.xSourcingEnabled",
                "outreach.scrapeDelayMs",
                "outreach.scrapeMaxPages",
                "outreach.autoSendEnabled",
                "ai.model.scoring",
                "ai.model.drafting"
            ],
            todos: [
                { text: "Tables, rubric and brief files.", priority: 1 },
                {
                    text: "Logged-out scraper over public sources with rate limits and honest partial results.",
                    priority: 1
                },
                {
                    text: "X client behind a switch, with cost estimate and budget refusal.",
                    priority: 3
                },
                {
                    text: "Scoring and drafting with structured output and injection tests.",
                    priority: 1
                },
                { text: "Send queue with copy-and-open manual mode.", priority: 1 },
                { text: "Non-interactive CLI for an agent to run from a chat.", priority: 1 },
                { text: "Dashboard control panel once the shell exists.", priority: 2 }
            ]
        }
    },
    {
        id: "truth",
        title: "Truth surface",
        description:
            "Not built yet. Reads and edits the knowledge files from the phone through commits to this repository, so the owner and every agent read the same source. Section-level editing of decisions and questions, an answer flow that turns a question into a decision in one commit, plan status toggles, and copy rules enforced on save. Plan 03.",
        relations: [{ type: "uses", to: "dashboard" }],
        status: "planned",
        data: {
            todos: [
                { text: "GitHub contents service with SHA-conditional writes.", priority: 2 },
                {
                    text: "Markdown section parser with a byte-identical round-trip test.",
                    priority: 2
                },
                { text: "Decisions, questions, compass, plans, and files views.", priority: 2 }
            ]
        }
    },
    {
        id: "payments",
        title: "Money rails",
        description:
            "Not built yet. Takes the full-ticket payment (D102): an interim e-transfer instruction recorded in settings while Stripe waits on incorporation (D097), then Autumn checkout per buyer, accredited financing once Stripe works, a signature-verified webhook that writes the paid event, and refund recording with the buyer's stated reason (D089). The floor tier is recorded but never surfaced in copy. Every charge sits behind two kill switches. Plan 05.",
        relations: [{ type: "uses", to: "data-layer" }],
        status: "planned",
        data: {
            controls: [
                "payments.interimInstruction",
                "payments.refundWindowDays",
                "outbound.payments"
            ],
            todos: [
                {
                    text: "Interim e-transfer instruction setting and manual reserved recording.",
                    priority: 1
                },
                { text: "Autumn client, webhook with replay protection, refunds.", priority: 2 }
            ]
        }
    },
    {
        id: "desk",
        title: "Sales desk",
        description:
            "Not built yet. Human-in-the-loop selling over the social channels: verified inbound Instagram messages, an agent-drafted reply from the locked offer and the thread, a one-line notification to the operator, and a phone screen where he edits and approves before anything sends. Instagram sends are refused outside Meta's 24-hour window. No autonomous reply exists. Koa's own iMessage thread closes in plan 08 with HITL holds; this desk is the social side. Plan 06.",
        relations: [
            { type: "uses", to: "dashboard" },
            { type: "uses", to: "outreach" }
        ],
        status: "planned",
        data: {
            controls: ["ai.model.advisor", "desk.burstWindowSeconds"],
            todos: [
                { text: "Instagram inbound reads and message storage.", priority: 1 },
                { text: "Advisor drafting with escalation flags and stale handling.", priority: 2 },
                { text: "Send behind both switches and the 24-hour window check.", priority: 2 }
            ]
        }
    },

    {
        id: "assets",
        title: "Offer assets",
        description:
            "Not built yet. The non-product things a buyer touches in the first week: the long-form video script, the onboarding run-sheet and weekly session template, the care package design and print files, and the personal numbered page. Koa itself is product and belongs to plan 08. Plan 07.",
        relations: [{ type: "uses", to: "web-visual-system" }],
        status: "planned",
        data: {
            todos: [
                {
                    text: "Video script, full and ninety-second cut, beat by beat with decision traces.",
                    priority: 1
                },
                {
                    text: "Onboarding run-sheet, weekly session template, first-week touchpoints.",
                    priority: 1
                },
                { text: "Care package print files and bill of materials (D090).", priority: 2 },
                {
                    text: "Personal page scaffold, filled after the first sale (D094).",
                    priority: 3
                }
            ]
        }
    },

    //  === Tooling ===

    {
        id: "tooling",
        title: "Development tooling",
        description:
            "The workspace itself and the commands that keep it honest. These are features for whoever is developing, human or agent.",
        status: "done",
        data: { quality: { logging: "n/a", errorHandling: "n/a", tests: "n/a", security: "n/a" } }
    },
    {
        id: "tooling-workspace",
        parent: "tooling",
        title: "Workspace and build graph",
        description:
            "pnpm workspaces with a pinned dependency catalogue, the Turborepo task graph, and the shared TypeScript configuration. Versions are pinned exactly, because a moving release candidate is only acceptable under a lock.",
        sources: ["package.json", "pnpm-workspace.yaml", "turbo.json", "tsconfig.base.json"],
        status: "done",
        data: { quality: { logging: "n/a", errorHandling: "n/a", tests: "n/a", security: "n/a" } }
    },
    {
        id: "tooling-code-style",
        parent: "tooling",
        title: "Formatting and linting",
        description:
            "Biome as the single formatter and linter. Console usage is an error, so logging goes through the observability layer rather than appearing ad hoc.",
        sources: ["biome.json"],
        status: "done",
        data: { quality: { logging: "n/a", errorHandling: "n/a", tests: "n/a", security: "n/a" } }
    },
    {
        id: "tooling-verification",
        parent: "tooling",
        title: "Verification commands",
        description:
            "`pnpm check` runs types, style, the Vitest suites, and the feature graph together. It is the gate an agent runs before merging, and the reason a drifted graph cannot reach main.",
        sources: ["package.json"],
        relations: [{ type: "uses", to: "feature-graph-cli" }],
        status: "done",
        data: {
            quality: { logging: "n/a", errorHandling: true, tests: "n/a", security: "n/a" }
        }
    },
    {
        id: "tooling-continuous-integration",
        parent: "tooling",
        title: "Continuous integration",
        description:
            "Runs the same verification and build on every push that an agent runs locally, so a drifted graph or a broken type cannot reach main even if a session skips its end-of-turn pass.",
        sources: [".github/workflows/check.yml"],
        relations: [{ type: "verifies", to: "tooling-verification" }],
        status: "done",
        data: { quality: { logging: "n/a", errorHandling: true, tests: false, security: "n/a" } }
    }
])

export { nodes }

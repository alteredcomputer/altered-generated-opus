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
            "The durable memory of the project: locked decisions with their reasoning, the open-question register, guardrails and resource inventory, prior-art failures to avoid, and the resume file. Written so a restarted session loses nothing.",
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
            "Structured JSON logging in deployed environments, readable output locally, and a single entry point that runs a request-scoped effect and logs the full cause of any failure before it propagates.",
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
            "Next.js configuration, the root layout, placeholder styling, and a holding page. The visual system is deliberately not decided here; this exists so the application is deployable.",
        sources: [
            "apps/web/package.json",
            "apps/web/tsconfig.json",
            "apps/web/next.config.ts",
            "apps/web/src/app/layout.tsx",
            "apps/web/src/app/globals.css",
            "apps/web/src/app/page.tsx"
        ],
        status: "in-progress",
        data: {
            quality: { logging: "n/a", errorHandling: "n/a", tests: false, security: true },
            ui: { brandPalette: false, radiusRule: false, responsive: true },
            todos: [
                {
                    text: "Replace the holding page once the landing page is designed.",
                    priority: 3
                },
                {
                    text: "Adopt the brand palette and radius rule once the visual system is decided.",
                    priority: 3
                }
            ],
            remarks: ["Indexing is disabled until there is something worth indexing."]
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
    {
        id: "web-imessage-webhook",
        parent: "web",
        title: "Inbound iMessage webhook",
        description:
            "The stable URL configured in the messaging provider. It is deliberately inert: it acknowledges receipt and records that a message arrived, and takes no action on the payload.",
        sources: ["apps/web/src/app/api/webhooks/sendblue/route.ts"],
        relations: [{ type: "uses", to: "platform-observability" }],
        status: "in-progress",
        data: {
            quality: { logging: true, errorHandling: true, tests: false, security: true },
            todos: [
                {
                    text: "Verify the provider signature. Must land in the same change that first acts on the payload, never after it.",
                    priority: 1
                },
                {
                    text: "Wire the messaging adapter in burst mode, per the concurrency decision.",
                    priority: 1
                }
            ],
            remarks: [
                "Safe while inert: nothing acts on an unverified body, so an unverified request cannot cause an effect."
            ]
        }
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
            "`pnpm check` runs types, style, and the feature graph together. It is the gate an agent runs before merging, and the reason a drifted graph cannot reach main.",
        sources: ["package.json"],
        relations: [{ type: "uses", to: "feature-graph-cli" }],
        status: "done",
        data: {
            quality: { logging: "n/a", errorHandling: true, tests: false, security: "n/a" },
            todos: [{ text: "Add a test task once there is a test suite.", priority: 2 }]
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

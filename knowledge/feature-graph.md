# Feature graph

A maintained, feature-level mirror of everything in this repo. It exists so the owner can understand
the entire codebase, and its exact state of completion, without reading code - and so agents can
traverse the intended shape of the system before writing any.

It is an admin surface only. It is never exposed to users.

## What it is

A flat registry of nodes. Each node is defined once and independently, then placed in a tree by
naming a parent, and connected to other nodes by typed relations. The tree is derived, not authored,
so a node used by many features is still defined once.

Ordering matters: the tree reads top-down from broad domains to the narrowest unit of purpose, and
within a level, in composition order, because smaller pieces compose into larger ones.

Granularity is the narrowest useful *purpose*, not the smallest unit of syntax. A symbol does not
get a node just for existing. Lines that have no purpose of their own belong to the nearest node
that does - usually the function or module that contains them. Every line of the repo falls under
some node; not every line has its own.

## Node shape

```ts
type Node = {
    id: string            //  stable kebab-case, never reused after deletion
    title: string         //  short, human, no jargon
    description: string   //  one to three sentences on purpose, not mechanics
    parent?: NodeId       //  dominant position in the tree; absent means a root domain
    relations?: Relation[]
    sources?: string[]    //  file paths or globs this node accounts for
    status: "planned" | "in-progress" | "done"
    data?: DataPoints     //  dataset-shaped attributes, see below
}

type Relation = { type: "uses" | "composes" | "verifies" | "supersedes"; to: NodeId }
```

## Data points

Data points are schema-validated attribute bundles attached to nodes. Each bundle is a **dataset**
with a defined schema, applied to whichever nodes it is relevant for. A node missing a required
attribute is visible work rather than a silent gap.

Starting datasets:

- **`quality`** - applies to nearly every node. Booleans for `logging`, `errorHandling`, `tests`,
  and `security`. This is what makes a sweep possible: an agent asked to add logging everywhere
  queries for `quality.logging = false` and walks that list.
- **`todos`** - a list of `{ text, priority }` with priority 1 to 5. This replaces doc-comment TODOs
  for anything feature-sized. Because every todo lives in one queryable place, they can be filtered
  by domain, sorted by priority, and used to answer "what should be built next" directly.
- **`remarks`** - free-form notes that would otherwise become doc comments.
- **`ui`** - for interface nodes. Verification flags for brand palette adherence, the radius rule,
  and responsive behaviour.
- **`docs`** - title and description for anything that must be documented externally.
- **`controls`** - named references to dynamic values the owner can change at runtime: a model name,
  a dollar cap, a toggle. The node declares which control keys it reads. The values themselves live
  in the settings store, never in the graph.

Datasets are additive. New ones get defined when a real need appears, not preemptively.

## Where it lives

- **Structure** - in this repo, as typed source, validated at build time. It belongs with the code
  because it mirrors the code, and it should move in the same commit and be visible in the same
  diff.
- **Control values** - in the database or Redis, because they are dynamic by definition.
- **Presentation** - the admin dashboard reads the structure from the build and the values from the
  store, and renders a collapsible ordered tree with status, todos, and filters.

## Checks

A `graph:check` task, run in the end-of-turn verification pass and in CI:

1. Every id is unique, every parent exists, every relation resolves.
2. Every dataset attached to a node validates against its schema.
3. **Coverage**: every source file in the repo is claimed by at least one node's `sources`. This is
   what keeps the mirror honest and makes drift a build failure rather than a discovery.
4. No node is `done` while its `quality` attributes are false.

## Staleness and invalidation

Each node stores a content hash of the files it claims. When a node's hash changes, every node
related to it by `uses` or `composes` is flagged stale, so the reviewer knows exactly what needs
re-verification. The motivating case: an inner component changes its padding, and every component
that composes it needs a fresh visual check.

Flagging is automatic. Clearing a stale flag is a deliberate act by whoever verified it.

## Procedure

Contract first, reconcile last. From `AGENTS.md`:

- Before building, write the nodes for what is about to be built, as `planned`. Then build bottom-up
  against that contract.
- After building, reconcile. Development always uncovers discrepancies, so this pass is mandatory.
  Run `graph:check` and fix every drift before merging.

## Scope discipline

This is a light tool, not a product. It exists to give a fast, honest picture of the codebase and a
queryable backlog. Resist growing it: no per-symbol nodes, no bespoke query language, no
visualisation beyond a readable tree. If a feature of the graph is not something the owner will
actually look at, it does not get built.

## Lineage

The owner's Apple Notes describe an app concept called **Liminal**: conceptual version control for
code. This graph is a small, in-repo expression of that idea. Those notes should be read before the
model is extended, once the notes repo is reachable. They are not required for the first version.

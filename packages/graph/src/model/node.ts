/**
 * The feature graph's node model.
 *
 * @remarks
 * Nodes are declared individually and assembled into a tree by naming a parent, so a node used in
 * many places is still defined exactly once. Granularity is the narrowest useful *purpose*, never
 * the smallest unit of syntax: a symbol does not earn a node just by existing, and lines with no
 * purpose of their own belong to the nearest node that has one.
 */

type NodeId = string

type RelationType = "uses" | "composes" | "verifies" | "supersedes"

type Relation = {
    readonly type: RelationType
    readonly to: NodeId
}

type Status = "planned" | "in-progress" | "done"

type Priority = 1 | 2 | 3 | 4 | 5

/**
 * @remarks
 * Applies to nearly every node. Its purpose is sweepability: an agent told to add logging
 * everywhere queries for `quality.logging === false` and walks exactly that list, rather than
 * re-reading the codebase and guessing at what it missed.
 */
type QualityFlag = boolean | "n/a"

type Quality = {
    readonly logging: QualityFlag
    readonly errorHandling: QualityFlag
    readonly tests: QualityFlag
    readonly security: QualityFlag
}

/**
 * @remarks
 * Replaces doc-comment TODOs for anything feature-sized. Because every todo in the repo lives in
 * one queryable place, the backlog can be filtered by domain and sorted by priority to answer
 * "what should be built next" directly.
 */
type Todo = {
    readonly text: string
    readonly priority: Priority
}

type Ui = {
    readonly brandPalette: boolean
    readonly radiusRule: boolean
    readonly responsive: boolean
}

type Documentation = {
    readonly title: string
    readonly description: string
}

/**
 * @remarks
 * Dataset-shaped attribute bundles. Each is optional per node and applied only where it is
 * meaningful. New datasets get defined when a real need appears, never preemptively.
 *
 * `controls` names the dynamic settings keys a node reads. The keys live here; the values live in
 * the settings store, because they are dynamic by definition and must never be pinned in source.
 */
type Data = {
    readonly quality?: Quality
    readonly todos?: readonly Todo[]
    readonly remarks?: readonly string[]
    readonly ui?: Ui
    readonly docs?: Documentation
    readonly controls?: readonly string[]
}

type FeatureNode = {
    readonly id: NodeId
    readonly title: string
    /** One to three sentences on purpose, not mechanics. */
    readonly description: string
    /** Dominant position in the tree. Absent means a root domain. */
    readonly parent?: NodeId
    readonly relations?: readonly Relation[]
    /** Repo-relative paths or globs this node accounts for. Drives the coverage check. */
    readonly sources?: readonly string[]
    readonly status: Status
    readonly data?: Data
}

const defineNodes = (nodes: readonly FeatureNode[]): readonly FeatureNode[] => nodes

export type {
    Data,
    Documentation,
    FeatureNode,
    NodeId,
    Priority,
    Quality,
    QualityFlag,
    Relation,
    RelationType,
    Status,
    Todo,
    Ui
}
export { defineNodes }

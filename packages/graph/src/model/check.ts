import { execFileSync } from "node:child_process"
import { matchesGlob } from "node:path"
import type { FeatureNode, NodeId } from "./node.ts"

/**
 * @remarks
 * Files that legitimately have no feature to describe. Everything else in the repo must be claimed
 * by a node, which is what keeps the mirror honest: drift becomes a failed check rather than a
 * discovery months later.
 */
const UNCLAIMED_BY_DESIGN = [".gitignore", "pnpm-lock.yaml"] as const

/**
 * @remarks
 * Findings carry a label and a subject separately so a reader can group them without parsing
 * prose. Eight nodes missing tests should read as one line, not eight.
 */
type Finding = {
    readonly kind: "error" | "warning"
    readonly label: string
    readonly subject: string
}

type CheckResult = {
    readonly findings: readonly Finding[]
    readonly trackedFileCount: number
    readonly claimedFileCount: number
}

/**
 * @remarks
 * Includes files that are not yet committed but are not ignored, so a new file is covered by the
 * check the moment it is written rather than only once it is staged.
 */
const repoFiles = (repoRoot: string): readonly string[] =>
    execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
        cwd: repoRoot,
        encoding: "utf8"
    })
        .split("\n")
        .filter(line => line.length > 0)

const claims = (node: FeatureNode, file: string): boolean =>
    (node.sources ?? []).some(pattern => file === pattern || matchesGlob(file, pattern))

const findCycle = (nodes: readonly FeatureNode[]): readonly NodeId[] | undefined => {
    const parents = new Map(nodes.map(node => [node.id, node.parent]))

    for (const node of nodes) {
        const seen: NodeId[] = []
        let current: NodeId | undefined = node.id

        while (current !== undefined) {
            if (seen.includes(current)) return [...seen, current]

            seen.push(current)
            current = parents.get(current)
        }
    }

    return undefined
}

const checkGraph = (nodes: readonly FeatureNode[], repoRoot: string): CheckResult => {
    const findings: Finding[] = []
    const error = (label: string, subject: string) =>
        findings.push({ kind: "error", label, subject })
    const warn = (label: string, subject: string) =>
        findings.push({ kind: "warning", label, subject })

    const ids = new Set<NodeId>()

    for (const node of nodes) {
        if (ids.has(node.id)) error("duplicate node id", node.id)
        ids.add(node.id)
    }

    for (const node of nodes) {
        if (node.parent !== undefined && !ids.has(node.parent))
            error("parent does not exist", `${node.id} -> ${node.parent}`)

        for (const relation of node.relations ?? [])
            if (!ids.has(relation.to))
                error(`${relation.type} target does not exist`, `${node.id} -> ${relation.to}`)

        if (node.status === "done" && node.data?.quality === undefined)
            error("done without declared quality", node.id)

        for (const [attribute, satisfied] of Object.entries(node.data?.quality ?? {}))
            if (satisfied === false && node.status === "done") warn(`missing ${attribute}`, node.id)
    }

    const cycle = findCycle(nodes)
    if (cycle !== undefined) error("parent cycle", cycle.join(" -> "))

    const files = repoFiles(repoRoot)
    const claimable = files.filter(
        file => !UNCLAIMED_BY_DESIGN.some(pattern => file === pattern || matchesGlob(file, pattern))
    )

    const unclaimed = claimable.filter(file => !nodes.some(node => claims(node, file)))
    for (const file of unclaimed) error("no node accounts for file", file)

    for (const node of nodes)
        for (const pattern of node.sources ?? [])
            if (!files.some(file => file === pattern || matchesGlob(file, pattern)))
                warn("claimed path matches nothing", `${node.id} -> ${pattern}`)

    return {
        findings,
        trackedFileCount: claimable.length,
        claimedFileCount: claimable.length - unclaimed.length
    }
}

export type { CheckResult, Finding }
export { checkGraph, UNCLAIMED_BY_DESIGN }

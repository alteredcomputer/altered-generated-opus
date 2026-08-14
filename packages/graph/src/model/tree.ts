import type { FeatureNode, NodeId } from "./node.ts"

const STATUS_MARK = {
    planned: "○",
    "in-progress": "◐",
    done: "●"
} as const

/**
 * Renders the graph as an ordered, indented tree.
 *
 * @remarks
 * Ordering is authoring order rather than alphabetical, because smaller pieces compose into larger
 * ones and the reading order should follow that composition.
 */
const renderTree = (nodes: readonly FeatureNode[]): string => {
    const childrenOf = (parent: NodeId | undefined): readonly FeatureNode[] =>
        nodes.filter(node => node.parent === parent)

    const render = (node: FeatureNode, depth: number): readonly string[] => {
        const indent = "  ".repeat(depth)
        const todoCount = node.data?.todos?.length ?? 0
        const suffix = todoCount > 0 ? ` (${todoCount} todo${todoCount === 1 ? "" : "s"})` : ""

        return [
            `${indent}${STATUS_MARK[node.status]} ${node.title}${suffix}`,
            ...childrenOf(node.id).flatMap(child => render(child, depth + 1))
        ]
    }

    return childrenOf(undefined)
        .flatMap(root => render(root, 0))
        .join("\n")
}

export { renderTree, STATUS_MARK }

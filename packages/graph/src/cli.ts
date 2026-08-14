import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { checkGraph, type Finding } from "./model/check.ts"
import { renderTree } from "./model/tree.ts"
import { nodes } from "./nodes/index.ts"

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..")

const result = checkGraph(nodes, repoRoot)

const group = (findings: readonly Finding[]): readonly string[] => {
    const byLabel = new Map<string, string[]>()

    for (const finding of findings)
        byLabel.set(finding.label, [...(byLabel.get(finding.label) ?? []), finding.subject])

    return [...byLabel].map(
        ([label, subjects]) => `  ${label} (${subjects.length}): ${subjects.join(", ")}`
    )
}

const errors = result.findings.filter(finding => finding.kind === "error")
const warnings = result.findings.filter(finding => finding.kind === "warning")

const lines = [
    renderTree(nodes),
    "",
    `${nodes.length} nodes, ${result.claimedFileCount}/${result.trackedFileCount} files accounted for`
]

if (warnings.length > 0) lines.push("", "Outstanding:", ...group(warnings))
if (errors.length > 0) lines.push("", "Errors:", ...group(errors))

process.stdout.write(`${lines.join("\n")}\n`)
process.exit(errors.length > 0 ? 1 : 0)

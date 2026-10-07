import type { Dataset } from "../../../data/model.ts"

/**
 * The typed datasets field: names separated by commas. The token being typed is everything after
 * the last comma; suggestions are the datasets matching it that are not already listed.
 */
export const splitNames = (text: string) =>
    text
        .split(",")
        .map(name => name.trim())
        .filter(Boolean)

export const currentToken = (text: string) => (text.split(",").at(-1) ?? "").trim()

export const suggest = (text: string, datasets: Dataset[]) => {
    const token = currentToken(text).toLowerCase()
    if (!token) return []
    const listed = new Set(
        splitNames(text)
            .slice(0, -1)
            .map(name => name.toLowerCase())
    )
    return datasets.filter(
        d => d.alias.toLowerCase().includes(token) && !listed.has(d.alias.toLowerCase())
    )
}

/** Replaces the token being typed with the chosen name, ready for the next one. */
export const accept = (text: string, name: string) => {
    const head = text.includes(",") ? `${text.slice(0, text.lastIndexOf(",") + 1).trimEnd()} ` : ""
    return `${head}${name}, `
}

export const unknownNames = (text: string, datasets: Dataset[]) => {
    const known = new Set(datasets.map(d => d.alias.toLowerCase()))
    return splitNames(text).filter(name => !known.has(name.toLowerCase()))
}

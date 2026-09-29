import Foundation

/// A word-level comparison of two texts, for showing what a revision or proposal changes.
public struct DiffPart: Hashable, Sendable {
    public enum Kind: Sendable { case same, added, removed }

    public var kind: Kind
    public var text: String
}

public enum Diff {
    /// Splits into words and the whitespace between them, so joining the parts restores the text.
    static func tokens(_ text: String) -> [String] {
        var tokens: [String] = []
        var current = ""
        var inSpace: Bool?
        for character in text {
            let space = character.isWhitespace
            if let inSpace, inSpace != space {
                tokens.append(current)
                current = ""
            }
            current.append(character)
            inSpace = space
        }
        if !current.isEmpty { tokens.append(current) }
        return tokens
    }

    /// Longest-common-subsequence diff over tokens; adjacent parts of one kind are merged.
    public static func words(from old: String, to new: String) -> [DiffPart] {
        let a = tokens(old)
        let b = tokens(new)
        let n = a.count
        let m = b.count

        var lengths = Array(repeating: Array(repeating: 0, count: m + 1), count: n + 1)
        if n > 0, m > 0 {
            for i in stride(from: n - 1, through: 0, by: -1) {
                for j in stride(from: m - 1, through: 0, by: -1) {
                    lengths[i][j] = a[i] == b[j] ? lengths[i + 1][j + 1] + 1 : max(lengths[i + 1][j], lengths[i][j + 1])
                }
            }
        }

        var parts: [DiffPart] = []
        func push(_ kind: DiffPart.Kind, _ text: String) {
            if let last = parts.last, last.kind == kind {
                parts[parts.count - 1].text += text
            } else {
                parts.append(DiffPart(kind: kind, text: text))
            }
        }

        var i = 0
        var j = 0
        while i < n, j < m {
            if a[i] == b[j] {
                push(.same, a[i])
                i += 1
                j += 1
            } else if lengths[i + 1][j] >= lengths[i][j + 1] {
                push(.removed, a[i])
                i += 1
            } else {
                push(.added, b[j])
                j += 1
            }
        }
        while i < n { push(.removed, a[i]); i += 1 }
        while j < m { push(.added, b[j]); j += 1 }
        return parts
    }
}

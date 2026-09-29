import Foundation

public enum FieldType: String, Codable, CaseIterable, Sendable {
    case text, number, date, choice, toggle, link

    public var hint: String {
        switch self {
        case .text: "any text"
        case .number: "a number, like 12 or 3.5"
        case .date: "a date, YYYY-MM-DD"
        case .choice: "one of the options"
        case .toggle: "yes or no"
        case .link: "a web address"
        }
    }
}

/// One column of a dataset's schema. Required unless the owner opts out: default closed.
public struct Field: Codable, Hashable, Identifiable, Sendable {
    public var id: ID
    public var name: String
    public var type: FieldType
    public var required: Bool
    /// Allowed values for a choice field, in display order.
    public var options: [String]
    public var description: String

    public init(
        id: ID, name: String, type: FieldType, required: Bool = true, options: [String] = [],
        description: String = ""
    ) {
        self.id = id
        self.name = name
        self.type = type
        self.required = required
        self.options = options
        self.description = description
    }

    /// Why a raw value is not acceptable for this field, or nil when it is.
    /// An empty value is judged by `required`, not here.
    public func problem(with raw: String) -> String? {
        let value = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        if value.isEmpty { return nil }

        switch type {
        case .text:
            return nil
        case .number:
            return Double(value) == nil ? "must be \(type.hint)" : nil
        case .date:
            return Self.parseDate(value) == nil ? "must be \(type.hint)" : nil
        case .choice:
            return options.contains(value) ? nil : "must be one of: \(options.joined(separator: ", "))"
        case .toggle:
            return value == "yes" || value == "no" ? nil : "must be yes or no"
        case .link:
            guard let url = URL(string: value), let scheme = url.scheme?.lowercased(),
                  scheme == "http" || scheme == "https", url.host != nil
            else { return "must be \(type.hint), starting with https://" }
            return nil
        }
    }

    /// Strict YYYY-MM-DD in UTC; rejects dates that do not exist, like 2026-02-30.
    public static func parseDate(_ value: String) -> Date? {
        let parts = value.split(separator: "-", omittingEmptySubsequences: false)
        guard parts.count == 3, parts[0].count == 4, parts[1].count == 2, parts[2].count == 2,
              let year = Int(parts[0]), let month = Int(parts[1]), let day = Int(parts[2])
        else { return nil }

        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "UTC")!
        let components = DateComponents(year: year, month: month, day: day)
        guard let date = calendar.date(from: components),
              calendar.component(.month, from: date) == month,
              calendar.component(.day, from: date) == day
        else { return nil }
        return date
    }
}

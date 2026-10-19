import Foundation

/// How a thought list is ordered. The row shows the date the list is sorted by.
enum ThoughtSort: String, CaseIterable, Identifiable {
    case modified, created, added, title

    var id: Self { self }

    var label: String {
        switch self {
        case .modified: "Date Modified"
        case .created: "Date Created"
        case .added: "Date Added"
        case .title: "Title"
        }
    }

    /// Newest first for dates, A to Z for titles; creation breaks ties so the order is stable.
    var descriptors: [SortDescriptor<Thought>] {
        switch self {
        case .modified:
            [SortDescriptor(\Thought.updatedAt, order: .reverse), SortDescriptor(\Thought.createdAt, order: .reverse)]
        case .created:
            [SortDescriptor(\Thought.createdAt, order: .reverse)]
        case .added:
            [SortDescriptor(\Thought.addedAt, order: .reverse), SortDescriptor(\Thought.createdAt, order: .reverse)]
        case .title:
            [SortDescriptor(\Thought.title), SortDescriptor(\Thought.createdAt, order: .reverse)]
        }
    }

    func date(of thought: Thought) -> Date {
        switch self {
        case .modified, .title: thought.updatedAt
        case .created: thought.createdAt
        case .added: thought.addedAt
        }
    }
}

/// Notes-style row dates: a time today, a weekday this week, otherwise a short date.
enum RowDate {
    static func string(_ date: Date, now: Date = .now, calendar: Calendar = .current) -> String {
        if calendar.isDate(date, inSameDayAs: now) {
            return date.formatted(date: .omitted, time: .shortened)
        }
        if let yesterday = calendar.date(byAdding: .day, value: -1, to: now),
           calendar.isDate(date, inSameDayAs: yesterday) {
            return "Yesterday"
        }
        if let days = calendar.dateComponents([.day], from: date, to: now).day, days < 7, days >= 0 {
            return date.formatted(.dateTime.weekday(.wide))
        }
        return date.formatted(date: .numeric, time: .omitted)
    }
}

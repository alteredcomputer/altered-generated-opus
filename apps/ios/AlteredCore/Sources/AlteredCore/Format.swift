import Foundation

/// Dates as the editor prints them. Formatters are built per call; the lists are short.
public enum Format {
    /// "Sep 6, 2026, 01:26 AM", as on the desktop editor.
    public static func stamp(_ date: Date, timeZone: TimeZone = .current) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = timeZone
        formatter.dateFormat = "MMM d, yyyy, hh:mm a"
        return formatter.string(from: date)
    }

    /// "now", "12m", "5h", "3d", "7w", then a plain date.
    public static func age(_ date: Date, now: Date) -> String {
        let seconds = max(0, now.timeIntervalSince(date))
        switch seconds {
        case ..<60: return "now"
        case ..<3600: return "\(Int(seconds / 60))m"
        case ..<86400: return "\(Int(seconds / 3600))h"
        case ..<(86400 * 7): return "\(Int(seconds / 86400))d"
        case ..<(86400 * 7 * 52): return "\(Int(seconds / (86400 * 7)))w"
        default:
            let formatter = DateFormatter()
            formatter.locale = Locale(identifier: "en_US_POSIX")
            formatter.dateFormat = "yyyy-MM-dd"
            return formatter.string(from: date)
        }
    }
}

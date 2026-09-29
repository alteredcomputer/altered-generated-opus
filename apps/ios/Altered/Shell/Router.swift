import AlteredCore
import SwiftUI

enum Tab: String, CaseIterable, Identifiable {
    case thoughts, sets, views, review, sys

    var id: String { rawValue }

    var label: String {
        switch self {
        case .thoughts: "Thoughts"
        case .sets: "Sets"
        case .views: "Views"
        case .review: "Review"
        case .sys: "Sys"
        }
    }
}

/// Every screen that can be pushed. Plain values, so a path can be saved, restored, or sent.
enum Route: Hashable {
    /// A thought, plus the list it was opened from so a sideways swipe can step through it.
    case thought(ID, context: [ID])
    /// The composer. A nil id makes a new thought; `datasetId` pre-tags it.
    case compose(ID?, datasetId: ID? = nil)
    /// The attribute form, holding the edit that is waiting on its values.
    case values(ID?, edit: ThoughtEdit)
    case history(ID)
    case revision(ID, version: Int)
    case proposal(ID)
    case link(ID)
    case dataset(ID)
    case datasetForm(ID?)
    case fieldForm(datasetId: ID, fieldId: ID?)
    case view(ID)
    case viewForm(ID?, query: String)
    case definition(ID)
    case outbox
    case log
}

/// One navigation stack per tab, each kept alive while another tab is showing.
@MainActor
@Observable
final class Router {
    var tab: Tab = .thoughts
    var paths: [Tab: [Route]] = [:]
    var instant = true

    var depth: Int { paths[tab]?.count ?? 0 }

    func path(_ tab: Tab) -> Binding<[Route]> {
        Binding(
            get: { self.paths[tab] ?? [] },
            set: { next in self.change { self.paths[tab] = next } }
        )
    }

    func push(_ route: Route) {
        change { paths[tab, default: []].append(route) }
    }

    func replaceTop(with route: Route) {
        change {
            if paths[tab]?.isEmpty == false { paths[tab]?.removeLast() }
            paths[tab, default: []].append(route)
        }
    }

    func pop(_ count: Int = 1) {
        change {
            let current = paths[tab] ?? []
            paths[tab] = Array(current.dropLast(min(count, current.count)))
        }
    }

    /// Tapping the current tab again returns to its root, as in every iOS app.
    func select(_ next: Tab) {
        if next == tab {
            change { paths[tab] = [] }
        } else {
            tab = next
        }
    }

    func open(_ route: Route, in tab: Tab) {
        self.tab = tab
        change { paths[tab] = [route] }
    }

    private func change(_ body: () -> Void) {
        if instant {
            var transaction = Transaction()
            transaction.disablesAnimations = true
            withTransaction(transaction, body)
        } else {
            body()
        }
    }
}

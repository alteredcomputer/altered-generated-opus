import type { ReactNode } from "react"
import { matches } from "../data/search.ts"
import { useStore } from "../data/store.tsx"
import type { Action } from "../shell/action.ts"
import { Frame } from "../shell/frame.tsx"
import { useNavigation, useViewState } from "../shell/navigation.tsx"
import { isString, type Route } from "../shell/restore.ts"
import { List } from "../ui/list.tsx"
import { useListCursor } from "../ui/use-list-cursor.ts"
import { DatasetsList } from "./datasets/list.tsx"
import { resetDemoAction } from "./reset-demo.ts"
import { route } from "./route.ts"
import { ThoughtForm } from "./thoughts/form.tsx"
import { ThoughtsList } from "./thoughts/list.tsx"

type Command = {
    id: string
    title: string
    description: string
    view: () => ReactNode
    route: Route
}

const commands: Command[] = [
    {
        id: "view-thoughts",
        title: "View Thoughts",
        description: "View and manage the thoughts in your ALTERED Brain.",
        view: () => <ThoughtsList />,
        route: route.thoughts(null)
    },
    {
        id: "capture-thought",
        title: "Capture Thought",
        description: "Capture a thought to your ALTERED Brain.",
        view: () => <ThoughtForm />,
        route: route.thoughtForm(null)
    },
    {
        id: "manage-datasets",
        title: "Manage Datasets",
        description: "Group thoughts into datasets and define their schemas.",
        view: () => <DatasetsList />,
        route: route.datasets()
    }
]

export function Root() {
    const { push } = useNavigation()
    const { thoughts } = useStore()
    const [query, setQuery] = useViewState("query", "", isString)

    const visible = commands.filter(command => matches(query, command.title, command.description))
    const list = useListCursor(visible.map(command => command.id))
    const open = (id: string | null) => {
        const command = commands.find(c => c.id === id)
        if (command) push(command.view(), command.route)
    }

    const actions: Action[] = [
        {
            id: "open",
            title: "Open Command",
            section: "Command",
            shortcut: { key: "enter" },
            run: () => open(list.cursor)
        },
        resetDemoAction
    ]

    return (
        <Frame
            title="ALTERED"
            count={{ total: visible.length }}
            status={`${thoughts.length} thoughts - generated prototype`}
            search={{ value: query, onChange: setQuery, placeholder: "Search commands..." }}
            actions={actions}
            onKey={list.handleKey}
            onEscape={() => {
                if (!query) return false
                setQuery("")
                return true
            }}
        >
            <List
                items={visible}
                getId={command => command.id}
                empty="No matching commands."
                cursor={list.cursor}
                selected={[]}
                onClick={id => list.setCursor(id)}
                onActivate={open}
                renderRow={command => (
                    <>
                        <span className="row-title" data-named>
                            {command.title}
                        </span>
                        <span className="row-subtitle">{command.description}</span>
                    </>
                )}
            />
        </Frame>
    )
}

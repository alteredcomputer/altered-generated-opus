import { StoreProvider } from "./data/store.tsx"
import { ConfirmHost } from "./shell/confirm.tsx"
import { NavigationStack } from "./shell/navigation.tsx"
import { Root } from "./views/root.tsx"
import { ThoughtsList } from "./views/thoughts/list.tsx"

/** Opens straight into the thoughts list; Escape goes back to the command root. */
export function App() {
    return (
        <StoreProvider>
            <NavigationStack initial={[<Root key="root" />, <ThoughtsList key="thoughts" />]} />
            <ConfirmHost />
        </StoreProvider>
    )
}

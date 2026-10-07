import { StoreProvider } from "./data/store.tsx"
import { ConfirmHost } from "./shell/confirm.tsx"
import { RestoredStack } from "./views/restore.tsx"

export function App() {
    return (
        <StoreProvider>
            <RestoredStack />
            <ConfirmHost />
        </StoreProvider>
    )
}

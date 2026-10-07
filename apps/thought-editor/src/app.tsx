import { StoreProvider } from "./data/store.tsx"
import { ConfirmHost } from "./shell/confirm.tsx"
import { BlockCaret } from "./ui/caret.tsx"
import { RestoredStack } from "./views/restore.tsx"

export function App() {
    return (
        <StoreProvider>
            <RestoredStack />
            <ConfirmHost />
            <BlockCaret />
        </StoreProvider>
    )
}

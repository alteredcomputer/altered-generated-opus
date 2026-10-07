import { StoreProvider } from "../data/store.tsx"
import { UiProvider } from "./config/provider.tsx"
import { ConfirmHost } from "./shell/confirm.tsx"
import { KeyRouter } from "./shell/keyboard.ts"
import { Navigator } from "./shell/navigation.tsx"
import { ThoughtsList } from "./views/thoughts/list.tsx"

/** Opens straight into the thoughts list, on the classic editor's IndexedDB store (D176). */
export function GridApp() {
    return (
        <UiProvider>
            <StoreProvider>
                <KeyRouter />
                <Navigator root={<ThoughtsList />} />
                <ConfirmHost />
            </StoreProvider>
        </UiProvider>
    )
}

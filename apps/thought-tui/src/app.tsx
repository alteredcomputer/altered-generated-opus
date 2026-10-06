import { StoreProvider } from "./data/store.tsx"
import { ConfirmHost } from "./shell/confirm.tsx"
import { KeyRouter } from "./shell/keyboard.ts"
import { Navigator } from "./shell/navigation.tsx"
import { color } from "./ui/theme.ts"
import { ThoughtsList } from "./views/thoughts/list.tsx"

export function App() {
    return (
        <StoreProvider>
            <KeyRouter />
            <box flexGrow={1} backgroundColor={color.bg}>
                <Navigator root={<ThoughtsList />} />
                <ConfirmHost />
            </box>
        </StoreProvider>
    )
}

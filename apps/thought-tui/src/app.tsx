import { UiProvider, useUi } from "./config/provider.tsx"
import type { Config } from "./config/schema.ts"
import { StoreProvider } from "./data/store.tsx"
import { ConfirmHost } from "./shell/confirm.tsx"
import { KeyRouter } from "./shell/keyboard.ts"
import { Navigator } from "./shell/navigation.tsx"
import { ThoughtsList } from "./views/thoughts/list.tsx"

export function App({ config }: { config: Config }) {
    return (
        <UiProvider initial={config}>
            <StoreProvider>
                <KeyRouter />
                <Ground />
            </StoreProvider>
        </UiProvider>
    )
}

function Ground() {
    const { colors } = useUi()
    return (
        <box flexGrow={1} backgroundColor={colors.bg}>
            <Navigator root={<ThoughtsList />} />
            <ConfirmHost />
        </box>
    )
}

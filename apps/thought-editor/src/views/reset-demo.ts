import { resetDemoData } from "../data/writes.ts"
import type { Action } from "../shell/action.ts"
import { confirm } from "../shell/confirm.tsx"
import { runWrite } from "../shell/feedback.ts"

const resetDemo = async () => {
    const confirmed = await confirm({
        title: "Reset demo data",
        message: "Every thought and dataset in this browser is replaced with the demo set.",
        confirmLabel: "Reset"
    })
    if (confirmed) await runWrite(resetDemoData(), "Demo data restored")
}

export const resetDemoAction: Action = {
    id: "reset-demo",
    title: "Reset Demo Data",
    section: "Prototype",
    destructive: true,
    run: resetDemo
}

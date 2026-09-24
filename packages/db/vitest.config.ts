import { defineConfig } from "vitest/config"

/**
 * Database tests boot a real in-process Postgres and apply the committed migrations, which takes
 * several seconds on a CI runner. The default five-second budget made the suite flaky there.
 */
export default defineConfig({
    test: { testTimeout: 30_000, hookTimeout: 30_000 }
})

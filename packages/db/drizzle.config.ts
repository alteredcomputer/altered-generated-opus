import { defineConfig } from "drizzle-kit"

//  Generation only. Migrations are applied by `pnpm db migrate`, which reads the connection string
//  through the typed config so an absent value fails loudly instead of reaching drizzle-kit blank.
export default defineConfig({
    dialect: "postgresql",
    schema: "./src/schema.ts",
    out: "./drizzle"
})

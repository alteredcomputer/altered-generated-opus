import type { NextConfig } from "next"

const nextConfig: NextConfig = {
    //  Workspace packages ship as TypeScript source and are compiled by the app that consumes them.
    transpilePackages: ["@opus/core"],

    typedRoutes: true,

    //  Next writes its own AGENTS.md and CLAUDE.md into the app directory. A nested instruction
    //  file would sit below the operating contract at the repo root and dilute it, which is exactly
    //  the failure that made agents ignore their workflow rules in the previous project.
    agentRules: false,

    //  A build that type-checks loosely is a build that ships broken code. This stays on.
    typescript: { ignoreBuildErrors: false }
}

export default nextConfig

import type { NextConfig } from "next"

const nextConfig: NextConfig = {
    //  Workspace packages ship as TypeScript source and are compiled by the app that consumes them.
    transpilePackages: ["@opus/core"],

    typedRoutes: true,

    //  A build that type-checks loosely is a build that ships broken code. This stays on.
    typescript: { ignoreBuildErrors: false }
}

export default nextConfig

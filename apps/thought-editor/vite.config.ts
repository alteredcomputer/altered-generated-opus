/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

/**
 * @remarks
 * The service worker precaches the whole build, so after the first visit the app opens from disk
 * with no network round trip. `autoUpdate` swaps in a new deploy on the next launch.
 */
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: "autoUpdate",
            //  Vercel deployment protection gates the site; without credentials the browser
            //  fetches the manifest anonymously, gets the login wall, and offers no install.
            useCredentials: true,
            includeAssets: ["icon.svg"],
            manifest: {
                name: "ALTERED",
                short_name: "ALTERED",
                description: "A generated prototype of a keyboard-first thought editor.",
                display: "standalone",
                start_url: "/",
                background_color: "#101010",
                theme_color: "#101010",
                icons: [
                    { src: "icon-192.png", sizes: "192x192", type: "image/png" },
                    { src: "icon-512.png", sizes: "512x512", type: "image/png" },
                    {
                        src: "icon-512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "maskable"
                    }
                ]
            },
            workbox: { globPatterns: ["**/*.{js,css,html,svg,png,woff2}"] }
        })
    ],
    test: { include: ["src/**/*.test.ts"] }
})

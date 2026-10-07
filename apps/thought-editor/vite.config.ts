/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"
import { VitePWA } from "vite-plugin-pwa"

/**
 * `/grid` serves grid.html in dev and preview, as `cleanUrls` in vercel.json does on Vercel, and
 * as the service worker's precache does offline (Workbox tries `/grid.html` for `/grid`).
 */
const gridRoute = (): Plugin => {
    const rewrite = (url: string | undefined) =>
        url === "/grid" || url?.startsWith("/grid?") ? url.replace("/grid", "/grid.html") : url
    return {
        name: "grid-route",
        configureServer: server => {
            server.middlewares.use((req, _res, next) => {
                req.url = rewrite(req.url)
                next()
            })
        },
        configurePreviewServer: server => {
            server.middlewares.use((req, _res, next) => {
                req.url = rewrite(req.url)
                next()
            })
        }
    }
}

/**
 * @remarks
 * The service worker precaches the whole build, so after the first visit the app opens from disk
 * with no network round trip. `autoUpdate` swaps in a new deploy on the next launch.
 */
export default defineConfig({
    plugins: [
        gridRoute(),
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
    //  Two pages, one deploy and one service worker: the classic editor at / and the grid at
    //  /grid (D176).
    build: {
        rolldownOptions: {
            input: {
                main: "index.html",
                grid: "grid.html"
            }
        }
    },
    //  Maps styles inspected in devtools back to their source file and line.
    css: { devSourcemap: true },
    test: { include: ["src/**/*.test.ts"] }
})

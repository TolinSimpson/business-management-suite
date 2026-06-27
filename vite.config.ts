import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { VitePWA } from "vite-plugin-pwa";

// Minimal config. `base: "./"` keeps asset paths relative so the build works
// when served from any path and as an installed PWA.
export default defineConfig({
  base: "./",
  plugins: [
    svelte(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["icon.svg"],
      // Let the SW work on the dev server so installability can be tested.
      devOptions: { enabled: true },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,webmanifest}"],
        // config.json is the shared company directory — always try the network
        // first so published edits propagate, falling back to cache offline.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.endsWith("config.json"),
            handler: "NetworkFirst",
            options: {
              cacheName: "org-config",
              expiration: { maxEntries: 1 },
            },
          },
        ],
      },
      manifest: {
        name: "Schedule",
        short_name: "Schedule",
        description: "Your daily routine, on the hour.",
        start_url: "./",
        scope: "./",
        display: "standalone",
        orientation: "portrait",
        background_color: "#0f1115",
        theme_color: "#0f1115",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
  server: { host: true, port: 5173 },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});

import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { VitePWA } from "vite-plugin-pwa";

// Minimal config. `base: "./"` keeps asset paths relative so the same build
// works both as an installed PWA and inside the Capacitor Android shell.
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

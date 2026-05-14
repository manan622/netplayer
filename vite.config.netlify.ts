// Standalone Vite config for static SPA builds (e.g. Netlify).
// Bypasses @lovable.dev/vite-tanstack-config so we don't pull in the
// Cloudflare worker plugin, then enables TanStack Start's native SPA mode
// to produce a true prerendered index.html that can hydrate correctly.
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    tanstackStart({
      spa: {
        enabled: true,
        prerender: { crawlLinks: false },
      },
      prerender: { failOnError: false },
    }),
    viteReact(),
  ],
  build: {
    outDir: "dist-spa",
  },
});

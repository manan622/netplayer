// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
    // SPA mode generates a static index.html shell so the app can be hosted
    // on plain static hosts (e.g. Netlify) in addition to Cloudflare/Lovable.
    spa: {
      enabled: true,
      prerender: { crawlLinks: false },
    },
    prerender: { failOnError: false },
  },
});

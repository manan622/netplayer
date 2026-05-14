#!/usr/bin/env node
// Post-build: generate a static SPA shell at dist/client/index.html so the
// app can be deployed to plain static hosts (e.g. Netlify) in addition to
// the Cloudflare Worker output Lovable uses.
//
// The TMDB-powered Netflix UI is fully client-side (no server functions),
// so a SPA shell hydrating the existing client bundle is sufficient.

import { existsSync, readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";

const CLIENT_DIR = "dist/client";
const ASSETS_DIR = join(CLIENT_DIR, "assets");

if (!existsSync(ASSETS_DIR)) {
  console.error("[spa-shell] dist/client/assets not found — did `vite build` run?");
  process.exit(0);
}

const files = readdirSync(ASSETS_DIR);

// The main client entry is the largest index-*.js chunk (it bundles the
// router + root route). Pick by file size to stay resilient to hash changes.
const indexJs = files
  .filter((f) => /^index-.*\.js$/.test(f))
  .map((f) => ({ f, size: statSync(join(ASSETS_DIR, f)).size }))
  .sort((a, b) => b.size - a.size)[0]?.f;

const cssFile = files.find((f) => /^styles-.*\.css$/.test(f));

if (!indexJs) {
  console.error("[spa-shell] could not locate client entry chunk");
  process.exit(1);
}

// Pull manifest meta from src/routes/__root.tsx (already mirrored in the SSR
// build); a minimal shell is enough for hydration.
const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Netplay</title>
    <meta name="description" content="Stream movies and TV shows." />
    <meta name="theme-color" content="#000000" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="icon" type="image/png" href="/icon-512.png" />
    <link rel="apple-touch-icon" href="/icon-512.png" />
    ${cssFile ? `<link rel="stylesheet" href="/assets/${cssFile}" />` : ""}
    <link rel="modulepreload" href="/assets/${indexJs}" />
  </head>
  <body>
    <script type="module" src="/assets/${indexJs}"></script>
  </body>
</html>
`;

writeFileSync(join(CLIENT_DIR, "index.html"), html);
writeFileSync(join(CLIENT_DIR, "_redirects"), "/*    /index.html   200\n");

console.log(`[spa-shell] wrote dist/client/index.html (entry: ${indexJs})`);

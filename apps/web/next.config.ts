import type { NextConfig } from "next"

import { CALCULATORS, calculatorPath } from "./lib/calculators"

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui", "@workspace/core", "@workspace/db"],
  // PGlite ships Postgres as WASM. Bundling it breaks resolution of the .wasm
  // and .data assets, so it stays external and is required at run time. It is
  // only ever loaded during the build — the deployed output has no database.
  serverExternalPackages: ["@electric-sql/pglite"],

  async redirects() {
    return [
      // `/calculation?amount=…` rendered the homepage verbatim. Sixteen of
      // those URLs are the exact set Google reported as duplicates of `/`.
      { source: "/calculation", destination: "/", permanent: true },
      // `/calculator` was mine, not Rails'. It duplicated `/`, so it is gone.
      { source: "/calculator", destination: "/", permanent: true },

      /*
       * The seven verticals moved from the root into `/calculators/*`.
       *
       * These are 301s on URLs that currently rank, which resets them — a cost
       * accepted deliberately in exchange for the section having one shape.
       * Generated from the same array the pages are, so a new calculator
       * cannot ship without its redirect, and a renamed slug cannot silently
       * orphan the old path.
       */
      ...CALCULATORS.map((c) => ({
        source: c.legacyPath,
        destination: calculatorPath(c.slug),
        permanent: true,
      })),
    ]
    // www → apex is deliberately not here: it belongs to the domain
    // configuration, and doing it in a proxy would put an edge function in
    // front of an otherwise entirely static site.
  },
}

export default nextConfig

import type { NextConfig } from "next"

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
      { source: "/calculation", destination: "/calculator", permanent: true },
    ]
    // www → apex is deliberately not here: it belongs to the domain
    // configuration, and doing it in a proxy would put an edge function in
    // front of an otherwise entirely static site.
  },
}

export default nextConfig

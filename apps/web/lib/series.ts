/**
 * Series identity — colour per item.
 *
 * Deliberately free of any database import so client components can use it.
 * `lib/data.ts` pulls in `@workspace/db`, which reaches for `node:url` and
 * PGlite's WASM; importing that from a "use client" module drags Postgres into
 * the browser bundle.
 *
 * The order below is the chart-colour order, so an item is the same colour on
 * every surface it appears on — the home-page legend, the nav dropdown, and
 * the swatch on `/costs/eggs/1998` all agree.
 */
export const SERIES_COLOR: Record<string, string> = {
  gas: "var(--chart-1)",
  eggs: "var(--chart-2)",
  bread: "var(--chart-3)",
  milk: "var(--chart-4)",
  "ground-beef": "var(--chart-5)",
}

export const colorFor = (slug: string, index = 0) =>
  SERIES_COLOR[slug] ?? `var(--chart-${(index % 5) + 1})`

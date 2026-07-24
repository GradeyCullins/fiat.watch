import { cache } from "react"

import { CALCULATORS, calculatorPath, GENERAL_CALCULATOR } from "./calculators"
import { getItems } from "./data"

export type SearchKind = "cost" | "calculator"

export interface SearchEntry {
  /** Which tab this row belongs to. */
  kind: SearchKind
  /** Group heading in the palette. */
  group: string
  label: string
  href: string
  /** Extra terms cmdk should match on but not display. */
  keywords?: string
  /** Item slug, when the row should carry that item's glyph. */
  slug?: string
  /** A literal glyph, for rows that are not an item (the calculators). */
  emoji?: string
  hint?: string
}

/**
 * The palette index, assembled at build time and serialised into every page.
 *
 * It holds one row per item and one per calculator — about 170. It used to
 * also hold one row per item-year, which was ~240 rows at five items and
 * 4,236 at 160: the search index alone was pushing the home page to 5.5 MB,
 * on every route, because the header renders on every route.
 *
 * Year rows are now synthesised in the client from the typed query (see
 * `site-search.tsx`). "eggs 1998" produces the same result without shipping
 * the other 4,235 combinations, and it works for years no row would have
 * covered.
 */
/**
 * What people actually search for, in front. The catalogue's own order is by
 * BLS category, which opened the empty-state list on flour and pasta.
 */
const POPULAR = [
  "gas", "eggs", "bread", "milk", "ground-beef", "ground-coffee", "bacon",
  "bananas", "boneless-chicken-breast", "butter", "electricity", "sugar",
  "cheddar-cheese", "potatoes", "rice", "tomatoes", "oranges", "apples",
]

export const buildSearchIndex = cache(async (): Promise<SearchEntry[]> => {
  const all = await getItems()
  const rank = new Map(POPULAR.map((slug, i) => [slug, i]))
  const items = [...all].sort(
    (a, b) => (rank.get(a.slug) ?? POPULAR.length) - (rank.get(b.slug) ?? POPULAR.length),
  )

  return [
    {
      kind: "calculator",
      group: "Tools",
      label: GENERAL_CALCULATOR.label,
      emoji: GENERAL_CALCULATOR.emoji,
      href: GENERAL_CALCULATOR.path,
      keywords: "cpi convert dollars purchasing power compare chart home",
      hint: "Home",
    },
    // Just the name. The row used to read "Historical gas prices", which is
    // the page's title, not the thing you are looking for — and with 160 of
    // them the list became a column of the word "Historical". The full
    // catalogue name stays in `keywords` so "grade A" still finds eggs.
    ...items.map((i) => ({
      kind: "cost" as const,
      group: "Prices",
      label: i.labelAttributive,
      href: `/costs/${i.slug}`,
      keywords: `${i.slug} ${i.label} ${i.unit}`,
      slug: i.slug,
      hint: `${i.firstYear}–${i.lastYear}`,
    })),
    ...CALCULATORS.map((c) => ({
      kind: "calculator" as const,
      group: "Calculators",
      label: c.heading,
      emoji: c.emoji,
      href: calculatorPath(c.slug),
      keywords: c.slug.replace(/-/g, " "),
    })),
  ]
})

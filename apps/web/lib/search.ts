import { cache } from "react"

import { CALCULATORS } from "./calculators"
import { getAnnual, getItems } from "./data"

export interface SearchEntry {
  /** Group heading in the palette. */
  group: string
  label: string
  href: string
  /** Extra terms cmdk should match on but not display. */
  keywords?: string
  /** Item slug, when the row should carry that item's glyph and colour. */
  slug?: string
  hint?: string
}

/**
 * The palette index, assembled at build time and serialised into the page.
 *
 * Item-year pages are included (~220 rows) but month pages are not — 2,594
 * rows would dominate the payload for a page nobody searches by name. The
 * palette instead offers a "jump to" row when the query parses as a year.
 */
export const buildSearchIndex = cache(async (): Promise<SearchEntry[]> => {
  const items = await getItems()

  const entries: SearchEntry[] = [
    {
      group: "Tools",
      label: "Inflation calculator",
      href: "/",
      keywords: "cpi convert dollars purchasing power compare chart home",
      hint: "Home",
    },
    ...CALCULATORS.map((c) => ({
      group: "Calculators",
      label: c.heading,
      href: c.path,
      keywords: c.slug.replace(/-/g, " "),
    })),
    ...items.map((i) => ({
      group: "Prices",
      label: `Historical ${i.labelAttributive} prices`,
      href: `/costs/${i.slug}`,
      keywords: `${i.slug} ${i.label} ${i.unit}`,
      slug: i.slug,
      hint: `${i.firstYear}–${i.lastYear}`,
    })),
  ]

  for (const item of items) {
    const rows = await getAnnual(item.slug)
    for (const row of rows) {
      entries.push({
        group: `${item.label} by year`,
        label: `${item.label} in ${row.year}`,
        href: `/costs/${item.slug}/${row.year}`,
        keywords: `${item.slug} ${row.year}`,
        slug: item.slug,
      })
    }
  }

  return entries
})

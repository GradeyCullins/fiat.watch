import { cache } from "react"

import { CpiTable } from "@workspace/core"
import {
  allCpi,
  allPriceKeys,
  annualPrices,
  listItems,
  monthlyPrices,
  monthlySeries,
  type AnnualPrice,
  type ItemSummary,
} from "@workspace/db"

import emojiMap from "./item-emoji.json"
import { assertSlugsExist } from "./coverage"

/**
 * Everything here runs at build time only — `next build` prerenders every
 * route, so the deployed artifact never opens a database. React's `cache`
 * keeps one read per render pass rather than one per page component.
 */

/*
 * Every item must have a glyph, asserted here rather than discovered later.
 *
 * Two potato slugs had drifted out of the map during the catalogue naming
 * pass — `white-potatoes-per-lb` was renamed to `potatoes` — and nothing
 * noticed, because `emojiFor` falls back to a receipt. The marquee shipped
 * "White potato 🧾" for weeks. This is the same class of silent rename that
 * has already changed slugs and labels twice, so it fails the build now.
 */
export const getItems = cache(async (areaSlug?: string) => {
  const items = await listItems(areaSlug)
  assertSlugsExist("emoji map", Object.keys(emojiMap), new Set(items.map((i) => i.slug)))
  const missing = items.filter((i) => !(i.slug in emojiMap)).map((i) => i.slug)
  if (missing.length) {
    throw new Error(`No emoji for ${missing.length} item(s): ${missing.join(", ")}`)
  }
  return items
})

export const getCpiTable = cache(async () => new CpiTable(await allCpi()))

export const getAnnual = cache(annualPrices)

export const getMonthly = cache(monthlyPrices)

export const getPriceKeys = cache(allPriceKeys)

export const getMonthlySeries = cache(monthlySeries)

export const getItem = cache(async (slug: string) => {
  const found = (await getItems()).find((i) => i.slug === slug)
  return found ?? null
})

/** Every year that has both a price and a CPI reading, newest first. */
export const getYearOptions = cache(async () => {
  const table = await getCpiTable()
  return [...table.years].reverse()
})

export type { AnnualPrice, ItemSummary }

/** Rows shaped for a Recharts line chart: one object per year, one key per item. */
export function toChartRows(
  perItem: { slug: string; rows: AnnualPrice[] }[],
): Record<string, number | null>[] {
  const years = new Set<number>()
  for (const { rows } of perItem) for (const r of rows) years.add(r.year)

  const lookup = new Map(
    perItem.map(({ slug, rows }) => [slug, new Map(rows.map((r) => [r.year, r.value]))]),
  )

  return [...years]
    .sort((a, b) => a - b)
    .map((year) => {
      const row: Record<string, number | null> = { year }
      for (const { slug } of perItem) row[slug] = lookup.get(slug)?.get(year) ?? null
      return row
    })
}

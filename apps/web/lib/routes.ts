import { hasMonthTier } from "@/lib/coverage"
import { getAnnual, getItems, getPriceKeys } from "@/lib/data"

/**
 * The URL sets, declared once.
 *
 * Every `/costs/**` URL on this site is enumerated here and nowhere else, and
 * both consumers — `generateStaticParams` on the pages and their OG cards, and
 * `sitemap.ts` — read these functions rather than the data directly.
 *
 * That is not tidiness. The two used to derive the same URLs independently:
 * the month page filtered by `hasMonthTier` (month pages exist for the five
 * items that rank on `master`, and nothing else, so the other 155 items do not
 * each contribute ~550 near-identical pages), while the sitemap walked raw
 * `getPriceKeys()` and knew nothing about that rule. The sitemap advertised
 * 44,015 month URLs; the build produced 2,599. The other 41,416 were 404s
 * handed to Googlebot on a site whose whole point is search.
 *
 * A policy that lives in one of two enumerators is a policy that will drift
 * again. It now lives in one, and the sitemap cannot advertise a URL that
 * `generateStaticParams` will not build.
 */

export type ItemParams = { item: string }
export type YearParams = { item: string; year: string }
export type MonthParams = { item: string; year: string; month: string }

const pad = (month: number) => String(month).padStart(2, "0")

/** One page per item. */
export async function itemParams(): Promise<ItemParams[]> {
  return (await getItems()).map((item) => ({ item: item.slug }))
}

/** One page per item-year. Every item gets these — 12 readings is real content. */
export async function yearParams(): Promise<YearParams[]> {
  const items = await getItems()
  const out: YearParams[] = []
  for (const item of items) {
    for (const row of await getAnnual(item.slug)) {
      out.push({ item: item.slug, year: String(row.year) })
    }
  }
  return out
}

/**
 * One page per item-month, for the month-tier items only.
 *
 * Exactly the readings that exist: October 2025 was never collected, so it
 * never becomes a URL rather than becoming one that renders an empty page.
 */
export async function monthParams(): Promise<MonthParams[]> {
  const keys = await getPriceKeys()
  return keys
    .filter((key) => hasMonthTier(key.slug))
    .map((key) => ({ item: key.slug, year: String(key.year), month: pad(key.month) }))
}

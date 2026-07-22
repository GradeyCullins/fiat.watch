/**
 * Which items get a month tier.
 *
 * BLS publishes 354,836 monthly readings. Giving each one a page would mean
 * ~50,000 URLs whose only unique content is a single number, ~90% shared with
 * the year page above them — the thin-content problem at a scale that would
 * define the site.
 *
 * These five have month pages on `master`, where they are indexed and ranking,
 * so they keep them. Nothing else gets a month tier: the monthly *data* is
 * still on every item page, as the Monthly interval on the chart, which is
 * where it is actually useful.
 */
export const MONTH_TIER_ITEMS = new Set(["gas", "eggs", "bread", "milk", "ground-beef"])

/** Year pages exist for every item — 12 readings each is real content. */
export const hasMonthTier = (slug: string) => MONTH_TIER_ITEMS.has(slug)

/**
 * A build-time assertion that the curated lists still point at real items.
 *
 * Every hand-written slug list on this site — the ticker, the home picker, the
 * nav — silently drops anything it cannot find, so a renamed slug shows up as
 * a shorter row rather than an error. Three of the ticker's fourteen entries
 * were dead before anyone noticed.
 */
export function assertSlugsExist(label: string, wanted: string[], available: Set<string>) {
  const missing = wanted.filter((slug) => !available.has(slug))
  if (missing.length) {
    throw new Error(`${label}: unknown item slug(s) — ${missing.join(", ")}`)
  }
}

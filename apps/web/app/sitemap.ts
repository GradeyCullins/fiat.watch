import type { MetadataRoute } from "next"

import { CALCULATORS, calculatorPath } from "@/lib/calculators"
import { getItems } from "@/lib/data"
import { monthParams, yearParams } from "@/lib/routes"
import { SITE } from "@/lib/site"

/**
 * One file. Google's cap is 50,000 URLs and this site is at ~2,850, so
 * `generateSitemaps` would only move the output off `/sitemap.xml` — the URL
 * `robots.txt` advertises — in exchange for nothing.
 *
 * Note what is absent: the old sitemap listed 56 `/calculation?…` URLs, which
 * are exactly the ones Search Console reported as duplicates of `/`.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const items = await getItems()
  const abs = (path: string) => new URL(path, SITE.url).toString()

  const entries: MetadataRoute.Sitemap = [
    { url: abs("/"), priority: 1, changeFrequency: "monthly" },
    { url: abs("/map"), priority: 0.6, changeFrequency: "monthly" },
    { url: abs("/calculators"), priority: 0.7, changeFrequency: "monthly" },
    { url: abs("/calculators/inflation"), priority: 0.9, changeFrequency: "monthly" },
    { url: abs("/sitemap"), priority: 0.2, changeFrequency: "monthly" },
    ...CALCULATORS.map((c) => ({
      url: abs(calculatorPath(c.slug)),
      priority: 0.8,
      changeFrequency: "monthly" as const,
    })),
    ...items.map((item) => ({
      url: abs(`/costs/${item.slug}`),
      priority: 0.7,
      changeFrequency: "monthly" as const,
    })),
  ]

  /*
   * Year and month URLs come from the same functions `generateStaticParams`
   * uses, so this file cannot advertise a page the build does not produce.
   *
   * It used to walk `getPriceKeys()` directly and so ignored `hasMonthTier` —
   * it listed 44,015 month URLs against 2,599 built pages, pointing Googlebot
   * at 41,416 that would 404.
   */
  for (const { item, year } of await yearParams()) {
    entries.push({ url: abs(`/costs/${item}/${year}`), priority: 0.5 })
  }

  for (const { item, year, month } of await monthParams()) {
    entries.push({ url: abs(`/costs/${item}/${year}/${month}`), priority: 0.3 })
  }

  return entries
}

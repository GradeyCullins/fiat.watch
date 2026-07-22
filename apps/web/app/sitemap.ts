import type { MetadataRoute } from "next"

import { CALCULATORS } from "@/lib/calculators"
import { getAnnual, getItems, getPriceKeys } from "@/lib/data"
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
    { url: abs("/calculator"), priority: 0.9, changeFrequency: "monthly" },
    { url: abs("/sitemap"), priority: 0.2, changeFrequency: "monthly" },
    ...CALCULATORS.map((c) => ({
      url: abs(c.path),
      priority: 0.8,
      changeFrequency: "monthly" as const,
    })),
    ...items.map((item) => ({
      url: abs(`/costs/${item.slug}`),
      priority: 0.7,
      changeFrequency: "monthly" as const,
    })),
  ]

  for (const item of items) {
    for (const row of await getAnnual(item.slug)) {
      entries.push({ url: abs(`/costs/${item.slug}/${row.year}`), priority: 0.5 })
    }
  }

  for (const key of await getPriceKeys()) {
    entries.push({
      url: abs(`/costs/${key.slug}/${key.year}/${String(key.month).padStart(2, "0")}`),
      priority: 0.3,
    })
  }

  return entries
}

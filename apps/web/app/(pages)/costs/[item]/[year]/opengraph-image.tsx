import { notFound } from "next/navigation"

import { getItem } from "@/lib/data"
import { emojiFor } from "@/lib/emoji"
import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og"
import { yearParams } from "@/lib/routes"

export const alt = "US average price for one item in one year, from BLS data"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

/** See the item card: image routes need their own params or they build as `ƒ`. */
export async function generateStaticParams() {
  return yearParams()
}

/**
 * One card per item-year — 3,946 of them, plus the same again for X.
 *
 * I left this segment inheriting the item card at first, on build cost: at two
 * cards a page this is the single largest generated-asset job in the build.
 * It earns it. A shared link to /costs/gas/1990 should say 1990 on the card,
 * and the item card cannot — the year is the whole reason that URL exists.
 *
 * The year is the only thing added. Still no figure: naming the period is what
 * the page is *about*; naming the price is what it *answers*.
 */
export default async function Image({
  params,
}: {
  params: Promise<{ item: string; year: string }>
}) {
  const { item: slug, year } = await params
  const item = await getItem(slug)
  if (!item) notFound()

  return ogCard({
    eyebrow: `${item.unit} · BLS average price`,
    lead: "The price of",
    highlight: item.labelAttributive,
    tail: `in ${year}`,
    footer: `${item.blsName} · every month BLS published that year`,
    emoji: emojiFor(item.slug),
  })
}

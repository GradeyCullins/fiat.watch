import { notFound } from "next/navigation"

import { getItem } from "@/lib/data"
import { emojiFor } from "@/lib/emoji"
import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og"
import { monthParams } from "@/lib/routes"
import { monthName } from "@/lib/site"

export const alt = "US average price for one item in one month, from BLS data"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

/** See the item card: image routes need their own params or they build as `ƒ`. */
export async function generateStaticParams() {
  return monthParams()
}

/** One card per item-month — 2,599 of them. Same reasoning as the year card. */
export default async function Image({
  params,
}: {
  params: Promise<{ item: string; year: string; month: string }>
}) {
  const { item: slug, year, month } = await params
  const item = await getItem(slug)
  if (!item) notFound()

  return ogCard({
    eyebrow: `${item.unit} · BLS average price`,
    lead: "The price of",
    highlight: item.labelAttributive,
    tail: `in ${monthName(Number(month))} ${year}`,
    footer: `${item.blsName} · one month's reading`,
    emoji: emojiFor(item.slug),
  })
}

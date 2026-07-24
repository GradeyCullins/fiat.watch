import { notFound } from "next/navigation"

import { getItem } from "@/lib/data"
import { emojiFor } from "@/lib/emoji"
import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og"
import { itemParams } from "@/lib/routes"

export const alt = "Historical US prices from BLS average price data"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

/**
 * A metadata image route does not inherit its sibling page's
 * `generateStaticParams` — it compiles to a standalone route handler whose
 * static params come only from its own module. Without this export the route
 * builds as `ƒ` (server-rendered on demand), and on a static deploy every card
 * URL these 160 pages advertise is a 404.
 */
export async function generateStaticParams() {
  return itemParams()
}

/** One card per item — 160 of them, generated at build. */
export default async function Image({ params }: { params: Promise<{ item: string }> }) {
  const item = await getItem((await params).item)
  if (!item) notFound()

  return ogCard({
    eyebrow: `${item.unit} · ${item.firstYear}–${item.lastYear}`,
    lead: "The price of",
    highlight: item.labelAttributive,
    footer: `${item.blsName} · BLS average price data`,
    emoji: emojiFor(item.slug),
  })
}

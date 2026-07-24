import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og"
import { getItems } from "@/lib/data"

export const alt = "Every price Fiat Watch tracks, from BLS average price data"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

/** The catalogue. Inherited by every item page that has no card of its own. */
export default async function Image() {
  const items = await getItems()
  return ogCard({
    eyebrow: "US average prices · Bureau of Labor Statistics",
    lead: "The price of",
    highlight: "everything",
    footer: `${items.length} items · what BLS actually recorded in shops, not an index`,
  })
}

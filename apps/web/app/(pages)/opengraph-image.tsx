import { getItems } from "@/lib/data"
import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og"

export const alt = "The price of everything — US average prices from the BLS"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

/**
 * The home card, at the route-group level so it matches the page.
 *
 * `app/opengraph-image.tsx` still said "What your money was really worth",
 * which was the headline when `/` *was* the calculator. It is a hub now, and
 * the card said something the page no longer does.
 */
export default async function Image() {
  const items = await getItems()
  return ogCard({
    eyebrow: "US average prices · Bureau of Labor Statistics",
    lead: "The price of",
    highlight: "everything",
    footer: `${items.length} items priced in real shops, plus eight inflation calculators`,
  })
}

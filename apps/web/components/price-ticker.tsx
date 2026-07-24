import { PriceRail, type RailItem } from "@/components/price-rail"
import { assertSlugsExist } from "@/lib/coverage"
import { getAnnual, getItems } from "@/lib/data"

/**
 * The data half of the rail under the nav.
 *
 * Stays a Server Component so the prices are in the prerendered HTML and the
 * client half only deals with scrolling and the current-page state.
 *
 * The set is longer than it was — the rail scrolls now, so it is no longer
 * capped by what fits the viewport — but it is still curated rather than all
 * 160. The last chip links to `/costs`, which is the catalogue.
 */
const RAIL = [
  "gas",
  "eggs",
  "bread",
  "milk",
  "ground-beef",
  "ground-coffee",
  "bacon",
  "bananas",
  "boneless-chicken-breast",
  "butter",
  "electricity",
  "sugar",
  "cheddar-cheese",
  "potatoes",
  "apples",
  "tomatoes",
  "white-rice",
  "whole-chicken",
  "hot-dogs",
  "ice-cream",
  "peanut-butter",
  "orange-juice",
  "beer",
  "natural-gas",
]

export async function PriceTicker() {
  const items = await getItems()
  const bySlug = new Map(items.map((i) => [i.slug, i]))
  assertSlugsExist("PriceRail", RAIL, new Set(bySlug.keys()))

  const rows: RailItem[] = (
    await Promise.all(
      RAIL.map(async (slug) => {
        const item = bySlug.get(slug)
        if (!item || item.isDiscontinued) return null

        const annual = await getAnnual(slug)
        const latest = annual.at(-1)
        if (!latest) return null

        return {
          slug,
          // The catalogue name is precise ("large grade A eggs") and too long
          // for a rail. The attributive form is the short one.
          label: item.labelAttributive,
          value: latest.value,
        }
      }),
    )
  ).filter((r): r is RailItem => r !== null)

  return <PriceRail items={rows} />
}

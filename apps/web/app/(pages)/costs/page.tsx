import { formatUsd } from "@workspace/core"

import { CardRail, ItemCard } from "@/components/item-card"
import { Crumbs, Shell } from "@/components/page-shell"
import { getAnnual, getItems } from "@/lib/data"
import { pageMetadata } from "@/lib/site"

export const metadata = pageMetadata({
  title: "Every price we track",
  description:
    "Average US prices for food, energy and household goods, published monthly by the Bureau of Labor Statistics. Every item, back to the year its series began.",
  path: "/costs",
})

/** In the order a shopper would look for them, not alphabetically. */
const CATEGORIES = [
  { key: "energy", title: "Energy", blurb: "Fuel at the pump and at the meter" },
  { key: "meat", title: "Meat & poultry", blurb: "Beef, pork, chicken" },
  { key: "dairy", title: "Dairy & eggs", blurb: "Milk, cheese, butter, eggs" },
  { key: "produce", title: "Fruit & veg", blurb: "Fresh, by the pound" },
  { key: "grains", title: "Bread & grains", blurb: "Bread, flour, rice, pasta" },
  { key: "pantry", title: "Pantry & drinks", blurb: "Coffee, sugar, tinned, bottled" },
] as const

/**
 * The catalogue. This page did not exist while there were five items, which
 * was survivable; at 160 it is the spine of the site, and every "all items"
 * link in the nav and footer lands here.
 */
export default async function Page() {
  const items = await getItems()

  const withPrices = await Promise.all(
    items.map(async (item) => {
      const annual = await getAnnual(item.slug)
      return { item, latest: annual.at(-1)?.value ?? null }
    }),
  )

  const live = withPrices.filter(({ item }) => !item.isDiscontinued)
  const retired = withPrices.filter(({ item }) => item.isDiscontinued)

  return (
    <Shell wide className="py-6 sm:py-8">
      <Crumbs trail={[{ label: "Fiat Watch", href: "/" }, { label: "Prices" }]} />

      <div className="mb-8 max-w-2xl">
        <h1 className="font-display text-headline">Every price we track</h1>
        <p className="text-muted-foreground mt-3 text-pretty">
          {items.length} items from the Bureau of Labor Statistics — {live.length} still published,{" "}
          {retired.length} discontinued but kept for their history. Each one goes back to the year
          its series began.
        </p>
      </div>

      {CATEGORIES.map((category) => {
        const rows = live.filter(({ item }) => item.category === category.key)
        if (!rows.length) return null

        return (
          <section key={category.key} className="mb-10">
            <div className="mb-3 flex items-baseline gap-3">
              <h2 className="font-display text-lg font-bold tracking-tight">{category.title}</h2>
              <p className="text-muted-foreground text-xs">{category.blurb}</p>
              <span className="text-muted-foreground tnum ml-auto font-mono text-xs">
                {rows.length}
              </span>
            </div>
            <CardRail>
              {rows.map(({ item, latest }) => (
                <li key={item.slug}>
                  <ItemCard
                    slug={item.slug}
                    label={item.label}
                    meta={item.unit}
                    value={latest == null ? undefined : formatUsd(latest)}
                    href={`/costs/${item.slug}`}
                    size="compact"
                  />
                </li>
              ))}
            </CardRail>
          </section>
        )
      })}

      {retired.length ? (
        <section className="mt-14">
          <div className="mb-3 flex items-baseline gap-3">
            <h2 className="font-display text-lg font-bold tracking-tight">No longer tracked</h2>
            <p className="text-muted-foreground text-xs">
              BLS stopped publishing these, but the history is real — and for some items it is the
              only record of the early years
            </p>
            <span className="text-muted-foreground tnum ml-auto font-mono text-xs">
              {retired.length}
            </span>
          </div>
          <CardRail>
            {retired.map(({ item }) => (
              <li key={item.slug}>
                <ItemCard
                  slug={item.slug}
                  label={item.label}
                  meta={`${item.firstYear}–${item.lastYear}`}
                  href={`/costs/${item.slug}`}
                  size="compact"
                />
              </li>
            ))}
          </CardRail>
        </section>
      ) : null}
    </Shell>
  )
}

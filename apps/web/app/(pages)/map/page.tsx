import { MapExplorer } from "@/components/map-explorer"
import { getMapData } from "@/lib/map-data"
import { jsonLd, pageMetadata, SITE } from "@/lib/site"

export const metadata = pageMetadata({
  title: "Where things cost more",
  description:
    "The same grocery basket, priced by place. Census-region and city average prices from the Bureau of Labor Statistics, on a globe you can turn.",
  path: "/map",
})

/**
 * The census areas BLS actually publishes, named for a reader rather than for
 * a statistician. Order is deliberate: it is the order they appear in the
 * table, and geography reads better than alphabetics.
 */
const REGIONS = [
  { slug: "northeast", name: "Northeast" },
  { slug: "midwest", name: "Midwest" },
  { slug: "south", name: "South" },
  { slug: "west", name: "West" },
]

const DIVISIONS = [
  { slug: "new-england", name: "New England" },
  { slug: "middle-atlantic", name: "Middle Atlantic" },
  { slug: "east-north-central", name: "East North Central" },
  { slug: "west-north-central", name: "West North Central" },
  { slug: "south-atlantic", name: "South Atlantic" },
  { slug: "east-south-central", name: "East South Central" },
  { slug: "west-south-central", name: "West South Central" },
  { slug: "mountain", name: "Mountain" },
  { slug: "pacific", name: "Pacific" },
]

export default async function Page() {
  const items = await getMapData()

  // The metro list comes from the data rather than a second hardcoded list, so
  // it cannot drift from the catalogue the way the ticker slugs did twice.
  const metroSlugs = new Set<string>()
  for (const item of items) {
    if (!item.kinds.includes("metro")) continue
    for (const slug of Object.keys(item.readings)) metroSlugs.add(slug)
  }
  const known = new Set([...REGIONS, ...DIVISIONS].map((a) => a.slug))
  const metros = [...metroSlugs]
    .filter((slug) => !known.has(slug))
    .map((slug) => ({
      slug,
      name: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const withMetros = items.filter((i) => i.kinds.includes("metro"))

  return (
    /*
     * Full-bleed: the viewport minus the sticky 3.5rem nav, and no `Shell`.
     * `dvh` rather than `vh` so a phone's collapsing address bar does not leave
     * a strip of page peeking below the map.
     */
    <main className="relative h-[calc(100dvh-3.5rem)] w-full overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd({
          "@type": "Dataset",
          name: "US average prices by census region and metropolitan area",
          description:
            "Average prices for food, energy and household goods across the four US census regions, nine census divisions and 35 metropolitan areas, published by the Bureau of Labor Statistics.",
          creator: { "@type": "Organization", name: "US Bureau of Labor Statistics" },
          spatialCoverage: { "@type": "Place", name: "United States" },
          isAccessibleForFree: true,
          url: new URL("/map", SITE.url).toString(),
        })}
      />

      <MapExplorer
        items={items}
        regions={REGIONS}
        divisions={DIVISIONS}
        metros={metros}
        caveat={
          <>
            <p>
              The Bureau of Labor Statistics does not price things by state. It prices them by{" "}
              <strong className="text-foreground">census region</strong> — four of them, covering
              all fifty states — and, for energy only, by{" "}
              <strong className="text-foreground">city</strong>. So a state here is shaded by the
              region it sits in, and the pins are cities where BLS runs its own collection, up to{" "}
              {metros.length} of them depending on the item.
            </p>
            <p>
              {items.length} items can be mapped and {withMetros.length} have city prices, every
              one of them energy — there is no metro price for eggs. Each map shows a single
              month: an area whose series BLS retired long ago is left off rather than drawn
              beside a current one, because a 1986 price next to a 2026 one is forty years of
              inflation wearing the costume of a regional difference.
            </p>
          </>
        }
      />
    </main>
  )
}

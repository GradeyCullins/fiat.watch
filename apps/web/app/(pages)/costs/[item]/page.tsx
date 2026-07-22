import Link from "next/link"
import { notFound } from "next/navigation"

import { convert, formatUsd } from "@workspace/core"

import { ItemArt } from "@/components/item-art"
import { ItemChart, type ChartReading } from "@/components/item-chart"
import { Crumbs, Shell, Stat, StatRail } from "@/components/page-shell"
import { getAnnual, getCpiTable, getItem, getItems, getMonthlySeries } from "@/lib/data"
import { itemStats } from "@/lib/item-stats"
import { colorFor } from "@/lib/series"
import { jsonLd, pageMetadata, SITE } from "@/lib/site"

export const dynamicParams = false

export async function generateStaticParams() {
  return (await getItems()).map((item) => ({ item: item.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ item: string }> }) {
  const item = await getItem((await params).item)
  if (!item) return {}
  const table = await getCpiTable()

  return pageMetadata({
    title: `Historical ${item.labelAttributive} prices by year`,
    description: `Every year of BLS average ${item.label} prices from ${item.firstYear} to ${item.lastYear}, ${item.unit}, each one restated in ${table.latestYear} dollars, on one chart.`,
    path: `/costs/${item.slug}`,
  })
}

export default async function Page({ params }: { params: Promise<{ item: string }> }) {
  const slug = (await params).item
  const [item, table, items] = await Promise.all([getItem(slug), getCpiTable(), getItems()])
  if (!item) notFound()

  const [rows, months] = await Promise.all([getAnnual(slug), getMonthlySeries(slug)])
  const baseYear = table.latestYear
  const color = colorFor(slug)

  const deflate = (amount: number, year: number, month?: number) =>
    table.has(year, month ?? null)
      ? convert(table, { amount, from: { year, month }, to: { year: baseYear } }).converted
      : null

  const annual: ChartReading[] = rows.map((row) => ({
    year: row.year,
    nominal: row.value,
    real: deflate(row.value, row.year),
  }))

  // The same series at monthly resolution — a zoom level on this chart, not a
  // different page. Each point is deflated with its own month's CPI.
  const monthly: ChartReading[] = months.map((m) => ({
    year: m.year,
    month: m.month,
    nominal: m.value,
    real: deflate(m.value, m.year, m.month),
  }))

  const partial = new Set(item.partialYears)

  return (
    <Shell wide className="py-6 sm:py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd({
          "@type": "Dataset",
          name: `US average ${item.label} prices, ${item.firstYear}–${item.lastYear}`,
          description: `Average price of ${item.label}, ${item.unit}, published by the US Bureau of Labor Statistics.`,
          temporalCoverage: `${item.firstYear}/${item.lastYear}`,
          creator: { "@type": "Organization", name: "US Bureau of Labor Statistics" },
          isAccessibleForFree: true,
          url: new URL(`/costs/${item.slug}`, SITE.url).toString(),
        })}
      />

      <Crumbs
        trail={[
          { label: "Fiat Watch", href: "/" },
          { label: "Prices", href: "/" },
          { label: item.label },
        ]}
      />

      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <ItemArt slug={slug} className="size-9 shrink-0" style={{ color }} />
        <h1 className="font-display text-2xl leading-none font-extrabold tracking-tight sm:text-3xl">
          Historical {item.labelAttributive} prices by year
        </h1>
        <p className="text-muted-foreground text-eyebrow w-full uppercase sm:w-auto">
          {item.unit} · {item.firstYear}–{item.lastYear} · {item.observations} monthly readings
        </p>
      </div>

      <StatRail>
        {itemStats({ points: annual, unit: item.unit, baseYear }).map((stat) => (
          <Stat key={stat.label} {...stat} />
        ))}
      </StatRail>

      <div className="mt-3">
        <ItemChart
          slug={slug}
          label={item.label}
          unit={item.unit}
          color={color}
          baseYear={baseYear}
          annual={annual}
          monthly={monthly}
        />
      </div>

      {/*
        The year index. This used to be a 220-row table, which was unreadable —
        but it is also the only crawl path to the 220 year pages, so it cannot
        simply be deleted. Dense chips do the same linking in a tenth of the
        height, and the price is on the chip rather than in a column.
      */}
      <section className="mt-8">
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <h2 className="font-display text-lg font-bold tracking-tight">
            Every year, {item.firstYear}–{item.lastYear}
          </h2>
          <p className="text-muted-foreground text-xs">
            {rows.length} pages · each one has its own months
          </p>
        </div>
        <ul className="ruled grid grid-cols-2 gap-px border sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {[...rows].reverse().map((point) => (
            <li key={point.year} className="bg-border">
              <Link
                href={`/costs/${slug}/${point.year}`}
                className="bg-card hover:bg-accent flex h-full flex-col gap-1 px-3 py-2 transition-colors"
              >
                <span className="tnum text-muted-foreground flex items-center gap-1.5 font-mono text-xs">
                  {point.year}
                  {partial.has(point.year) ? (
                    <span
                      title={`${point.months} of 12 months published`}
                      className="bg-muted-foreground/50 size-1.5 rounded-full"
                    />
                  ) : null}
                </span>
                <span className="tnum font-mono text-sm font-semibold">
                  {formatUsd(point.value)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {item.partialYears.length ? (
          <p className="text-muted-foreground mt-2 text-xs">
            Dotted years are an average over fewer than twelve months — BLS did not publish a full
            year.
          </p>
        ) : null}
      </section>

      <section className="mt-8">
        <h2 className="font-display mb-3 text-lg font-bold tracking-tight">Other prices</h2>
        <ul className="ruled grid gap-px border sm:grid-cols-2 lg:grid-cols-4">
          {items
            .filter((other) => other.slug !== slug)
            .map((other) => (
              <li key={other.slug} className="bg-border">
                <Link
                  href={`/costs/${other.slug}`}
                  className="bg-card hover:bg-accent flex h-full items-center gap-2.5 px-3 py-2.5 transition-colors"
                >
                  <ItemArt
                    slug={other.slug}
                    className="size-5"
                    style={{ color: colorFor(other.slug) }}
                  />
                  <span className="text-sm font-medium">{other.label}</span>
                  <span className="text-muted-foreground tnum ml-auto font-mono text-xs">
                    {other.firstYear}–{other.lastYear}
                  </span>
                </Link>
              </li>
            ))}
        </ul>
      </section>
    </Shell>
  )
}

import { notFound } from "next/navigation"

import { convert } from "@workspace/core"

import { ItemChart, type ChartReading } from "@/components/item-chart"
import { DataSource } from "@/components/data-source"
import { Crumbs, Shell, Stat, StatRail } from "@/components/page-shell"
import { getAnnual, getCpiTable, getItem, getItems, getMonthlySeries } from "@/lib/data"
import { itemStats } from "@/lib/item-stats"
import { emojiFor } from "@/lib/emoji"
import { itemParams } from "@/lib/routes"
import { colorFor } from "@/lib/series"
import { jsonLd, pageMetadata, SITE } from "@/lib/site"

export const dynamicParams = false

export async function generateStaticParams() {
  return itemParams()
}

export async function generateMetadata({ params }: { params: Promise<{ item: string }> }) {
  const item = await getItem((await params).item)
  if (!item) return {}
  const table = await getCpiTable()

  return pageMetadata({
    // No "by year" — the chart does months as well, and the page has year and
    // month children. It described one of three views.
    title: `Historical ${item.labelAttributive} prices`,
    description: `Every year of BLS average ${item.label} prices from ${item.firstYear} to ${item.lastYear}, ${item.unit}, each one restated in ${table.latestYear} dollars, on one chart.`,
    path: `/costs/${item.slug}`,
  })
}

export default async function Page({ params }: { params: Promise<{ item: string }> }) {
  const slug = (await params).item
  const [item, table] = await Promise.all([getItem(slug), getCpiTable()])
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
          { label: "Prices", href: "/costs" },
          { label: item.label },
        ]}
      />

      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span aria-hidden className="shrink-0 text-5xl leading-none sm:text-6xl">
          {emojiFor(slug)}
        </span>
        <h1 className="font-display text-2xl leading-none font-extrabold tracking-tight sm:text-3xl">
          Historical {item.labelAttributive} prices
        </h1>
        {/* "606 monthly readings" was a row count, not a fact anyone wants.
            What matters is the unit, the span, and whether it still runs. */}
        {/*
          BLS's own name for the series, verbatim and visible.

          The heading says "eggs" because that is the question people ask, but
          the number is specifically grade A large by the dozen — BLS excludes
          cartons of 6 and 18 from it entirely. That was buried in a tooltip,
          which is the wrong place for the definition of the figure the whole
          page is about.
        */}
        <p className="text-muted-foreground flex w-full flex-wrap items-center gap-x-1.5 text-xs sm:w-auto">
          <span className="text-foreground/80 font-medium">{item.blsName}</span>
          <span aria-hidden>·</span>
          <span>
            BLS average price,{" "}
            {item.isDiscontinued
              ? `${item.firstYear}–${item.lastYear}, no longer tracked`
              : `monthly since ${item.firstYear}`}
          </span>
          <DataSource survey="ap" seriesId={item.seriesId} blsName={item.blsName} />
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

    </Shell>
  )
}

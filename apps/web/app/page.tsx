import Link from "next/link"

import { convert, formatUsd } from "@workspace/core"

import { PriceChart, type ChartRow, type ChartSeries } from "@/components/price-chart"
import { getAnnual, getCpiTable, getItems, toChartRows } from "@/lib/data"
import { colorFor } from "@/lib/series"
import { jsonLd, pageMetadata, SITE } from "@/lib/site"

export const metadata = pageMetadata({
  title: `US Inflation Calculator With CPI Data | ${SITE.name}`,
  description:
    "Compare US average prices for gas, eggs, bread, milk, and ground beef across fifty years — in the dollars of the day or in today's money. Official BLS data.",
  path: "/",
})

export default async function Page() {
  const [items, table] = await Promise.all([getItems(), getCpiTable()])
  const baseYear = table.latestYear

  const perItem = await Promise.all(
    items.map(async (item) => ({ slug: item.slug, rows: await getAnnual(item.slug) })),
  )

  const nominal = toChartRows(perItem) as ChartRow[]

  // The same prices restated in base-year dollars. A year with a price but no
  // CPI reading simply drops out rather than being deflated by a neighbour's.
  const adjusted: ChartRow[] = nominal.map((row) => {
    const year = row.year as number
    const out: ChartRow = { year }
    for (const { slug } of perItem) {
      const value = row[slug] ?? null
      out[slug] =
        value == null || !table.has(year)
          ? null
          : convert(table, { amount: value, from: { year }, to: { year: baseYear } }).converted
    }
    return out
  })

  const series: ChartSeries[] = items.map((item, i) => {
    const rows = perItem.find((p) => p.slug === item.slug)?.rows ?? []
    return {
      slug: item.slug,
      label: item.label,
      unit: item.unit,
      color: colorFor(item.slug, i),
      latest: rows.at(-1)?.value ?? 0,
      firstYear: item.firstYear,
      lastYear: item.lastYear,
    }
  })

  const gas = series.find((s) => s.slug === "gas") ?? series[0]!
  const gasFirst = perItem.find((p) => p.slug === gas.slug)?.rows[0]
  const gasThen = gasFirst
    ? convert(table, {
        amount: gasFirst.value,
        from: { year: gasFirst.year },
        to: { year: baseYear },
      }).converted
    : null

  return (
    <main className="mx-auto flex w-full max-w-[1800px] flex-col gap-5 px-4 py-6 sm:px-6 lg:h-[calc(100dvh-4rem)] lg:overflow-hidden lg:py-7 xl:px-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(datasetLd(items))} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-eyebrow text-muted-foreground uppercase">
            US average prices · Bureau of Labor Statistics
          </p>
          <h1 className="font-display text-display mt-2 text-balance">
            The price of
            <span className="text-primary-foreground bg-primary ruled mx-2 inline-block -rotate-1 border-2 px-2.5 align-baseline">
              everything
            </span>
            since {Math.min(...items.map((i) => i.firstYear))}.
          </h1>
        </div>

        <p className="text-muted-foreground max-w-sm shrink-0 text-sm text-pretty lg:mb-1 lg:text-right">
          {gasThen ? (
            <>
              A gallon of gas cost {formatUsd(gasFirst!.value)} in {gasFirst!.year} — about{" "}
              <strong className="text-foreground font-mono tnum">{formatUsd(gasThen)}</strong> in{" "}
              {baseYear} money. It sells for {formatUsd(gas.latest)} today.{" "}
            </>
          ) : null}
          <Link href="/calculator" className="hover:text-foreground underline underline-offset-4">
            Run your own number →
          </Link>
        </p>
      </div>

      <PriceChart
        className="min-h-[420px] flex-1"
        series={series}
        nominal={nominal}
        adjusted={adjusted}
        baseYear={baseYear}
      />

      <p className="text-muted-foreground shrink-0 text-xs">
        Annual figures are the mean of the months BLS published that year. October 2025 was never
        collected — the shutdown suspended the survey — so the line breaks rather than bridging it.
      </p>
    </main>
  )
}

function datasetLd(items: { label: string; labelAttributive: string; slug: string }[]) {
  return {
    "@type": "Dataset",
    name: "US average consumer prices",
    description:
      "Average prices for common US consumer goods, published monthly by the Bureau of Labor Statistics.",
    creator: { "@type": "Organization", name: "US Bureau of Labor Statistics" },
    isAccessibleForFree: true,
    license: "https://www.bls.gov/opub/copyright-information.htm",
    hasPart: items.map((item) => ({
      "@type": "Dataset",
      name: `Historical ${item.labelAttributive} prices`,
      url: new URL(`/costs/${item.slug}`, SITE.url).toString(),
    })),
  }
}

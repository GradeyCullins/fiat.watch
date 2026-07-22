import Link from "next/link"
import { notFound } from "next/navigation"

import { convert, formatUsd } from "@workspace/core"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

import { ItemArt } from "@/components/item-art"
import { Crumbs, PageTitle, Section, Shell } from "@/components/page-shell"
import { SeriesChart, type SeriesPoint } from "@/components/series-chart"
import { getAnnual, getCpiTable, getItem, getItems } from "@/lib/data"
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
    description: `Browse BLS average ${item.label} prices from ${item.firstYear} to ${item.lastYear}, ${item.unit}, alongside the inflation-adjusted value in ${table.latestYear} dollars.`,
    path: `/costs/${item.slug}`,
  })
}

export default async function Page({ params }: { params: Promise<{ item: string }> }) {
  const slug = (await params).item
  const [item, table, items] = await Promise.all([getItem(slug), getCpiTable(), getItems()])
  if (!item) notFound()

  const rows = await getAnnual(slug)
  const baseYear = table.latestYear
  const color = colorFor(slug)

  const enriched = rows.map((row) => ({
    ...row,
    adjusted: table.has(row.year)
      ? convert(table, { amount: row.value, from: { year: row.year }, to: { year: baseYear } })
          .converted
      : null,
  }))

  const points: SeriesPoint[] = enriched.map((row) => ({
    x: row.year,
    nominal: row.value,
    adjusted: row.adjusted,
  }))

  const first = enriched[0]!
  const last = enriched.at(-1)!
  const realChange = first.adjusted ? (last.value / first.adjusted - 1) * 100 : null

  return (
    <Shell>
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

      <div className="mb-8 flex items-start gap-4">
        <ItemArt slug={slug} className="size-12 shrink-0 sm:size-16" style={{ color }} />
        <PageTitle
          eyebrow={`${item.observations} monthly readings · ${item.firstYear}–${item.lastYear}`}
          lede={
            realChange == null ? null : (
              <>
                {item.label} cost {formatUsd(first.value)} {item.unit} in {first.year} — about{" "}
                <strong className="text-foreground font-mono tnum">
                  {formatUsd(first.adjusted!)}
                </strong>{" "}
                in {baseYear} money. It costs {formatUsd(last.value)} today, so in real terms it is{" "}
                <strong className="text-foreground">
                  {realChange >= 0 ? "up" : "down"} {Math.abs(realChange).toFixed(0)}%
                </strong>{" "}
                over {last.year - first.year} years.
              </>
            )
          }
        >
          Historical {item.labelAttributive} prices by year
        </PageTitle>
      </div>

      <SeriesChart
        points={points}
        label={item.label}
        unit={item.unit}
        color={color}
        baseYear={baseYear}
      />

      <Section title={`Every year, ${item.firstYear}–${item.lastYear}`}>
        <div className="ruled overflow-x-auto border-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Year</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">In {baseYear} dollars</TableHead>
                <TableHead className="text-right">Months</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...enriched].reverse().map((row) => (
                <TableRow key={row.year}>
                  <TableCell>
                    <Link
                      href={`/costs/${slug}/${row.year}`}
                      className="tnum font-mono font-bold underline-offset-4 hover:underline"
                    >
                      {row.year}
                    </Link>
                  </TableCell>
                  <TableCell className="tnum text-right font-mono">
                    {formatUsd(row.value)}
                  </TableCell>
                  <TableCell className="tnum text-muted-foreground text-right font-mono">
                    {row.adjusted == null ? "—" : formatUsd(row.adjusted)}
                  </TableCell>
                  <TableCell className="tnum text-muted-foreground text-right font-mono text-xs">
                    {row.months === 12 ? "12" : `${row.months} of 12`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {item.partialYears.length ? (
          <p className="text-muted-foreground mt-3 text-xs">
            {item.partialYears.join(", ")} {item.partialYears.length === 1 ? "is" : "are"} an
            average over fewer than twelve months — BLS did not publish a full year.
          </p>
        ) : null}
      </Section>

      <Section title="Other prices">
        <ul className="ruled grid border-2 sm:grid-cols-2">
          {items
            .filter((other) => other.slug !== slug)
            .map((other) => (
              <li key={other.slug} className="ruled border-b-2 last:border-b-0 sm:even:border-l-2">
                <Link
                  href={`/costs/${other.slug}`}
                  className="hover:bg-accent flex items-center gap-3 p-4 transition-colors"
                >
                  <ItemArt
                    slug={other.slug}
                    className="size-6"
                    style={{ color: colorFor(other.slug) }}
                  />
                  <span className="font-display font-bold">
                    Historical {other.labelAttributive} prices
                  </span>
                  <span className="text-muted-foreground tnum ml-auto text-xs">
                    {other.firstYear}–{other.lastYear}
                  </span>
                </Link>
              </li>
            ))}
        </ul>
      </Section>
    </Shell>
  )
}

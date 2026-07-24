import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react"

import { convert, formatUsd } from "@workspace/core"

import { ItemChart, type ChartReading } from "@/components/item-chart"
import { Crumbs, priceTone, Shell, Stat, StatRail } from "@/components/page-shell"
import { getAnnual, getCpiTable, getItem, getItems, getMonthlySeries } from "@/lib/data"
import { emojiFor } from "@/lib/emoji"
import { yearParams } from "@/lib/routes"
import { colorFor } from "@/lib/series"
import { pageMetadata } from "@/lib/site"

export const dynamicParams = false

export async function generateStaticParams() {
  return yearParams()
}

/**
 * Resolve existence before the first `await` that could stream. Once a
 * boundary has flushed, `notFound()` yields a 200 with a noindex tag rather
 * than a real 404 — which is the opposite of what these pages need.
 */
async function load(item: string, yearParam: string) {
  const year = Number(yearParam)
  const [found, rows] = await Promise.all([getItem(item), getAnnual(item)])
  if (!found) return null
  const index = rows.findIndex((r) => r.year === year)
  if (index === -1) return null
  return { item: found, rows, index, year, row: rows[index]! }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ item: string; year: string }>
}) {
  const { item, year } = await params
  const data = await load(item, year)
  if (!data) return {}
  const table = await getCpiTable()

  return pageMetadata({
    title: `How much did ${data.item.label} cost in ${data.year}?`,
    // Deliberately does not state the price.
    //
    // The old descriptions opened with the answer, which lets the search result
    // satisfy the query outright. This is not a complete fix on its own —
    // Google rewrites most descriptions and can lift the figure off the page
    // anyway — but it changes what the snippet promises, from a number the
    // result page can show to a set of things it cannot.
    description: `Every monthly BLS average price for ${data.item.label} in ${data.year}, ${data.item.unit}, restated in ${table.latestYear} dollars and set against the years either side.`,
    path: `/costs/${data.item.slug}/${data.year}`,
  })
}

export default async function Page({
  params,
}: {
  params: Promise<{ item: string; year: string }>
}) {
  const { item: slug, year: yearParam } = await params
  const data = await load(slug, yearParam)
  if (!data) notFound()

  const { item, rows, index, year, row } = data
  const [table, allMonths] = await Promise.all([getCpiTable(), getMonthlySeries(slug)])
  const allYears = rows

  const baseYear = table.latestYear
  const color = colorFor(slug)
  const adjusted = table.has(year)
    ? convert(table, { amount: row.value, from: { year }, to: { year: baseYear } }).converted
    : null

  const previous = rows[index - 1]
  const next = rows[index + 1]
  const yoy = previous ? (row.value / previous.value - 1) * 100 : null

  const deflate = (amount: number, y: number, m?: number) =>
    table.has(y, m ?? null)
      ? convert(table, { amount, from: { year: y, month: m }, to: { year: baseYear } }).converted
      : null

  // The full series, both resolutions. Same data the item page ships — this
  // page is a zoom level on it, not a different chart.
  const annual: ChartReading[] = allYears.map((row) => ({
    year: row.year,
    nominal: row.value,
    real: deflate(row.value, row.year),
  }))
  const monthly: ChartReading[] = allMonths.map((m) => ({
    year: m.year,
    month: m.month,
    nominal: m.value,
    real: deflate(m.value, m.year, m.month),
  }))

  return (
    <Shell wide className="py-6 sm:py-8">
      <Crumbs
        trail={[
          { label: "Fiat Watch", href: "/" },
          { label: "Prices", href: "/costs" },
          { label: item.label, href: `/costs/${slug}` },
          { label: String(year) },
        ]}
      />

      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span aria-hidden className="shrink-0 text-5xl leading-none sm:text-6xl">
          {emojiFor(slug)}
        </span>
        <h1 className="font-display text-2xl leading-none font-extrabold tracking-tight sm:text-3xl">
          How much did {item.label} cost in {year}?
        </h1>
        <p className="text-muted-foreground text-eyebrow w-full uppercase sm:w-auto">
          {item.unit} · BLS average price
        </p>
      </div>

      <StatRail>
        <Stat label={`Price in ${year}`} value={formatUsd(row.value)} note={item.unit} />
        <Stat
          label={`In ${baseYear} dollars`}
          value={adjusted == null ? "—" : formatUsd(adjusted)}
          note={
            adjusted == null
              ? "No CPI reading for this year"
              : `${((adjusted / row.value - 1) * 100).toFixed(0)}% above the price of the day`
          }
        />
        <Stat
          label="Year on year"
          value={yoy == null ? "—" : `${yoy >= 0 ? "+" : ""}${yoy.toFixed(1)}%`}
          tone={priceTone(yoy)}
          note={previous ? `vs ${formatUsd(previous.value)} in ${previous.year}` : "First year"}
        />
        <Stat
          label="Coverage"
          value={`${row.months}/12`}
          note={row.months === 12 ? "Full year published" : "BLS published a partial year"}
        />
      </StatRail>

      <nav className="mt-3 flex items-center justify-between gap-3">
        {previous ? (
          <Neighbour href={`/costs/${slug}/${previous.year}`} back>
            {previous.year} · {formatUsd(previous.value)}
          </Neighbour>
        ) : (
          <span />
        )}
        <Link
          href={`/costs/${slug}`}
          className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-4"
        >
          All years
        </Link>
        {next ? (
          <Neighbour href={`/costs/${slug}/${next.year}`}>
            {next.year} · {formatUsd(next.value)}
          </Neighbour>
        ) : (
          <span />
        )}
      </nav>

      <div className="mt-3">
        <ItemChart
          slug={slug}
          label={item.label}
          unit={item.unit}
          color={color}
          baseYear={baseYear}
          annual={annual}
          monthly={monthly}
          focus={{ year }}
        />
      </div>

    </Shell>
  )
}

function Neighbour({
  href,
  back,
  children,
}: {
  href: string
  back?: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="ruled hover:bg-accent tnum flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-xs transition-colors"
    >
      {back ? <ArrowLeftIcon className="size-3" /> : null}
      {children}
      {back ? null : <ArrowRightIcon className="size-3" />}
    </Link>
  )
}

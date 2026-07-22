import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react"

import { convert, formatUsd } from "@workspace/core"

import { ItemChart, type ChartReading } from "@/components/item-chart"
import { Crumbs, Shell, Stat, StatRail } from "@/components/page-shell"
import { getAnnual, getCpiTable, getItem, getItems, getMonthly, getMonthlySeries } from "@/lib/data"
import { hasMonthTier } from "@/lib/coverage"
import { emojiFor } from "@/lib/emoji"
import { colorFor } from "@/lib/series"
import { monthName, pageMetadata } from "@/lib/site"

export const dynamicParams = false

export async function generateStaticParams() {
  const items = await getItems()
  const out: { item: string; year: string }[] = []
  for (const item of items) {
    for (const row of await getAnnual(item.slug)) {
      out.push({ item: item.slug, year: String(row.year) })
    }
  }
  return out
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
  const [table, items, months, allMonths] = await Promise.all([
    getCpiTable(),
    getItems(),
    getMonthly(slug, year),
    getMonthlySeries(slug),
  ])
  const allYears = rows

  const baseYear = table.latestYear
  const color = colorFor(slug)
  const adjusted = table.has(year)
    ? convert(table, { amount: row.value, from: { year }, to: { year: baseYear } }).converted
    : null

  const previous = rows[index - 1]
  const next = rows[index + 1]
  const yoy = previous ? (row.value / previous.value - 1) * 100 : null

  const related = await Promise.all(
    items
      .filter((other) => other.slug !== slug)
      .map(async (other) => ({
        other,
        value: (await getAnnual(other.slug)).find((r) => r.year === year)?.value ?? null,
      })),
  )

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
        <span aria-hidden className="bg-muted/70 grid size-11 shrink-0 place-items-center rounded-full text-2xl">
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
          tone={yoy == null ? undefined : yoy >= 0 ? "up" : "down"}
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

      {months.length ? (
        <section className="mt-8">
          <h2 className="font-display mb-3 text-lg font-bold tracking-tight">
            Month by month in {year}
          </h2>
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
          {/* Only the five legacy items have month pages — see lib/coverage.ts.
              The monthly data is still on the chart above for every item; what
              is gated here is linking to URLs that will not be built. */}
          {hasMonthTier(slug) ? (
          <ul className="ruled mt-3 grid grid-cols-3 gap-px border sm:grid-cols-6 lg:grid-cols-12">
            {months.map((point) => (
              <li key={point.month} className="bg-border">
                <Link
                  href={`/costs/${slug}/${year}/${String(point.month).padStart(2, "0")}`}
                  className="bg-card hover:bg-accent flex h-full flex-col gap-1 px-2.5 py-2 transition-colors"
                >
                  <span className="text-muted-foreground text-xs">{monthName(point.month).slice(0, 3)}</span>
                  <span className="tnum font-mono text-sm font-semibold">
                    {formatUsd(point.value)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          ) : null}
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="font-display mb-3 text-lg font-bold tracking-tight">
          Everything else in {year}
        </h2>
        <ul className="ruled grid gap-px border sm:grid-cols-2 lg:grid-cols-4">
          {related.map(({ other, value }) => (
            <li key={other.slug} className="bg-border">
              {value == null ? (
                <span className="bg-card text-muted-foreground flex h-full items-center gap-2.5 px-3 py-2.5 text-sm">
                  <span aria-hidden className="size-5 opacity-40 grid place-items-center">{emojiFor(other.slug)}</span>
                  {other.label} — no data
                </span>
              ) : (
                <Link
                  href={`/costs/${other.slug}/${year}`}
                  className="bg-card hover:bg-accent flex h-full items-center gap-2.5 px-3 py-2.5 transition-colors"
                >
                  <span aria-hidden className="size-5 grid place-items-center">{emojiFor(other.slug)}</span>
                  <span className="text-sm font-medium">{other.label}</span>
                  <span className="tnum ml-auto font-mono text-sm font-semibold">
                    {formatUsd(value)}
                  </span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </section>
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
      className="ruled hover:bg-accent tnum flex items-center gap-1.5 border px-2.5 py-1 font-mono text-xs transition-colors"
    >
      {back ? <ArrowLeftIcon className="size-3" /> : null}
      {children}
      {back ? null : <ArrowRightIcon className="size-3" />}
    </Link>
  )
}

import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react"

import { convert, formatUsd } from "@workspace/core"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { ItemArt } from "@/components/item-art"
import { MonthDashboard, type MonthPoint } from "@/components/month-dashboard"
import { Crumbs, Shell, Stat, StatRail } from "@/components/page-shell"
import { getAnnual, getCpiTable, getItem, getItems, getMonthly } from "@/lib/data"
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
    description: `${data.item.label} cost ${formatUsd(data.row.value)} ${data.item.unit} in ${data.year}, based on BLS average price data. See the value in ${table.latestYear} dollars.`,
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
  const [table, items, months] = await Promise.all([
    getCpiTable(),
    getItems(),
    getMonthly(slug, year),
  ])

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

  const points: MonthPoint[] = months.map((m) => ({
    month: m.month,
    short: monthName(m.month).slice(0, 3),
    name: monthName(m.month),
    nominal: m.value,
    // Month pages on the old site deflated a March price with the *annual*
    // index. With monthly CPI now stored, the right deflator is available.
    real: table.has(year, m.month)
      ? convert(table, { amount: m.value, from: { year, month: m.month }, to: { year: baseYear } })
          .converted
      : null,
  }))

  return (
    <Shell wide className="py-6 sm:py-8">
      <Crumbs
        trail={[
          { label: "Fiat Watch", href: "/" },
          { label: item.label, href: `/costs/${slug}` },
          { label: String(year) },
        ]}
      />

      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <ItemArt slug={slug} className="size-9 shrink-0" style={{ color }} />
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

      {points.length ? (
        <section className="mt-8">
          <h2 className="font-display mb-3 text-lg font-bold tracking-tight">
            Month by month in {year}
          </h2>
          <Suspense fallback={<Skeleton className="h-72 w-full" />}>
            <MonthDashboard
              slug={slug}
              year={year}
              unit={item.unit}
              color={color}
              baseYear={baseYear}
              points={points}
            />
          </Suspense>

          <ul className="ruled mt-3 grid grid-cols-3 gap-px border sm:grid-cols-6 lg:grid-cols-12">
            {points.map((point) => (
              <li key={point.month} className="bg-border">
                <Link
                  href={`/costs/${slug}/${year}/${String(point.month).padStart(2, "0")}`}
                  className="bg-card hover:bg-accent flex h-full flex-col gap-1 px-2.5 py-2 transition-colors"
                >
                  <span className="text-muted-foreground text-xs">{point.short}</span>
                  <span className="tnum font-mono text-sm font-semibold">
                    {formatUsd(point.nominal)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
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
                  <ItemArt slug={other.slug} className="size-5 opacity-40" />
                  {other.label} — no data
                </span>
              ) : (
                <Link
                  href={`/costs/${other.slug}/${year}`}
                  className="bg-card hover:bg-accent flex h-full items-center gap-2.5 px-3 py-2.5 transition-colors"
                >
                  <ItemArt
                    slug={other.slug}
                    className="size-5"
                    style={{ color: colorFor(other.slug) }}
                  />
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

import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react"

import { convert, formatUsd } from "@workspace/core"

import { ItemArt } from "@/components/item-art"
import { ItemChart, type ChartReading } from "@/components/item-chart"
import { Crumbs, Shell, Stat, StatRail } from "@/components/page-shell"
import { getAnnual, getCpiTable, getItem, getItems, getMonthly, getMonthlySeries, getPriceKeys } from "@/lib/data"
import { hasMonthTier } from "@/lib/coverage"
import { colorFor } from "@/lib/series"
import { monthName, pageMetadata } from "@/lib/site"

export const dynamicParams = false

const pad = (month: number) => String(month).padStart(2, "0")

export async function generateStaticParams() {
  // Exactly the readings that exist. October 2025 was never collected, so it
  // never becomes a URL rather than becoming one that renders an empty page.
  const keys = await getPriceKeys()
  return keys
    .filter((key) => hasMonthTier(key.slug))
    .map((key) => ({ item: key.slug, year: String(key.year), month: pad(key.month) }))
}

async function load(slug: string, yearParam: string, monthParam: string) {
  const year = Number(yearParam)
  const month = Number(monthParam)
  const [item, keys] = await Promise.all([getItem(slug), getPriceKeys()])
  if (!item) return null

  const own = keys.filter((k) => k.slug === slug)
  const index = own.findIndex((k) => k.year === year && k.month === month)
  if (index === -1) return null

  const inYear = await getMonthly(slug, year)
  const value = inYear.find((m) => m.month === month)?.value
  if (value === undefined) return null

  return { item, year, month, value, inYear, previous: own[index - 1], next: own[index + 1] }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ item: string; year: string; month: string }>
}) {
  const { item, year, month } = await params
  const data = await load(item, year, month)
  if (!data) return {}
  const table = await getCpiTable()

  const period = `${monthName(data.month)} ${data.year}`
  return pageMetadata({
    title: `How much did ${data.item.label} cost in ${period}?`,
    // See the year page — the figure is deliberately withheld from the snippet.
    description: `The BLS average price for ${data.item.label} in ${period}, ${data.item.unit}, converted to ${table.latestYear} dollars with that month's own CPI reading and set against the rest of ${data.year}.`,
    path: `/costs/${data.item.slug}/${data.year}/${pad(data.month)}`,
  })
}

export default async function Page({
  params,
}: {
  params: Promise<{ item: string; year: string; month: string }>
}) {
  const { item: slug, year: yearParam, month: monthParam } = await params
  const data = await load(slug, yearParam, monthParam)
  if (!data) notFound()

  const { item, year, month, value, inYear, previous, next } = data
  const [table, items, keys, allYears, allMonths] = await Promise.all([
    getCpiTable(),
    getItems(),
    getPriceKeys(),
    getAnnual(slug),
    getMonthlySeries(slug),
  ])

  const baseYear = table.latestYear
  const color = colorFor(slug)
  const period = `${monthName(month)} ${year}`

  // Deflate a monthly price with the monthly index. The Rails app used the
  // annual average here, which put a March price through a whole-year CPI.
  const monthlyCpi = table.has(year, month)
  const adjusted = monthlyCpi
    ? convert(table, { amount: value, from: { year, month }, to: { year: baseYear } }).converted
    : table.has(year)
      ? convert(table, { amount: value, from: { year }, to: { year: baseYear } }).converted
      : null

  const yearMean = inYear.reduce((sum, m) => sum + m.value, 0) / inYear.length
  const vsYear = (value / yearMean - 1) * 100
  const priorMonth = previous?.year === year || previous ? previous : undefined
  const priorValue =
    priorMonth && priorMonth.year === year
      ? inYear.find((m) => m.month === priorMonth.month)?.value
      : undefined
  const mom = priorValue ? (value / priorValue - 1) * 100 : null

  // Only link to sibling months that actually exist — with `dynamicParams`
  // off, a link to a missing reading is a link to a 404.
  const siblings = items.filter(
    (other) =>
      other.slug !== slug &&
      keys.some((k) => k.slug === other.slug && k.year === year && k.month === month),
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
          { label: item.label, href: `/costs/${slug}` },
          { label: String(year), href: `/costs/${slug}/${year}` },
          { label: monthName(month) },
        ]}
      />

      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <ItemArt slug={slug} className="size-9 shrink-0" style={{ color }} />
        <h1 className="font-display text-2xl leading-none font-extrabold tracking-tight sm:text-3xl">
          How much did {item.label} cost in {period}?
        </h1>
        <p className="text-muted-foreground text-eyebrow w-full uppercase sm:w-auto">
          {item.unit} · BLS average price
        </p>
      </div>

      <StatRail>
        <Stat label={`Price in ${period}`} value={formatUsd(value)} note={item.unit} />
        <Stat
          label={`In ${baseYear} dollars`}
          value={adjusted == null ? "—" : formatUsd(adjusted)}
          note={
            adjusted == null
              ? "No CPI covers this month"
              : monthlyCpi
                ? `Converted with the CPI-U reading for ${period} itself`
                : `CPI for ${period} was never published — ${year} annual average used`
          }
        />
        <Stat
          label="Month on month"
          value={mom == null ? "—" : `${mom >= 0 ? "+" : ""}${mom.toFixed(1)}%`}
          tone={mom == null ? undefined : mom >= 0 ? "up" : "down"}
          note={priorValue ? `vs ${formatUsd(priorValue)} the month before` : "No prior month"}
        />
        <Stat
          label={`Against the ${year} average`}
          value={`${vsYear >= 0 ? "+" : ""}${vsYear.toFixed(1)}%`}
          tone={vsYear >= 0 ? "up" : "down"}
          note={`${year} averaged ${formatUsd(yearMean)} over ${inYear.length} months`}
        />
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
          focus={{ year, month }}
        />
      </div>

      <nav className="mt-3 flex items-center justify-between gap-3">
        {previous ? (
          <Neighbour href={`/costs/${slug}/${previous.year}/${pad(previous.month)}`} back>
            {monthName(previous.month).slice(0, 3)} {previous.year}
          </Neighbour>
        ) : (
          <span />
        )}
        <Link
          href={`/costs/${slug}/${year}`}
          className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-4"
        >
          All of {year}
        </Link>
        {next ? (
          <Neighbour href={`/costs/${slug}/${next.year}/${pad(next.month)}`}>
            {monthName(next.month).slice(0, 3)} {next.year}
          </Neighbour>
        ) : (
          <span />
        )}
      </nav>

      <section className="mt-8">
        <h2 className="font-display mb-3 text-lg font-bold tracking-tight">
          The rest of {year}
        </h2>
        <ul className="ruled grid grid-cols-3 gap-px border sm:grid-cols-6 lg:grid-cols-12">
          {inYear.map((m) => (
            <li key={m.month} className="bg-border">
              <Link
                href={`/costs/${slug}/${year}/${pad(m.month)}`}
                aria-current={m.month === month ? "page" : undefined}
                className={`flex h-full flex-col gap-1 px-2.5 py-2 transition-colors ${
                  m.month === month
                    ? "bg-primary text-primary-foreground"
                    : "bg-card hover:bg-accent"
                }`}
              >
                <span className="text-xs opacity-70">{monthName(m.month).slice(0, 3)}</span>
                <span className="tnum font-mono text-sm font-semibold">{formatUsd(m.value)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {siblings.length ? (
        <section className="mt-8">
          <h2 className="font-display mb-3 text-lg font-bold tracking-tight">
            Other prices that month
          </h2>
          <ul className="ruled grid gap-px border sm:grid-cols-2 lg:grid-cols-4">
            {siblings.map((other) => (
              <li key={other.slug} className="bg-border">
                <Link
                  href={`/costs/${other.slug}/${year}/${pad(month)}`}
                  className="bg-card hover:bg-accent flex h-full items-center gap-2.5 px-3 py-2.5 transition-colors"
                >
                  <ItemArt
                    slug={other.slug}
                    className="size-5"
                    style={{ color: colorFor(other.slug) }}
                  />
                  <span className="text-sm font-medium">{other.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
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

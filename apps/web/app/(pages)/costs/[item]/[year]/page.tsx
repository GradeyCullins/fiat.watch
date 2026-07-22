import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react"

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

  const related = await Promise.all(
    items
      .filter((other) => other.slug !== slug)
      .map(async (other) => ({
        other,
        value: (await getAnnual(other.slug)).find((r) => r.year === year)?.value ?? null,
      })),
  )

  const points: SeriesPoint[] = months.map((m) => ({
    x: monthName(m.month).slice(0, 3),
    nominal: m.value,
    // Month pages on the old site deflated a March price with the *annual*
    // index. With monthly CPI now stored, the right deflator is available.
    adjusted: table.has(year, m.month)
      ? convert(table, {
          amount: m.value,
          from: { year, month: m.month },
          to: { year: baseYear },
        }).converted
      : null,
  }))

  return (
    <Shell>
      <Crumbs
        trail={[
          { label: "Fiat Watch", href: "/" },
          { label: item.label, href: `/costs/${slug}` },
          { label: String(year) },
        ]}
      />

      <div className="mb-8 flex items-start gap-4">
        <ItemArt slug={slug} className="size-12 shrink-0 sm:size-16" style={{ color }} />
        <PageTitle eyebrow={`${item.unit} · BLS average price`}>
          How much did {item.label} cost in {year}?
        </PageTitle>
      </div>

      <div className="ruled bg-card brutal-6 grid border-2 sm:grid-cols-2">
        <Figure label={`Price in ${year}`} value={formatUsd(row.value)} note={item.unit} />
        <Figure
          label={`In ${baseYear} dollars`}
          value={adjusted == null ? "—" : formatUsd(adjusted)}
          note={
            adjusted == null
              ? "No CPI reading for this year"
              : `${((adjusted / row.value - 1) * 100).toFixed(0)}% more than the price of the day`
          }
          className="ruled border-t-2 sm:border-t-0 sm:border-l-2"
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        {previous ? (
          <NeighbourLink href={`/costs/${slug}/${previous.year}`} direction="back">
            {previous.year} · {formatUsd(previous.value)}
          </NeighbourLink>
        ) : (
          <span />
        )}
        {next ? (
          <NeighbourLink href={`/costs/${slug}/${next.year}`} direction="forward">
            {next.year} · {formatUsd(next.value)}
          </NeighbourLink>
        ) : (
          <span />
        )}
      </div>

      {points.length ? (
        <Section title={`Month by month in ${year}`}>
          <SeriesChart
            points={points}
            label={item.label}
            unit={item.unit}
            color={color}
            baseYear={baseYear}
          />

          <div className="ruled mt-4 overflow-x-auto border-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">In {baseYear} dollars</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {months.map((m, i) => (
                  <TableRow key={m.month}>
                    <TableCell>
                      <Link
                        href={`/costs/${slug}/${year}/${String(m.month).padStart(2, "0")}`}
                        className="font-bold underline-offset-4 hover:underline"
                      >
                        {monthName(m.month)}
                      </Link>
                    </TableCell>
                    <TableCell className="tnum text-right font-mono">
                      {formatUsd(m.value)}
                    </TableCell>
                    <TableCell className="tnum text-muted-foreground text-right font-mono">
                      {points[i]?.adjusted == null ? "—" : formatUsd(points[i]!.adjusted!)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {months.length < 12 ? (
            <p className="text-muted-foreground mt-3 text-xs">
              BLS published {months.length} of 12 months for {year}. The annual figure above is the
              mean of those {months.length}.
            </p>
          ) : null}
        </Section>
      ) : null}

      <Section title={`Everything else in ${year}`}>
        <ul className="ruled grid border-2 sm:grid-cols-2">
          {related.map(({ other, value }) => (
            <li key={other.slug} className="ruled border-b-2 last:border-b-0 sm:even:border-l-2">
              {value == null ? (
                <span className="text-muted-foreground flex items-center gap-3 p-4 text-sm">
                  <ItemArt slug={other.slug} className="size-6 opacity-40" />
                  {other.label} — no data for {year}
                </span>
              ) : (
                <Link
                  href={`/costs/${other.slug}/${year}`}
                  className="hover:bg-accent flex items-center gap-3 p-4 transition-colors"
                >
                  <ItemArt
                    slug={other.slug}
                    className="size-6"
                    style={{ color: colorFor(other.slug) }}
                  />
                  <span className="font-display font-bold">{other.label}</span>
                  <span className="tnum ml-auto font-mono">{formatUsd(value)}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </Section>
    </Shell>
  )
}

function Figure({
  label,
  value,
  note,
  className,
}: {
  label: string
  value: string
  note?: string
  className?: string
}) {
  return (
    <div className={className ? `p-5 sm:p-7 ${className}` : "p-5 sm:p-7"}>
      <p className="text-eyebrow text-muted-foreground uppercase">{label}</p>
      <p className="font-display tnum text-figure mt-2">{value}</p>
      {note ? <p className="text-muted-foreground mt-2 text-sm">{note}</p> : null}
    </div>
  )
}

function NeighbourLink({
  href,
  direction,
  children,
}: {
  href: string
  direction: "back" | "forward"
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="ruled hover:bg-accent tnum flex items-center gap-2 border-2 px-3 py-1.5 font-mono text-sm transition-colors"
    >
      {direction === "back" ? <ArrowLeftIcon className="size-3.5" /> : null}
      {children}
      {direction === "forward" ? <ArrowRightIcon className="size-3.5" /> : null}
    </Link>
  )
}

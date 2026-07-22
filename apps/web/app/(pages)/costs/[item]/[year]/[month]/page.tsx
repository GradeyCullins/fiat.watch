import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react"

import { convert, formatUsd } from "@workspace/core"

import { ItemArt } from "@/components/item-art"
import { Crumbs, PageTitle, Section, Shell } from "@/components/page-shell"
import { getCpiTable, getItem, getItems, getMonthly, getPriceKeys } from "@/lib/data"
import { colorFor } from "@/lib/series"
import { monthName, pageMetadata } from "@/lib/site"

export const dynamicParams = false

const pad = (month: number) => String(month).padStart(2, "0")

export async function generateStaticParams() {
  // Exactly the readings that exist. October 2025 was never collected, so it
  // never becomes a URL rather than becoming one that renders an empty page.
  return (await getPriceKeys()).map((key) => ({
    item: key.slug,
    year: String(key.year),
    month: pad(key.month),
  }))
}

async function load(slug: string, yearParam: string, monthParam: string) {
  const year = Number(yearParam)
  const month = Number(monthParam)
  const [item, keys] = await Promise.all([getItem(slug), getPriceKeys()])
  if (!item) return null

  const own = keys.filter((k) => k.slug === slug)
  const index = own.findIndex((k) => k.year === year && k.month === month)
  if (index === -1) return null

  const value = (await getMonthly(slug, year)).find((m) => m.month === month)?.value
  if (value === undefined) return null

  return { item, year, month, value, previous: own[index - 1], next: own[index + 1] }
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
    description: `${data.item.label} cost ${formatUsd(data.value)} ${data.item.unit} in ${period}, based on BLS average price data. See the value in ${table.latestYear} dollars.`,
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

  const { item, year, month, value, previous, next } = data
  const [table, items, keys] = await Promise.all([getCpiTable(), getItems(), getPriceKeys()])

  // Only link to sibling months that actually exist — with `dynamicParams`
  // off, a link to a missing reading is a link to a 404.
  const siblings = items.filter(
    (other) =>
      other.slug !== slug &&
      keys.some((k) => k.slug === other.slug && k.year === year && k.month === month),
  )
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

  return (
    <Shell>
      <Crumbs
        trail={[
          { label: "Fiat Watch", href: "/" },
          { label: item.label, href: `/costs/${slug}` },
          { label: String(year), href: `/costs/${slug}/${year}` },
          { label: monthName(month) },
        ]}
      />

      <div className="mb-8 flex items-start gap-4">
        <ItemArt slug={slug} className="size-12 shrink-0 sm:size-16" style={{ color }} />
        <PageTitle eyebrow={`${item.unit} · BLS average price`}>
          How much did {item.label} cost in {period}?
        </PageTitle>
      </div>

      <div className="ruled bg-card brutal-6 grid border-2 sm:grid-cols-2">
        <div className="p-5 sm:p-7">
          <p className="text-eyebrow text-muted-foreground uppercase">Price in {period}</p>
          <p className="font-display tnum text-figure mt-2">{formatUsd(value)}</p>
          <p className="text-muted-foreground mt-2 text-sm">{item.unit}</p>
        </div>
        <div className="ruled border-t-2 p-5 sm:border-t-0 sm:border-l-2 sm:p-7">
          <p className="text-eyebrow text-muted-foreground uppercase">In {baseYear} dollars</p>
          <p className="font-display tnum text-figure mt-2">
            {adjusted == null ? "—" : formatUsd(adjusted)}
          </p>
          <p className="text-muted-foreground mt-2 text-sm">
            {adjusted == null
              ? "No CPI reading covers this month."
              : monthlyCpi
                ? `Converted with the CPI-U reading for ${period} itself.`
                : `CPI for ${period} was never published — converted with the ${year} annual average instead.`}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        {previous ? (
          <Link
            href={`/costs/${slug}/${previous.year}/${pad(previous.month)}`}
            className="ruled hover:bg-accent flex items-center gap-2 border-2 px-3 py-1.5 text-sm transition-colors"
          >
            <ArrowLeftIcon className="size-3.5" />
            {monthName(previous.month)} {previous.year}
          </Link>
        ) : (
          <span />
        )}
        <Link
          href={`/costs/${slug}/${year}`}
          className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4"
        >
          All of {year}
        </Link>
        {next ? (
          <Link
            href={`/costs/${slug}/${next.year}/${pad(next.month)}`}
            className="ruled hover:bg-accent flex items-center gap-2 border-2 px-3 py-1.5 text-sm transition-colors"
          >
            {monthName(next.month)} {next.year}
            <ArrowRightIcon className="size-3.5" />
          </Link>
        ) : (
          <span />
        )}
      </div>

      {siblings.length ? (
        <Section title="Other prices that month">
          <ul className="ruled grid border-2 sm:grid-cols-2">
            {siblings.map((other) => (
              <li key={other.slug} className="ruled border-b-2 last:border-b-0 sm:even:border-l-2">
                <Link
                  href={`/costs/${other.slug}/${year}/${pad(month)}`}
                  className="hover:bg-accent flex items-center gap-3 p-4 transition-colors"
                >
                  <ItemArt
                    slug={other.slug}
                    className="size-6"
                    style={{ color: colorFor(other.slug) }}
                  />
                  <span className="font-display font-bold">
                    {other.label} in {period}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </Shell>
  )
}

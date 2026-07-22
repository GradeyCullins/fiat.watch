import { Suspense } from "react"
import Link from "next/link"

import { convert, formatUsd } from "@workspace/core"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { InflationCalculator } from "@/components/inflation-calculator"
import { ItemArt } from "@/components/item-art"
import { getAnnualCpiPoints } from "@/lib/cpi"
import { getAnnual, getCpiTable, getItems } from "@/lib/data"
import { colorFor } from "@/lib/series"
import { jsonLd, pageMetadata, SITE } from "@/lib/site"

export const metadata = pageMetadata({
  // No " | Fiat Watch" suffix here — the root layout's title template adds it.
  title: "US Inflation Calculator With CPI Data",
  description:
    "Find out what your money was really worth. Convert any US dollar amount between any two years from 1913 to today using official BLS CPI data.",
  path: "/",
})

/**
 * The home page is about the dollar, not about the five items.
 *
 * It was briefly a five-series comparison chart, which reads well at five
 * items and collapses at fifty. Choosing an item is a step the visitor takes
 * *after* the premise lands, and it takes them to `/costs/[item]` — a real URL
 * — rather than toggling a series on a chart nobody can link to.
 *
 * The calculator lives here rather than at `/calculator`, which was a second
 * URL for a question this page already answers.
 */
export default async function Page() {
  const [points, table, items] = await Promise.all([
    getAnnualCpiPoints(),
    getCpiTable(),
    getItems(),
  ])

  const earliest = table.earliestYear
  const baseYear = table.latestYear

  // What a dollar from the first year of the index is worth now — the number
  // the whole site exists to make concrete.
  const dollarNow = convert(table, {
    amount: 1,
    from: { year: earliest },
    to: { year: baseYear },
  }).converted
  const cents = (1 / dollarNow) * 100

  const picker = await Promise.all(
    items.map(async (item) => ({
      item,
      latest: (await getAnnual(item.slug)).at(-1)?.value ?? 0,
    })),
  )

  return (
    <main className="mx-auto w-full max-w-[1800px] px-4 py-8 sm:px-6 sm:py-10 xl:px-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd({
          "@type": "WebApplication",
          name: SITE.name,
          applicationCategory: "FinanceApplication",
          operatingSystem: "Any",
          url: SITE.url.toString(),
          description:
            "Convert US dollar amounts between any two years using official BLS CPI-U data.",
          offers: { "@type": "Offer", price: 0, priceCurrency: "USD" },
        })}
      />

      <div className="mb-6 max-w-3xl">
        <p className="text-eyebrow text-muted-foreground uppercase">
          CPI-U · {earliest}–{baseYear} · Bureau of Labor Statistics
        </p>
        <h1 className="font-display text-display mt-3 text-balance">
          A {earliest} dollar buys{" "}
          <span className="text-primary tnum">{cents.toFixed(0)}¢</span> of what it did.
        </h1>
        <p className="text-muted-foreground mt-4 max-w-2xl text-base text-pretty">
          The same fact the other way round: it takes{" "}
          <strong className="text-foreground tnum font-mono">{formatUsd(dollarNow)}</strong> today
          to buy what one dollar bought in {earliest}. Put your own number in.
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-[34rem] w-full" />}>
        <InflationCalculator
          animate
          points={points}
          defaults={{ amount: 1, from: earliest, to: baseYear }}
        />
      </Suspense>

      {/*
        The second step, and it is a step: pick a thing, land on its own URL.
        This grid is the entry point to the whole `/costs` tree, and it scales
        by growing rows rather than by adding lines to a chart.
      */}
      <section className="mt-10">
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <h2 className="font-display text-lg font-bold tracking-tight">
            Or start from something real
          </h2>
          <p className="text-muted-foreground hidden text-xs sm:block">
            Prices BLS actually recorded, not the index
          </p>
        </div>

        <ul className="ruled grid gap-px border sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {picker.map(({ item, latest }) => (
            <li key={item.slug} className="bg-border">
              <Link
                href={`/costs/${item.slug}`}
                className="bg-card hover:bg-accent flex h-full flex-col gap-3 p-4 transition-colors"
              >
                <ItemArt
                  slug={item.slug}
                  className="size-8"
                  style={{ color: colorFor(item.slug) }}
                />
                <span>
                  <span className="font-display block font-bold">{item.label}</span>
                  <span className="text-muted-foreground text-xs">
                    {item.unit} · {item.firstYear}–{item.lastYear}
                  </span>
                </span>
                <span className="tnum mt-auto font-mono text-lg font-bold">
                  {formatUsd(latest)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}

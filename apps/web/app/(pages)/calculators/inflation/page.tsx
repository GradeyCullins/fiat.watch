import { Suspense } from "react"

import { convert, formatUsd } from "@workspace/core"

import { CalculatorStatic } from "@/components/calculator-static"
import { DataSource } from "@/components/data-source"
import { InflationCalculator } from "@/components/inflation-calculator"
import { Crumbs, Shell } from "@/components/page-shell"
import { getAnnualCpiPoints } from "@/lib/cpi"
import { getCpiTable } from "@/lib/data"
import { CPI_SERIES } from "@/lib/calculators"
import { jsonLd, pageMetadata, SITE } from "@/lib/site"

/*
 * The general dollar converter, moved off `/`.
 *
 * It lived on the home page, which made `/` simultaneously the front door and
 * the eighth calculator while the other seven sat in a section that did not
 * contain it. Moving it costs something real — `/` is the URL that earns the
 * impressions, and this title moves with the tool — but leaving it meant the
 * home page could never become anything other than this page.
 */
export const metadata = pageMetadata({
  title: "US Inflation Calculator With CPI Data",
  description:
    "Find out what your money was really worth. Convert any US dollar amount between any two years from 1913 to today using official BLS CPI data.",
  path: "/calculators/inflation",
})

export default async function Page() {
  const [points, table] = await Promise.all([getAnnualCpiPoints(), getCpiTable()])
  const earliest = table.earliestYear
  const baseYear = table.latestYear

  const dollarNow = convert(table, {
    amount: 1,
    from: { year: earliest },
    to: { year: baseYear },
  }).converted

  return (
    <Shell className="py-6 sm:py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd({
          "@type": "WebApplication",
          name: "US Inflation Calculator",
          applicationCategory: "FinanceApplication",
          operatingSystem: "Any",
          url: new URL("/calculators/inflation", SITE.url).toString(),
          description:
            "Convert US dollar amounts between any two years using official BLS CPI-U data.",
          offers: { "@type": "Offer", price: 0, priceCurrency: "USD" },
        })}
      />

      <Crumbs
        trail={[
          { label: "Fiat Watch", href: "/" },
          { label: "Calculators", href: "/calculators" },
          { label: "Inflation" },
        ]}
      />

      <div className="mb-5">
        <h1 className="font-display text-headline">Inflation calculator</h1>
        <p className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-1.5 text-sm">
          <span>
            Any amount, any two years from {earliest} to {baseYear}. One {earliest} dollar takes{" "}
            <strong className="text-foreground tnum font-mono">{formatUsd(dollarNow)}</strong> to
            match today.
          </span>
          <DataSource survey="cpi" seriesId={CPI_SERIES} basePeriod="1982-84 = 100" />
        </p>
      </div>

      <Suspense
        fallback={
          <CalculatorStatic
            points={points}
            defaults={{ amount: 1, from: earliest, to: baseYear }}
          />
        }
      >
        <InflationCalculator
          animate
          points={points}
          defaults={{ amount: 1, from: earliest, to: baseYear }}
        />
      </Suspense>
    </Shell>
  )
}

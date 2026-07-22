import { Suspense } from "react"
import Link from "next/link"

import { Skeleton } from "@workspace/ui/components/skeleton"

import { InflationCalculator } from "@/components/inflation-calculator"
import { ItemArt } from "@/components/item-art"
import { Crumbs, Shell } from "@/components/page-shell"
import { CALCULATORS } from "@/lib/calculators"
import { defaultFromYear, getAnnualCpiPoints } from "@/lib/cpi"
import { getItems } from "@/lib/data"
import { colorFor } from "@/lib/series"
import { pageMetadata } from "@/lib/site"

export const metadata = pageMetadata({
  title: "US Inflation Calculator With CPI Data",
  description:
    "Convert any US dollar amount between any two years using official BLS CPI-U data. See the equivalent value, the percentage change, and the whole curve.",
  path: "/calculator",
})

export default async function Page() {
  const [points, items] = await Promise.all([getAnnualCpiPoints(), getItems()])
  const latest = points.at(-1)?.year ?? new Date().getUTCFullYear()

  return (
    <Shell className="py-6 sm:py-8">
      <Crumbs trail={[{ label: "Fiat Watch", href: "/" }, { label: "Inflation calculator" }]} />

      <div className="mb-4">
        <h1 className="font-display text-2xl leading-none font-extrabold tracking-tight sm:text-3xl">
          What is a dollar actually worth?
        </h1>
        <p className="text-muted-foreground mt-2.5 max-w-2xl text-sm text-pretty">
          CPI-U, all items, not seasonally adjusted, back to 1913. The raw index ratio between two
          years — no smoothing, no rounding until the last step.
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-[32rem] w-full" />}>
        <InflationCalculator points={points} defaults={{ amount: 100, from: defaultFromYear(points), to: latest }} />
      </Suspense>

      <section className="mt-8">
        <h2 className="font-display mb-3 text-lg font-bold tracking-tight">By what you compare</h2>
        <ul className="ruled grid gap-px border sm:grid-cols-2 lg:grid-cols-4">
          {CALCULATORS.map((c) => (
            <li key={c.slug} className="bg-border">
              <Link
                href={c.path}
                className="bg-card hover:bg-accent block h-full px-3 py-2.5 text-sm font-medium transition-colors"
              >
                {c.heading.replace(" inflation calculator", "")}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-display mb-3 text-lg font-bold tracking-tight">
          Or start from a real price
        </h2>
        <ul className="ruled grid gap-px border sm:grid-cols-2 lg:grid-cols-5">
          {items.map((item) => (
            <li key={item.slug} className="bg-border">
              <Link
                href={`/costs/${item.slug}`}
                className="bg-card hover:bg-accent flex h-full items-center gap-2.5 px-3 py-2.5 transition-colors"
              >
                <ItemArt
                  slug={item.slug}
                  className="size-5"
                  style={{ color: colorFor(item.slug) }}
                />
                <span className="text-sm font-medium">{item.label}</span>
                <span className="text-muted-foreground tnum ml-auto font-mono text-xs">
                  {item.firstYear}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </Shell>
  )
}

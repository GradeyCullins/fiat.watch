import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { formatUsd } from "@workspace/core"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { InflationCalculator } from "@/components/inflation-calculator"
import { ItemArt } from "@/components/item-art"
import { Crumbs, Shell } from "@/components/page-shell"
import { CALCULATORS, type CalculatorPage } from "@/lib/calculators"
import { getAnnualCpiPoints } from "@/lib/cpi"
import { getAnnual, getItems } from "@/lib/data"
import { colorFor } from "@/lib/series"
import { pageMetadata } from "@/lib/site"

/** Only these seven slugs exist; anything else is a static 404. */
export const dynamicParams = false

export function generateStaticParams() {
  return CALCULATORS.map((c) => ({ vertical: c.path.slice(1) }))
}

const find = (vertical: string): CalculatorPage | null =>
  CALCULATORS.find((c) => c.path === `/${vertical}`) ?? null

export async function generateMetadata({ params }: { params: Promise<{ vertical: string }> }) {
  const page = find((await params).vertical)
  if (!page) return {}
  return pageMetadata({ title: page.title, description: page.description, path: page.path })
}

export default async function Page({ params }: { params: Promise<{ vertical: string }> }) {
  const page = find((await params).vertical)
  if (!page) notFound()

  const [points, items] = await Promise.all([getAnnualCpiPoints(), getItems()])
  const latest = points.at(-1)?.year ?? new Date().getUTCFullYear()
  const first = page.examples[0]!

  const related = await Promise.all(
    items
      .filter((item) => page.costItems.includes(item.slug))
      .map(async (item) => ({ item, price: (await getAnnual(item.slug)).at(-1)?.value ?? 0 })),
  )

  const others = CALCULATORS.filter((c) => c.slug !== page.slug)

  return (
    <Shell className="py-6 sm:py-8">
      <Crumbs
        trail={[
          { label: "Fiat Watch", href: "/" },
          { label: "Calculators", href: "/calculator" },
          { label: page.heading },
        ]}
      />

      <div className="mb-4">
        <h1 className="font-display text-2xl leading-none font-extrabold tracking-tight sm:text-3xl">
          {page.heading}
        </h1>
        <p className="text-muted-foreground mt-2.5 max-w-2xl text-sm text-pretty">{page.intro}</p>
      </div>

      <Suspense fallback={<Skeleton className="h-[32rem] w-full" />}>
        <InflationCalculator
          points={points}
          noun={page.noun}
          defaults={{ amount: first.amount, from: first.year, to: latest }}
        />
      </Suspense>

      {/* Deep links, not decoration: each chip loads the tool with those
          numbers already in it. On the old site all three linked to the
          identical URL and the page had no calculator on it at all. */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="text-eyebrow text-muted-foreground mr-1 uppercase">Try</span>
        {page.examples.map((example) => (
          <Link
            key={`${example.amount}-${example.year}`}
            href={`${page.path}?amount=${example.amount}&from=${example.year}&to=${latest}`}
            className="ruled hover:bg-primary hover:text-primary-foreground tnum border px-2 py-1 font-mono text-xs transition-colors"
          >
            {formatUsd(example.amount)} in {example.year}
          </Link>
        ))}
      </div>

      {related.length ? (
        <section className="mt-8">
          <h2 className="font-display mb-3 text-lg font-bold tracking-tight">
            Actual prices, not just the index
          </h2>
          <ul className="ruled grid gap-px border sm:grid-cols-2 lg:grid-cols-4">
            {related.map(({ item, price }) => (
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
                  <span className="tnum ml-auto font-mono text-sm font-semibold">
                    {formatUsd(price)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="font-display mb-3 text-lg font-bold tracking-tight">Other calculators</h2>
        <ul className="ruled grid gap-px border sm:grid-cols-2 lg:grid-cols-4">
          <li className="bg-border">
            <Link
              href="/calculator"
              className="bg-card hover:bg-accent block h-full px-3 py-2.5 text-sm font-medium transition-colors"
            >
              Any amount
            </Link>
          </li>
          {others.map((other) => (
            <li key={other.slug} className="bg-border">
              <Link
                href={other.path}
                className="bg-card hover:bg-accent block h-full px-3 py-2.5 text-sm font-medium transition-colors"
              >
                {other.heading.replace(" inflation calculator", "")}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </Shell>
  )
}

import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { formatUsd } from "@workspace/core"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { InflationCalculator } from "@/components/inflation-calculator"
import { ItemArt } from "@/components/item-art"
import { Crumbs, Faq, PageTitle, Section, Shell } from "@/components/page-shell"
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
      .map(async (item) => ({ item, latest: (await getAnnual(item.slug)).at(-1)?.value ?? 0 })),
  )

  return (
    <Shell>
      <Crumbs
        trail={[
          { label: "Fiat Watch", href: "/" },
          { label: "Calculators", href: "/calculator" },
          { label: page.heading },
        ]}
      />

      <PageTitle eyebrow="CPI-U · Bureau of Labor Statistics" lede={page.intro}>
        {page.heading}
      </PageTitle>

      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <InflationCalculator
          points={points}
          noun={page.noun}
          defaults={{ amount: first.amount, from: first.year, to: latest }}
        />
      </Suspense>

      {/* Deep links, not decoration: each chip loads the tool with those
          numbers already in it. On the old site all three linked to the
          identical URL and the page had no calculator on it at all. */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="text-eyebrow text-muted-foreground uppercase">Try</span>
        {page.examples.map((example) => (
          <Link
            key={`${example.amount}-${example.year}`}
            href={`${page.path}?amount=${example.amount}&from=${example.year}&to=${latest}`}
            className="ruled hover:bg-primary hover:text-primary-foreground tnum border-2 px-2.5 py-1 font-mono text-sm transition-colors"
          >
            {formatUsd(example.amount)} in {example.year}
          </Link>
        ))}
      </div>

      <Section title="What people use this for">
        <ul className="ruled divide-y-2 border-2">
          {page.useCases.map((useCase) => (
            <li key={useCase} className="p-4 text-sm sm:p-5">
              {useCase}
            </li>
          ))}
        </ul>
      </Section>

      {related.length ? (
        <Section title="Actual prices, not just the index">
          <p className="text-muted-foreground mb-4 max-w-2xl text-sm">
            The calculator above adjusts a dollar amount by the all-items index. These are the
            recorded average prices BLS collected for the goods themselves.
          </p>
          <ul className="ruled grid border-2 sm:grid-cols-2">
            {related.map(({ item, latest: price }) => (
              <li key={item.slug} className="ruled border-b-2 last:border-b-0 sm:even:border-l-2">
                <Link
                  href={`/costs/${item.slug}`}
                  className="hover:bg-accent flex items-center gap-3 p-4 transition-colors"
                >
                  <ItemArt
                    slug={item.slug}
                    className="size-7"
                    style={{ color: colorFor(item.slug) }}
                  />
                  <span className="min-w-0">
                    <span className="font-display block font-bold">
                      Historical {item.labelAttributive} prices
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {item.firstYear}–{item.lastYear} · {item.unit}
                    </span>
                  </span>
                  <span className="tnum ml-auto font-mono font-bold">{formatUsd(price)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title="Questions">
        <Faq items={page.faq} />
      </Section>
    </Shell>
  )
}

import { Suspense } from "react"
import Link from "next/link"

import { Skeleton } from "@workspace/ui/components/skeleton"

import { InflationCalculator } from "@/components/inflation-calculator"
import { Crumbs, Faq, PageTitle, Section, Shell } from "@/components/page-shell"
import { CALCULATORS } from "@/lib/calculators"
import { getAnnualCpiPoints, defaultFromYear } from "@/lib/cpi"
import { pageMetadata } from "@/lib/site"

export const metadata = pageMetadata({
  title: "US Inflation Calculator With CPI Data",
  description:
    "Convert any US dollar amount between any two years using official BLS CPI-U data. See the equivalent value, the percentage change, and the whole curve.",
  path: "/calculator",
})

const FAQ = [
  {
    question: "Which inflation measure does this use?",
    answer:
      "CPI-U, the Consumer Price Index for All Urban Consumers, US city average, all items, not seasonally adjusted. It is the series most commonly meant by “the inflation rate”.",
  },
  {
    question: "How far back does it go?",
    answer:
      "To 1913, the first year the Bureau of Labor Statistics published the index. Anything earlier is a reconstruction by someone else, not a BLS figure.",
  },
  {
    question: "Why is the most recent year marked provisional?",
    answer:
      "An annual average needs twelve monthly readings. Until December is published, the current year's figure is a mean over the months released so far and will move.",
  },
]

export default async function Page() {
  const points = await getAnnualCpiPoints()
  const latest = points.at(-1)?.year ?? new Date().getUTCFullYear()

  return (
    <Shell>
      <Crumbs trail={[{ label: "Fiat Watch", href: "/" }, { label: "Inflation calculator" }]} />

      <PageTitle
        eyebrow="CPI-U · Bureau of Labor Statistics"
        lede="Every figure here is the raw index ratio between two years — no smoothing, no seasonal adjustment, no rounding until the last step."
      >
        What is a dollar actually worth?
      </PageTitle>

      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <InflationCalculator
          points={points}
          defaults={{ amount: 100, from: defaultFromYear(points), to: latest }}
        />
      </Suspense>

      <Section title="By what you are comparing">
        <ul className="ruled grid gap-0 border-2 sm:grid-cols-2">
          {CALCULATORS.map((c) => (
            <li key={c.slug} className="ruled border-b-2 last:border-b-0 sm:[&:nth-last-child(-n+1)]:border-b-0">
              <Link
                href={c.path}
                className="hover:bg-accent flex h-full flex-col gap-1 p-4 transition-colors"
              >
                <span className="font-display font-bold">{c.heading}</span>
                <span className="text-muted-foreground text-sm">{c.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Questions">
        <Faq items={FAQ} />
      </Section>
    </Shell>
  )
}

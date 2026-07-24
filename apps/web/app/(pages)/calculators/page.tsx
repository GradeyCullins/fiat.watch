import Link from "next/link"

import { Crumbs, Shell } from "@/components/page-shell"
import { CALCULATORS, calculatorPath, GENERAL_CALCULATOR } from "@/lib/calculators"
import { pageMetadata } from "@/lib/site"

export const metadata = pageMetadata({
  title: "Inflation calculators",
  description:
    "Eight calculators built on official BLS CPI data — salary, rent, groceries, gas, car prices, college tuition and the minimum wage, plus the general dollar converter.",
  path: "/calculators",
})

/**
 * The section index.
 *
 * It exists because `/calculators/gas` implies `/calculators`, and a segment
 * that 404s is a broken promise to anyone who trims the URL — and to a crawler
 * walking up the path. It is also the page the nav dropdown and the footer
 * would otherwise have to enumerate.
 */
export default function Page() {
  return (
    <Shell className="py-6 sm:py-8">
      <Crumbs trail={[{ label: "Fiat Watch", href: "/" }, { label: "Calculators" }]} />

      <div className="mb-6 max-w-2xl">
        <h1 className="font-display text-headline">Inflation calculators</h1>
        <p className="text-muted-foreground mt-3 text-pretty">
          The same CPI-U maths, framed around the thing you are actually asking about. Every one
          converts between any two years from 1913 to today.
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        <li>
          <Link
            href={GENERAL_CALCULATOR.path}
            className="bg-card float-1 hover:float-2 hover:border-primary/40 block h-full rounded-2xl border p-4 transition-all hover:-translate-y-1"
          >
            <p className="flex items-center gap-2 font-semibold">
              <span aria-hidden className="text-xl leading-none">
                {GENERAL_CALCULATOR.emoji}
              </span>
              {GENERAL_CALCULATOR.label}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {GENERAL_CALCULATOR.blurb}
            </p>
          </Link>
        </li>

        {CALCULATORS.map((c) => (
          <li key={c.slug}>
            <Link
              href={calculatorPath(c.slug)}
              className="bg-card float-1 hover:float-2 hover:border-primary/40 block h-full rounded-2xl border p-4 transition-all hover:-translate-y-1"
            >
              <p className="flex items-center gap-2 font-semibold">
                <span aria-hidden className="text-xl leading-none">
                  {c.emoji}
                </span>
                {c.heading}
              </p>
              <p className="text-muted-foreground mt-1 text-sm">{c.intro}</p>
            </Link>
          </li>
        ))}
      </ul>
    </Shell>
  )
}

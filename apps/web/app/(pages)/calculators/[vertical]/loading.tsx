import { Skeleton } from "@workspace/ui/components/skeleton"

import { Shell, StatRail } from "@/components/page-shell"

/**
 * Mirrors /calculators/[vertical]: breadcrumb, heading block, the calculator
 * panel, the "Try" chips, then the other-calculators grid.
 *
 * The panel mirrors `CalculatorStatic` — the Suspense fallback is what lands in
 * the HTML, so the chart that `InflationCalculator` adds on hydration is not
 * part of first paint and is not drawn here.
 *
 * Approximated: the intro is two lines and the heading one, which holds for all
 * seven verticals down to a narrow phone; chip and label widths are averages of
 * the real strings. The "Actual prices" section is left out — five of the seven
 * verticals have no cost items, so drawing it would be wrong more often than
 * right; on groceries and gas it appears below this skeleton's last section.
 */
export default function Loading() {
  return (
    <Shell className="py-6 sm:py-8">
      <Skeleton className="mb-4 h-3 w-48" />

      <div className="mb-4 max-w-2xl">
        <Skeleton className="h-6 w-72 max-w-full sm:h-[1.875rem]" />
        <div className="mt-2.5 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>

      <div className="flex flex-col">
        <div className="ruled bg-card rounded-t-2xl border p-4 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
            <div>
              <Skeleton className="mb-2 h-3 w-24" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-2.5" />
                <Skeleton className="h-11 w-40 rounded-lg" />
              </div>
            </div>
            <div className="flex flex-col items-end">
              <Skeleton className="mb-2 h-3 w-28" />
              <Skeleton className="h-[clamp(2.75rem,7vw,5.5rem)] w-56 max-w-full" />
            </div>
          </div>

          <div className="mt-7">
            <div className="mb-2 flex items-baseline justify-between">
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-10" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-none" />
          </div>
        </div>

        <StatRail>
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="ruled border-b px-4 py-3 last:border-b-0 sm:border-r sm:[&:nth-child(2n)]:border-r-0 lg:border-r lg:border-b-0 lg:[&:nth-child(2n)]:border-r lg:last:border-r-0"
            >
              <Skeleton className="h-3 w-16" />
              <Skeleton className="mt-1.5 h-6 w-24" />
              <Skeleton className="mt-1.5 h-4 w-32" />
            </div>
          ))}
        </StatRail>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Skeleton className="mr-1 h-3 w-6" />
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-[1.625rem] w-28 rounded-md" />
        ))}
      </div>

      <section className="mt-8">
        <div className="mb-3 flex h-7 items-center">
          <Skeleton className="h-5 w-44" />
        </div>
        <ul className="ruled grid gap-px overflow-hidden rounded-xl border sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 7 }, (_, i) => (
            <li key={i} className="bg-border">
              <div className="bg-card h-full px-3 py-2.5">
                <Skeleton className="h-5 w-28" />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </Shell>
  )
}

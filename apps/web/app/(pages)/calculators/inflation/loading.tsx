import { Skeleton } from "@workspace/ui/components/skeleton"

import { Shell } from "@/components/page-shell"

/**
 * Mirrors /calculators/inflation: breadcrumb strip, heading block, then the
 * calculator panel — amount box and the big result, the three-across stat row,
 * and the chart.
 *
 * Approximated: the intro line is one row plus the ⓘ trigger, which is what it
 * is from `sm` up and understates the wrap on a narrow phone; each stat note is
 * a single line, though the "Multiple" note runs to two in a one-column layout.
 * `StatRail` is deliberately not reused — the calculator carries its own
 * three-across rail, not the four-across one.
 */
export default function Loading() {
  return (
    <Shell className="py-6 sm:py-8">
      <Skeleton className="mb-4 h-3 w-56" />

      <div className="mb-5">
        <Skeleton className="h-[clamp(1.75rem,3.2vw,2.75rem)] w-72" />
        <div className="mt-2 flex flex-wrap items-center gap-x-1.5">
          <Skeleton className="h-4 w-full max-w-lg" />
          <Skeleton className="size-3.5 rounded-full" />
        </div>
      </div>

      <div className="flex flex-col">
        <div className="ruled bg-card flex flex-wrap items-end justify-between gap-x-6 gap-y-4 rounded-t-2xl border p-4 sm:p-6">
          <div>
            <Skeleton className="mb-2 h-3 w-28" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-2.5" />
              <Skeleton className="h-11 w-40 rounded-lg" />
            </div>
          </div>

          <div className="flex flex-col items-end">
            <Skeleton className="mb-2 h-3 w-24" />
            <Skeleton className="h-[calc(clamp(2.75rem,7vw,5.5rem)*0.86)] w-56" />
          </div>
        </div>

        <div className="ruled bg-card/50 grid border-x border-b sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="ruled border-b px-4 py-3 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0"
            >
              <Skeleton className="h-3 w-16" />
              <Skeleton className="mt-1.5 h-5 w-24" />
              <Skeleton className="mt-1.5 h-3 w-11/12" />
            </div>
          ))}
        </div>

        <div className="ruled bg-card h-64 w-full rounded-b-2xl border-x border-b p-2 sm:h-72 sm:p-4">
          <Skeleton className="h-full w-full rounded-lg" />
        </div>
      </div>
    </Shell>
  )
}

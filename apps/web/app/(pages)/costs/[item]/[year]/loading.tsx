import { Card, CardAction, CardContent, CardHeader } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { Shell, StatRail } from "@/components/page-shell"

/**
 * Mirrors `costs/[item]/[year]/page.tsx`: breadcrumb, emoji + heading row,
 * the four-across stat rail, the prev/next nav row, then the chart card.
 *
 * Approximated: the stat cells repeat `Stat`'s own border classes rather than
 * rendering `Stat` (it takes text), and the chart card's header controls are
 * blocks roughly the width of the two segmented groups, the two range selects
 * and the preset buttons — not one skeleton per button.
 */
export default function Loading() {
  return (
    <Shell wide className="py-6 sm:py-8">
      <Skeleton className="mb-4 h-3 w-72" />

      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Skeleton className="size-12 shrink-0 rounded-lg sm:size-15" />
        <Skeleton className="h-6 w-full max-w-lg sm:h-8" />
        <Skeleton className="h-3 w-48 sm:w-56" />
      </div>

      <StatRail>
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="ruled border-b px-4 py-3 last:border-b-0 sm:border-r sm:[&:nth-child(2n)]:border-r-0 lg:border-r lg:border-b-0 lg:[&:nth-child(2n)]:border-r lg:last:border-r-0"
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-1.5 h-6 w-28" />
            <Skeleton className="mt-1.5 h-3 w-32" />
          </div>
        ))}
      </StatRail>

      <div className="mt-3 flex items-center justify-between gap-3">
        <Skeleton className="h-[1.625rem] w-32 rounded-lg" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-[1.625rem] w-32 rounded-lg" />
      </div>

      <div className="mt-3">
        <Card className="float-1 gap-0 overflow-hidden py-0">
          <CardHeader className="ruled border-b px-3 py-2.5 sm:px-4">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-[1.625rem] w-32 rounded-lg" />
              <Skeleton className="h-[1.625rem] w-40 rounded-lg" />
            </div>

            <CardAction className="flex flex-wrap items-center gap-1.5 self-center">
              <Skeleton className="h-8 w-22 rounded-md" />
              <Skeleton className="h-8 w-22 rounded-md" />
              <span aria-hidden className="bg-border mx-1 hidden h-4 w-px sm:block" />
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-6 w-9 rounded-md" />
              ))}
            </CardAction>
          </CardHeader>

          <CardContent className="px-2 py-3 sm:px-4 sm:py-4">
            <Skeleton className="h-[clamp(17rem,40vh,28rem)] w-full rounded-lg" />
            <Skeleton className="mt-2 ml-1 h-3 w-64" />
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}

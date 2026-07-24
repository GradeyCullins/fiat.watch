import { Card, CardAction, CardContent, CardHeader } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { Shell, StatRail } from "@/components/page-shell"

/**
 * Mirrors the month page: crumbs, emoji + heading, four-across stat rail, the
 * chart card, then the prev/next nav.
 *
 * Approximated: the Stat cells are plain divs carrying Stat's own border
 * classes (Stat takes strings, not children); the chart header's range controls
 * stand in for two Selects plus the preset buttons at their real heights; and
 * both neighbour pills are always drawn, where the real page renders an empty
 * span at the ends of a series.
 */
export default function Loading() {
  return (
    <Shell wide className="py-6 sm:py-8">
      <Skeleton className="mb-4 h-3 w-72" />

      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Skeleton className="size-12 shrink-0 rounded-lg sm:size-15" />
        <Skeleton className="h-6 w-full max-w-xl sm:h-7" />
        <Skeleton className="h-3 w-52 sm:w-44" />
      </div>

      <StatRail>
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="ruled border-b px-4 py-3 last:border-b-0 sm:border-r sm:[&:nth-child(2n)]:border-r-0 lg:border-r lg:border-b-0 lg:[&:nth-child(2n)]:border-r lg:last:border-r-0"
          >
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-1.5 h-6 w-24" />
            <Skeleton className="mt-1.5 h-3 w-40" />
          </div>
        ))}
      </StatRail>

      <div className="mt-3">
        <Card className="float-1 gap-0 overflow-hidden py-0">
          <CardHeader className="ruled border-b px-3 py-2.5 sm:px-4">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-6.5 w-32 rounded-lg" />
              <Skeleton className="h-6.5 w-40 rounded-lg" />
            </div>

            <CardAction className="flex flex-wrap items-center gap-1.5 self-center">
              <Skeleton className="hidden h-3 w-8 sm:block" />
              <Skeleton className="h-7 w-[4.5rem] rounded-lg" />
              <Skeleton className="h-7 w-[5.5rem] rounded-lg" />
              <Skeleton className="h-3 w-3" />
              <Skeleton className="hidden h-3 w-5 sm:block" />
              <Skeleton className="h-7 w-[4.5rem] rounded-lg" />
              <Skeleton className="h-7 w-[5.5rem] rounded-lg" />
              <span aria-hidden className="bg-border mx-1 hidden h-4 w-px sm:block" />
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-6.5 w-9" />
              ))}
            </CardAction>
          </CardHeader>

          <CardContent className="px-2 py-3 sm:px-4 sm:py-4">
            <Skeleton className="h-[clamp(17rem,40vh,28rem)] w-full rounded-lg" />
            <Skeleton className="mt-2 ml-1 h-3 w-64" />
          </CardContent>
        </Card>
      </div>

      <nav className="mt-3 flex items-center justify-between gap-3">
        <Skeleton className="h-6.5 w-24 rounded-lg" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6.5 w-24 rounded-lg" />
      </nav>
    </Shell>
  )
}

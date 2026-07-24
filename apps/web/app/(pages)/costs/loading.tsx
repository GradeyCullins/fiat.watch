import { Skeleton } from "@workspace/ui/components/skeleton"

import { CardRail } from "@/components/item-card"
import { Shell } from "@/components/page-shell"

/**
 * Mirrors /costs — the catalogue: crumbs, heading block, then a category
 * section per group, each a heading row plus a CardRail of compact cards.
 *
 * Approximated: the card counts per section (the real ones come from the DB,
 * so these are typical sizes rounded to fill whole rows), and the two stacked
 * text lines inside each card, which are close to but not exactly the label
 * and unit line-heights of ItemCard's compact size.
 */
const SECTIONS = [6, 30, 12, 30, 18, 24]

/** The "No longer tracked" rail at the bottom. */
const RETIRED = 18

function CardSkeleton() {
  return (
    <div className="bg-card float-1 flex flex-col items-center gap-1.5 rounded-2xl border px-3 py-3.5">
      <Skeleton className="size-12 rounded-full" />
      <div className="mt-0.5 w-full space-y-1">
        <Skeleton className="mx-auto h-4 w-4/5" />
        <Skeleton className="mx-auto h-3 w-3/5" />
      </div>
      <Skeleton className="h-5 w-12" />
    </div>
  )
}

function SectionSkeleton({ count, className }: { count: number; className?: string }) {
  return (
    <section className={className}>
      <div className="mb-3 flex items-baseline gap-3">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-3 w-48" />
        <Skeleton className="ml-auto h-3 w-6" />
      </div>
      <CardRail>
        {Array.from({ length: count }, (_, i) => (
          <li key={i}>
            <CardSkeleton />
          </li>
        ))}
      </CardRail>
    </section>
  )
}

export default function Loading() {
  return (
    <Shell wide className="py-6 sm:py-8">
      <Skeleton className="mb-4 h-3 w-40" />

      <div className="mb-8 max-w-2xl">
        <Skeleton className="h-10 w-80" />
        <div className="mt-3 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>

      {SECTIONS.map((count, i) => (
        <SectionSkeleton key={i} count={count} className="mb-10" />
      ))}

      <SectionSkeleton count={RETIRED} className="mt-14" />
    </Shell>
  )
}

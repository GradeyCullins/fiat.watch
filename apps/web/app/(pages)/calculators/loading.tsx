import { Skeleton } from "@workspace/ui/components/skeleton"

import { Shell } from "@/components/page-shell"

/**
 * Mirrors /calculators: breadcrumb strip, heading block, then the eight-card
 * grid.
 *
 * Approximated: every card gets a three-line blurb, because the real blurbs run
 * one to three lines and grid rows stretch to their tallest card anyway. The
 * headline block is one line at every breakpoint, which holds for the real
 * title down to the narrowest phone.
 */
export default function Loading() {
  return (
    <Shell className="py-6 sm:py-8">
      <Skeleton className="mb-4 h-3 w-48" />

      <div className="mb-6 max-w-2xl">
        <Skeleton className="h-[clamp(1.75rem,3.2vw,2.75rem)] w-80" />
        <div className="mt-3 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 8 }, (_, i) => (
          <li key={i} className="bg-card float-1 rounded-2xl border p-4">
            <div className="flex h-6 items-center gap-2">
              <Skeleton className="size-5 rounded-full" />
              <Skeleton className="h-4 w-44" />
            </div>
            <div className="mt-1 space-y-1.5">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </li>
        ))}
      </ul>
    </Shell>
  )
}

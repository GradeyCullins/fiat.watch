import { Skeleton } from "@workspace/ui/components/skeleton"

import { CardRail } from "@/components/item-card"

/**
 * Mirrors the home page (`app/(pages)/page.tsx`): eyebrow, display headline,
 * then the Calculators and Prices shelves. It sits at the route-group level, so
 * any child segment without its own `loading.tsx` inherits it.
 *
 * Approximated: the headline is two bars at 0.86 × `--text-display` (its
 * line-height) rather than the real three-line wrap, which depends on the year
 * range; the `<main>` is written out instead of `Shell` because the home page
 * uses `sm:py-10` and `Shell` hard-codes `sm:py-12`.
 */
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[1800px] px-4 py-8 sm:px-6 sm:py-10 xl:px-10">
      <div className="mb-8 max-w-3xl">
        <Skeleton className="h-3 w-72 max-w-full" />
        <div className="mt-3 space-y-2">
          <Skeleton className="h-[clamp(2.4rem,6vw,4.75rem)] w-full" />
          <Skeleton className="h-[clamp(2.4rem,6vw,4.75rem)] w-2/3" />
        </div>
      </div>

      <ShelfSkeleton cards={8} />
      <ShelfSkeleton cards={12} withValue className="mt-10" />
    </main>
  )
}

/** A shelf: the heading row, then a `CardRail` of card-shaped blocks. */
function ShelfSkeleton({
  cards,
  withValue,
  className,
}: {
  cards: number
  withValue?: boolean
  className?: string
}) {
  return (
    <section className={className}>
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-56 max-w-full" />
        <Skeleton className="ml-auto h-4 w-16" />
      </div>
      <CardRail>
        {Array.from({ length: cards }, (_, i) => (
          <li key={i}>
            <div className="bg-card float-1 flex h-full flex-col items-center gap-2 rounded-2xl border px-4 py-5">
              <Skeleton className="size-16 rounded-xl" />
              <div className="mt-0.5 w-full space-y-1">
                <Skeleton className="mx-auto h-3.5 w-3/4" />
                <Skeleton className="mx-auto h-3 w-1/2" />
              </div>
              {withValue ? <Skeleton className="h-5 w-16" /> : null}
            </div>
          </li>
        ))}
      </CardRail>
    </section>
  )
}

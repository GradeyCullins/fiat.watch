import { Skeleton } from "@workspace/ui/components/skeleton"

import { Shell } from "@/components/page-shell"

/**
 * Mirrors /sitemap — crumbs, heading block, the "Tools" chip row, then one
 * section per tracked item: a heading, a source-link row, and a wrapped rail
 * of year chips.
 *
 * Approximated: the section count and the chip counts, which come from the DB
 * on the real page. Twelve item sections of forty years each is a mid-sized
 * stand-in rather than the full catalogue — rendering every item's every year
 * would cost more than the page it is covering for. Chip widths are jittered
 * to read like labels; the year chips are fixed-width because the real ones
 * are four monospace digits.
 */

/** Inflation calculator plus the CALCULATORS list. */
const TOOL_WIDTHS = [
  "w-40",
  "w-32",
  "w-36",
  "w-28",
  "w-44",
  "w-32",
  "w-36",
  "w-40",
  "w-28",
  "w-36",
  "w-32",
]

const ITEM_SECTIONS = 12
const YEARS_PER_ITEM = 40

function ToolsSection() {
  return (
    <section className="mt-8">
      <Skeleton className="mb-3 h-5 w-20" />
      <ul className="flex flex-wrap gap-2">
        {TOOL_WIDTHS.map((width, i) => (
          <li key={i}>
            <Skeleton className={`h-7 rounded-lg ${width}`} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function ItemSection() {
  return (
    <section className="mt-8">
      <Skeleton className="mb-3 h-5 w-56" />
      <div className="mb-3 flex items-center gap-2">
        <Skeleton className="size-5 rounded-full" />
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-28" />
      </div>
      <ul className="flex flex-wrap gap-1.5">
        {Array.from({ length: YEARS_PER_ITEM }, (_, i) => (
          <li key={i}>
            <Skeleton className="h-5 w-11 rounded-md" />
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function Loading() {
  return (
    <Shell wide>
      <Skeleton className="mb-4 h-3 w-40" />

      <div className="mb-6">
        <Skeleton className="h-8 w-72 sm:h-9 sm:w-80" />
        <Skeleton className="mt-2 h-4 w-full max-w-[34rem]" />
      </div>

      <ToolsSection />

      {Array.from({ length: ITEM_SECTIONS }, (_, i) => (
        <ItemSection key={i} />
      ))}
    </Shell>
  )
}

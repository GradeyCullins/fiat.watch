import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"

/**
 * Mirrors the map page (`app/(pages)/map/page.tsx`): full-bleed globe under the
 * nav with floating overlay panels — no `Shell`. A flat `bg-muted` fill stands
 * in for the globe, with the `MapExplorer` panels drawn on top: the title +
 * picker panel top-left, the item summary panel bottom-left, the legend pill
 * bottom-right from `lg`.
 *
 * Approximated: the panels repeat `Panel`'s wrapper classes rather than the
 * component, which lives in a client file; the globe is a static fill rather
 * than a pulsing block, since a full-viewport pulse is worse than none; bar
 * widths stand in for label lengths that only the data knows, and the collapsed
 * `<details>` rows are omitted because they are closed on first paint.
 */
export default function Loading() {
  return (
    <main className="relative h-[calc(100dvh-3.5rem)] w-full overflow-hidden">
      <div aria-hidden className="bg-muted absolute inset-0" />

      <div className="pointer-events-none absolute inset-0 flex flex-col gap-2 p-3 sm:p-4">
        <Panel className="w-full self-start lg:max-w-md">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <Skeleton className="h-6 w-60 max-w-full sm:h-8" />
            <Skeleton className="h-3 w-52 max-w-full" />
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <Skeleton className="h-10 w-44 rounded-full" />
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="hidden h-7.5 w-20 rounded-full sm:block" />
            ))}
          </div>

          <Skeleton className="mt-2 h-3 w-64 max-w-full" />
          <Skeleton className="mt-1.5 h-3 w-40" />
        </Panel>

        <div className="mt-auto flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <Panel className="w-full lg:max-w-lg">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <Skeleton className="size-4 rounded-sm" />
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="ml-auto h-3 w-20" />
            </div>

            <div className="mt-2 flex items-center gap-2">
              <Skeleton className="h-3 w-56 max-w-full" />
              <Skeleton className="ml-auto h-3 w-12 shrink-0" />
            </div>
          </Panel>

          <Skeleton className="hidden h-8 w-52 shrink-0 self-start rounded-full lg:block" />
        </div>
      </div>
    </main>
  )
}

/** `MapExplorer`'s floating `Panel`, minus the client boundary. */
function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "bg-background/85 float-2 pointer-events-auto rounded-2xl border p-3 backdrop-blur-md sm:p-3.5",
        className,
      )}
    >
      {children}
    </div>
  )
}

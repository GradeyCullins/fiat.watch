import { Skeleton } from "@workspace/ui/components/skeleton"

/** Mirrors the home page: heading block, legend strip, then the plot. */
export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-[1800px] flex-col gap-5 px-4 py-6 sm:px-6 lg:h-[calc(100dvh-4rem)] lg:py-7 xl:px-10">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-3 w-64" />
        <Skeleton className="h-16 w-full max-w-3xl" />
      </div>

      <div className="ruled grid grid-cols-2 border-2 sm:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="ruled space-y-2 border-r-2 p-4 last:border-r-0">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>

      <Skeleton className="ruled min-h-[420px] flex-1 border-2" />
    </main>
  )
}

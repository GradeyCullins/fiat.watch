import Link from "next/link"

import { cn } from "@workspace/ui/lib/utils"

import { emojiFor } from "@/lib/emoji"

/**
 * The item card.
 *
 * Everything on this site had become a hairline rectangle in a `gap-px` grid,
 * which reads as a spreadsheet rather than something you would browse. This is
 * the browsing surface: a soft tile, the emoji doing the recognising, and a
 * type hierarchy that puts the price first and the qualifiers last.
 */
export function ItemCard({
  slug,
  label,
  meta,
  value,
  href,
  size = "default",
}: {
  slug: string
  label: string
  meta?: string
  value?: string
  href: string
  size?: "default" | "compact"
}) {
  const compact = size === "compact"

  return (
    <Link
      href={href}
      className={cn(
        "group bg-card float-1 hover:float-2 hover:border-primary/40 flex flex-col items-center rounded-2xl border text-center transition-all hover:-translate-y-1",
        compact ? "gap-1.5 px-3 py-3.5" : "gap-2 px-4 py-5",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "grid place-items-center leading-none transition-transform group-hover:scale-105",
          compact ? "size-12 text-[2rem]" : "size-16 text-[3rem]",
        )}
      >
        {emojiFor(slug)}
      </span>

      <span className="mt-0.5 w-full">
        <span
          className={cn(
            "block truncate font-medium first-letter:uppercase",
            compact ? "text-xs" : "text-sm",
          )}
        >
          {label}
        </span>
        {meta ? (
          <span className="text-muted-foreground block truncate text-[0.6875rem]">{meta}</span>
        ) : null}
      </span>

      {value ? (
        <span
          className={cn(
            "tnum font-mono font-bold tracking-tight",
            compact ? "text-sm" : "text-lg",
          )}
        >
          {value}
        </span>
      ) : null}
    </Link>
  )
}

/** Cards breathe. A gap, not a shared hairline. */
export function CardRail({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <ul
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6",
        className,
      )}
    >
      {children}
    </ul>
  )
}

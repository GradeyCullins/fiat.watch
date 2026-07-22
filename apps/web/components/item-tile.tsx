import Link from "next/link"

import { ItemArt } from "@/components/item-art"
import { colorFor } from "@/lib/series"

/**
 * The item link tile, used on the home picker, the vertical pages and both
 * "other prices" lists. It appeared eight times across five files with the
 * same markup and drifting class lists.
 *
 * Always rendered inside `<TileGrid>`, which owns the hairline borders.
 */
export function ItemTile({
  slug,
  label,
  meta,
  value,
  href,
  stacked,
}: {
  slug: string
  label: string
  /** Small print under the label — unit, year range. */
  meta?: string
  /** Right-aligned figure, or the price when stacked. */
  value?: string
  href: string
  /** Taller card with the glyph on its own line. Used on the home picker. */
  stacked?: boolean
}) {
  if (stacked) {
    return (
      <li className="bg-border">
        <Link
          href={href}
          className="bg-card hover:bg-accent flex h-full flex-col gap-3 p-4 transition-colors"
        >
          <ItemArt slug={slug} className="size-8" style={{ color: colorFor(slug) }} />
          <span>
            <span className="font-display block font-bold">{label}</span>
            {meta ? <span className="text-muted-foreground text-xs">{meta}</span> : null}
          </span>
          {value ? (
            <span className="tnum mt-auto font-mono text-lg font-bold">{value}</span>
          ) : null}
        </Link>
      </li>
    )
  }

  return (
    <li className="bg-border">
      <Link
        href={href}
        className="bg-card hover:bg-accent flex h-full items-center gap-2.5 px-3 py-2.5 transition-colors"
      >
        <ItemArt slug={slug} className="size-5" style={{ color: colorFor(slug) }} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{label}</span>
          {meta ? <span className="text-muted-foreground text-xs">{meta}</span> : null}
        </span>
        {value ? (
          <span className="tnum ml-auto font-mono text-sm font-semibold">{value}</span>
        ) : null}
      </Link>
    </li>
  )
}

/** The hairline grid these tiles sit in. `gap-px` over a border is the rule. */
export function TileGrid({
  children,
  cols = "sm:grid-cols-2 lg:grid-cols-4",
}: {
  children: React.ReactNode
  cols?: string
}) {
  return <ul className={`ruled grid gap-px border ${cols}`}>{children}</ul>
}

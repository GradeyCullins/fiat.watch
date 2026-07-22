import Link from "next/link"

import { formatUsd } from "@workspace/core"

import { emojiFor } from "@/lib/emoji"
import { getAnnual, getItems } from "@/lib/data"
import { colorFor } from "@/lib/series"

/**
 * The strip under the nav.
 *
 * It used to render every item, which was fine at five and unusable at 160 —
 * the row simply overflowed. It is now a fixed, curated set on an infinite
 * marquee: recognisable things people actually buy, so the strip reads as a
 * sample rather than a truncated list.
 *
 * The animation is one CSS keyframe over a duplicated track. No JS, no
 * `requestAnimationFrame`, nothing to run on the main thread — and it stops
 * dead under `prefers-reduced-motion`.
 */
const TICKER = [
  "gas",
  "eggs",
  "bread",
  "milk",
  "ground-beef",
  "coffee",
  "bacon",
  "bananas",
  "chicken-breast",
  "butter",
  "electricity",
  "sugar",
]

export async function PriceTicker() {
  const items = await getItems()
  const bySlug = new Map(items.map((i) => [i.slug, i]))

  const rows = (
    await Promise.all(
      TICKER.map(async (slug) => {
        const item = bySlug.get(slug)
        if (!item || item.isDiscontinued) return null

        const annual = await getAnnual(slug)
        const latest = annual.at(-1)
        const prior = annual.at(-2)
        if (!latest) return null

        return {
          slug,
          label: item.label,
          value: latest.value,
          change: prior ? (latest.value / prior.value - 1) * 100 : null,
        }
      }),
    )
  ).filter((r): r is NonNullable<typeof r> => r !== null)

  if (!rows.length) return null

  return (
    <div className="ruled bg-card/30 hidden overflow-hidden border-b py-1 lg:block">
      {/* Two identical tracks so the loop has no seam. The second is hidden
          from assistive tech — it is the same content twice. */}
      <div className="marquee flex w-max">
        <Track rows={rows} />
        <Track rows={rows} aria-hidden />
      </div>
    </div>
  )
}

function Track({
  rows,
  ...props
}: {
  rows: { slug: string; label: string; value: number; change: number | null }[]
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="flex shrink-0 items-center gap-1" {...props}>
      {rows.map((row) => (
        <Link
          key={row.slug}
          href={`/costs/${row.slug}`}
          tabIndex={props["aria-hidden"] ? -1 : undefined}
          className="hover:bg-accent/60 flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1 text-xs transition-colors"
        >
          <span aria-hidden className="text-base leading-none">
            {emojiFor(row.slug)}
          </span>
          <span className="text-muted-foreground first-letter:uppercase">{row.label}</span>
          <span className="tnum font-mono font-semibold">{formatUsd(row.value)}</span>
          {row.change == null ? null : (
            <span className={`tnum font-mono ${row.change >= 0 ? "text-up" : "text-down"}`}>
              {row.change >= 0 ? "▲" : "▼"}
              {Math.abs(row.change).toFixed(1)}%
            </span>
          )}
        </Link>
      ))}
    </div>
  )
}

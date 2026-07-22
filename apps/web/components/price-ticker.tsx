import Link from "next/link"

import { formatUsd } from "@workspace/core"

import { getAnnual, getItems } from "@/lib/data"
import { assertSlugsExist } from "@/lib/coverage"
import { emojiFor } from "@/lib/emoji"

/**
 * The rail under the nav.
 *
 * Built like a delivery-app category strip rather than a stock ticker: the
 * emoji leads at a size you can actually read, the name sits under it, and the
 * price under that. An earlier version was horizontal pills with the emoji
 * inline and the label in muted grey — unreadable at a glance, which is the
 * opposite of the point, since this strip exists to be scanned.
 *
 * It also used to render every item, which was fine at five and overflowed the
 * viewport at 160. The set is fixed and curated; `/costs` is the catalogue.
 *
 * The motion is one CSS keyframe over a duplicated track — no JS, nothing on
 * the main thread — and it stops dead under `prefers-reduced-motion`.
 */
const TICKER = [
  "gas",
  "eggs",
  "bread",
  "milk",
  "ground-beef",
  "ground-coffee",
  "bacon",
  "bananas",
  "boneless-chicken-breast",
  "butter",
  "electricity",
  "sugar",
  "cheddar-cheese",
  "potatoes",
]

export async function PriceTicker() {
  const items = await getItems()
  const bySlug = new Map(items.map((i) => [i.slug, i]))
  assertSlugsExist("PriceTicker", TICKER, new Set(bySlug.keys()))

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
          // The catalogue name is precise ("large grade A eggs") and too long
          // for a rail. The attributive form is the short one.
          label: item.labelAttributive,
          value: latest.value,
          change: prior ? (latest.value / prior.value - 1) * 100 : null,
        }
      }),
    )
  ).filter((r): r is NonNullable<typeof r> => r !== null)

  if (!rows.length) return null

  return (
    <div className="relative hidden overflow-hidden py-3 lg:block">
      <div className="marquee flex w-max">
        <Track rows={rows} />
        <Track rows={rows} aria-hidden />
      </div>

      {/* Fade the ends so items enter and leave rather than being sliced off. */}
      <div className="from-background pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r to-transparent" />
      <div className="from-background pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l to-transparent" />
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
    <div className="flex shrink-0" {...props}>
      {rows.map((row) => (
        <Link
          key={row.slug}
          href={`/costs/${row.slug}`}
          tabIndex={props["aria-hidden"] ? -1 : undefined}
          className="group flex w-[7.5rem] shrink-0 flex-col items-center gap-1.5 px-2 text-center"
        >
          <span
            aria-hidden
            className="bg-muted/70 group-hover:bg-accent grid size-12 place-items-center rounded-full text-2xl transition-all group-hover:scale-110"
          >
            {emojiFor(row.slug)}
          </span>
          <span className="text-foreground w-full truncate text-[0.8125rem] leading-tight font-semibold first-letter:uppercase">
            {row.label}
          </span>
          <span className="flex items-baseline gap-1.5 leading-none">
            <span className="tnum font-mono text-sm font-bold">{formatUsd(row.value)}</span>
            {row.change == null ? null : (
              <span
                className={`tnum font-mono text-[0.6875rem] font-semibold ${
                  row.change >= 0 ? "text-up" : "text-down"
                }`}
              >
                {row.change >= 0 ? "+" : "−"}
                {Math.abs(row.change).toFixed(1)}%
              </span>
            )}
          </span>
        </Link>
      ))}
    </div>
  )
}

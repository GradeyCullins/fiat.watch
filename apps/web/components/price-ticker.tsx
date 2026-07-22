import Link from "next/link"

import { formatUsd } from "@workspace/core"

import { ItemArt } from "@/components/item-art"
import { getAnnual, getItems } from "@/lib/data"
import { colorFor } from "@/lib/series"

/**
 * The strip under the nav: every series, its latest reading, and the change on
 * the year before. It is the app's persistent orientation — and it links all
 * five hubs from every page on the site.
 */
export async function PriceTicker() {
  const items = await getItems()

  const rows = await Promise.all(
    items.map(async (item) => {
      const annual = await getAnnual(item.slug)
      const latest = annual.at(-1)
      const prior = annual.at(-2)
      return {
        slug: item.slug,
        label: item.label,
        value: latest?.value ?? null,
        change: latest && prior ? (latest.value / prior.value - 1) * 100 : null,
      }
    }),
  )

  return (
    <div className="ruled bg-card/40 hidden border-b lg:block">
      <div className="mx-auto flex w-full max-w-[1800px] items-stretch px-4 sm:px-6 xl:px-10">
        {rows.map((row) => (
          <Link
            key={row.slug}
            href={`/costs/${row.slug}`}
            className="ruled hover:bg-accent flex items-center gap-2 border-r px-4 py-1.5 text-xs transition-colors first:pl-0 last:border-r-0"
          >
            <ItemArt slug={row.slug} className="size-3.5" style={{ color: colorFor(row.slug) }} />
            <span className="text-muted-foreground uppercase">{row.label}</span>
            <span className="tnum font-mono font-semibold">
              {row.value == null ? "—" : formatUsd(row.value)}
            </span>
            {row.change == null ? null : (
              <span
                className={`tnum font-mono ${row.change >= 0 ? "text-up" : "text-down"}`}
              >
                {row.change >= 0 ? "▲" : "▼"} {Math.abs(row.change).toFixed(1)}%
              </span>
            )}
          </Link>
        ))}
        <span className="text-muted-foreground ml-auto flex items-center py-1.5 text-xs">
          BLS average price · annual
        </span>
      </div>
    </div>
  )
}

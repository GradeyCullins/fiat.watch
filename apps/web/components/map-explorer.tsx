"use client"

import * as React from "react"
import Link from "next/link"

import { formatUsd } from "@workspace/core"
import { cn } from "@workspace/ui/lib/utils"

import { ItemPicker } from "@/components/item-picker"
import { PriceGlobe } from "@/components/price-globe"
import { emojiFor } from "@/lib/emoji"
import type { MapItem } from "@/lib/map-data"
import { monthName } from "@/lib/site"

/** One tap for the things people come here for; the picker holds the rest. */
const QUICK = ["gas", "electricity", "bread", "ground-beef", "bananas"]

/** Matches `RAMP` in price-globe.tsx — cheap to dear. */
const RAMP = ["#1b4965", "#2a9d8f", "#8ab17d", "#e9c46a", "#e76f51"]

/**
 * `/map` is a canvas, not a document with a map in it.
 *
 * The globe fills the viewport under the nav and every control floats on top of
 * it. That is how map products work, and the reason is that here the map *is*
 * the content — putting it in a column with a heading above and a list below
 * makes the thing you came for the smallest element on screen.
 *
 * Two constraints shape the overlays. They must not swallow the map's own
 * gestures, so the overlay layer is `pointer-events-none` and each panel opts
 * back in. And every word has to stay in the DOM: the heading, the caveat and
 * the full price list are what a crawler and a screen reader get, so they are
 * collapsed and floated rather than dropped.
 */
export function MapExplorer({
  items,
  regions,
  divisions,
  metros,
  caveat,
}: {
  items: MapItem[]
  regions: { slug: string; name: string }[]
  divisions: { slug: string; name: string }[]
  metros: { slug: string; name: string }[]
  /** The "why regions, not states" copy, rendered on the server. */
  caveat: React.ReactNode
}) {
  const [selected, setSelected] = React.useState(items[0]?.slug ?? "")
  const item = items.find((i) => i.slug === selected) ?? items[0]

  const withHints = React.useMemo(
    () =>
      items.map((i) => ({
        slug: i.slug,
        label: i.label,
        labelAttributive: i.labelAttributive,
        hint: `${Object.keys(i.readings).length} places`,
      })),
    [items],
  )

  if (!item) return null

  const hasMetros = item.kinds.includes("metro")
  const areaRows = [
    ...(item.kinds.includes("division") ? divisions : regions),
    ...(hasMetros ? metros : []),
  ]
    .map((area) => ({ ...area, reading: item.readings[area.slug] }))
    .filter((row) => row.reading)
    .sort((a, b) => b.reading!.value - a.reading!.value)

  const latest = areaRows[0]?.reading
  const cityCount = metros.filter((m) => item.readings[m.slug]).length
  const dearest = areaRows[0]
  const cheapest = areaRows.at(-1)

  return (
    <div className="relative h-full w-full overflow-hidden">
      <PriceGlobe
        items={items}
        selected={selected}
        regionSlugs={regions.map((r) => r.slug)}
        divisionSlugs={divisions.map((d) => d.slug)}
        className="absolute inset-0"
      />

      {/* Transparent to the pointer, so dragging the globe works everywhere the
          panels are not. */}
      <div className="pointer-events-none absolute inset-0 flex flex-col gap-2 p-3 sm:p-4">
        <Panel className="pointer-events-auto w-full self-start lg:max-w-md">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <h1 className="font-display text-lg leading-tight font-extrabold tracking-tight sm:text-2xl">
              Where things cost more
            </h1>
            <p className="text-muted-foreground text-xs">The same basket, priced by place</p>
          </div>

          <div className="mt-2.5">
            <ItemPicker
              items={withHints}
              value={selected}
              onChange={setSelected}
              quick={QUICK.filter((slug) => items.some((i) => i.slug === slug))}
            />
          </div>

          <p className="text-muted-foreground mt-2 text-xs">
            {cityCount
              ? `${cityCount} cities · ${areaRows.length - cityCount} regions`
              : `${areaRows.length} census ${
                  item.kinds.includes("division") ? "divisions" : "regions"
                } — no city prices for this item`}
            {latest ? ` · ${monthName(latest.month)} ${latest.year}` : null}
          </p>

          <details className="group mt-1.5">
            <summary className="text-muted-foreground hover:text-foreground marker:content-none inline-flex cursor-pointer items-center gap-1 text-xs">
              <span className="underline underline-offset-4">Why regions, not states?</span>
              <span aria-hidden className="transition-transform group-open:rotate-90">
                ›
              </span>
            </summary>
            <div className="text-muted-foreground mt-2 max-h-52 space-y-2 overflow-y-auto text-xs text-pretty">
              {caveat}
            </div>
          </details>
        </Panel>

        <div className="mt-auto flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <Panel className="pointer-events-auto w-full lg:max-w-lg">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span aria-hidden className="text-base leading-none">
                {emojiFor(item.slug)}
              </span>
              <h2 className="text-sm font-semibold first-letter:uppercase">{item.label}</h2>
              <span className="text-muted-foreground text-xs">{item.unit}</span>
              <Link
                href={`/costs/${item.slug}`}
                className="text-muted-foreground hover:text-foreground ml-auto text-xs underline underline-offset-4"
              >
                Full history →
              </Link>
            </div>

            <details className="group mt-2">
              <summary className="marker:content-none flex cursor-pointer items-center gap-2 text-xs">
                <span className="text-muted-foreground">
                  {dearest && cheapest && dearest !== cheapest ? (
                    <>
                      Dearest <strong className="text-foreground">{dearest.name}</strong>{" "}
                      {formatUsd(dearest.reading!.value)} · cheapest{" "}
                      <strong className="text-foreground">{cheapest.name}</strong>{" "}
                      {formatUsd(cheapest.reading!.value)}
                    </>
                  ) : (
                    `${areaRows.length} places`
                  )}
                </span>
                <span className="text-muted-foreground ml-auto shrink-0">
                  all {areaRows.length}
                  <span
                    aria-hidden
                    className="ml-1 inline-block transition-transform group-open:rotate-90"
                  >
                    ›
                  </span>
                </span>
              </summary>

              {/* Capped and scrollable: thirty-two rows would otherwise cover
                  the map they describe. */}
              <ul className="mt-2 grid max-h-[38vh] gap-1 overflow-y-auto sm:grid-cols-2">
                {areaRows.map((row) => (
                  <li
                    key={row.slug}
                    className="bg-muted/50 flex items-baseline justify-between gap-3 rounded-lg px-2.5 py-1.5"
                  >
                    <span className="truncate text-xs font-medium">{row.name}</span>
                    <span className="tnum font-mono text-xs font-bold">
                      {formatUsd(row.reading!.value)}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          </Panel>

          <Legend
            low={cheapest ? formatUsd(cheapest.reading!.value) : null}
            high={dearest ? formatUsd(dearest.reading!.value) : null}
          />
        </div>
      </div>
    </div>
  )
}

/** A floating control surface. Frosted so the map stays legible underneath. */
function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "bg-background/85 float-2 rounded-2xl border p-3 backdrop-blur-md sm:p-3.5",
        className,
      )}
    >
      {children}
    </div>
  )
}

/**
 * What the shading means. A choropleth without one is decoration.
 *
 * Only from `lg`, which is where the bottom row splits and the swatch gets its
 * own corner. Below that it stacks under the summary panel and lands on
 * Mapbox's attribution — and the summary already names the dearest and
 * cheapest place in words, which is the same fact.
 */
function Legend({ low, high }: { low: string | null; high: string | null }) {
  if (!low || !high) return null
  return (
    <div className="bg-background/85 float-2 pointer-events-auto hidden shrink-0 items-center gap-2 self-start rounded-full border px-3 py-1.5 backdrop-blur-md lg:flex">
      <span className="tnum text-muted-foreground font-mono text-[0.6875rem]">{low}</span>
      <span aria-hidden className="flex h-2 overflow-hidden rounded-full">
        {RAMP.map((colour) => (
          <span key={colour} className="h-full w-4 sm:w-5" style={{ background: colour }} />
        ))}
      </span>
      <span className="tnum text-muted-foreground font-mono text-[0.6875rem]">{high}</span>
    </div>
  )
}

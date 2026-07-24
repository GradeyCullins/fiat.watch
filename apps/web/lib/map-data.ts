import { cache } from "react"

import { latestReadingByArea } from "@workspace/db"

import { getItems } from "./data"

/**
 * The payload behind `/map`.
 *
 * Two things shape it. The site is static, so the map cannot ask a server when
 * you change item — everything switchable has to be in the page. And BLS
 * geography is not what a price map usually implies: there is no state-level
 * data anywhere in this dataset, so nothing here can be a state choropleth of
 * real state prices. What exists is:
 *
 *   - 4 census regions and 9 divisions — groups of states. 159 of 160 items
 *     have at least one, and 112 have all four regions. This is the layer that
 *     covers the catalogue, and a state is coloured by the region it sits in.
 *   - 35 metro areas — real cities, real points. Only 12 items have them, and
 *     every one is energy: gas, electricity, natural gas, heating oil. There
 *     is no metro-level price for eggs.
 *   - 25 "size classes" — deliberately dropped. "Size Class B" is a population
 *     band, not a place; it is every mid-size city in the country at once and
 *     cannot be drawn on a map.
 */
export type AreaKind = "region" | "division" | "metro"

export interface MapReading {
  value: number
  year: number
  month: number
}

export interface MapItem {
  slug: string
  label: string
  labelAttributive: string
  unit: string
  /** Which layers this item can actually draw. */
  kinds: AreaKind[]
  /** areaSlug → its latest reading. */
  readings: Record<string, MapReading>
}

const MAPPABLE: ReadonlySet<string> = new Set<AreaKind>(["region", "division", "metro"])

/** Months since year zero, for comparing readings across areas. */
const stamp = (r: { year: number; month: number }) => r.year * 12 + r.month

/*
 * How far behind the item's most recent reading an area may be and still be
 * drawn. A year absorbs the ordinary lag between areas; anything beyond it is
 * a series BLS stopped publishing.
 */
const STALE_AFTER_MONTHS = 12

export const getMapData = cache(async (): Promise<MapItem[]> => {
  const [readings, items] = await Promise.all([latestReadingByArea(), getItems()])
  const bySlug = new Map(items.map((i) => [i.slug, i]))

  const grouped = new Map<string, MapItem>()
  const kindOf = new Map<string, AreaKind>()

  for (const row of readings) {
    if (!MAPPABLE.has(row.kind)) continue
    const item = bySlug.get(row.itemSlug)
    if (!item) continue
    kindOf.set(row.areaSlug, row.kind as AreaKind)

    let entry = grouped.get(row.itemSlug)
    if (!entry) {
      entry = {
        slug: item.slug,
        label: item.label,
        labelAttributive: item.labelAttributive,
        unit: item.unit,
        kinds: [],
        readings: {},
      }
      grouped.set(row.itemSlug, entry)
    }

    entry.readings[row.areaSlug] = { value: row.value, year: row.year, month: row.month }
  }

  /*
   * Drop areas whose newest reading is far older than the item's.
   *
   * This is not tidying — without it the map is actively false. BLS retired
   * most of its city gasoline series decades ago: Buffalo's last reading is
   * December 1986 at $0.78, and it was being drawn on the same globe, in the
   * same colour ramp, as Seattle's June 2026 $5.79. A reader compares two pins
   * and sees a 700% regional difference that is really forty years of
   * inflation. The colour scale was computed across the mixture too, so every
   * shade on the map was wrong, not just those pins.
   *
   * A discontinued series is not a cheap city. It is not a place on this map.
   */
  for (const entry of grouped.values()) {
    const values = Object.values(entry.readings)
    if (!values.length) continue
    const newest = Math.max(...values.map(stamp))

    for (const [slug, reading] of Object.entries(entry.readings)) {
      if (newest - stamp(reading) > STALE_AFTER_MONTHS) delete entry.readings[slug]
    }

    entry.kinds = [...new Set(Object.keys(entry.readings).map((slug) => kindOf.get(slug)))].filter(
      (kind): kind is AreaKind => kind != null,
    )
  }

  // One area is a dot, not a map. Requiring two keeps the picker honest about
  // which items have something to compare.
  return [...grouped.values()]
    .filter((entry) => Object.keys(entry.readings).length > 1)
    .sort((a, b) => Object.keys(b.readings).length - Object.keys(a.readings).length)
})

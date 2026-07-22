import { convert, type CpiTable } from "@workspace/core"

import type { ChartReading } from "@/components/item-chart"

/**
 * Turn raw price rows into chart readings, deflated into base-year dollars.
 *
 * This was written inline in three page components with three slightly
 * different signatures. It is the one calculation the whole site rests on, so
 * it belongs in one place: a year with a price but no CPI reading yields null
 * rather than borrowing a neighbour's deflator, and a monthly reading is
 * deflated with its own month's index rather than the annual average — which
 * is the bug the Rails app shipped on 2,594 pages.
 */
export function toReadings(
  rows: { year: number; month?: number; value: number }[],
  table: CpiTable,
  baseYear: number,
): ChartReading[] {
  return rows.map((row) => ({
    year: row.year,
    ...(row.month == null ? {} : { month: row.month }),
    nominal: row.value,
    real: table.has(row.year, row.month ?? null)
      ? convert(table, {
          amount: row.value,
          from: { year: row.year, month: row.month },
          to: { year: baseYear },
        }).converted
      : null,
  }))
}

/** A single figure restated in base-year dollars, or null where CPI is absent. */
export function deflate(
  table: CpiTable,
  amount: number,
  year: number,
  month?: number,
  baseYear?: number,
): number | null {
  const to = baseYear ?? table.latestYear
  return table.has(year, month ?? null)
    ? convert(table, { amount, from: { year, month }, to: { year: to } }).converted
    : null
}

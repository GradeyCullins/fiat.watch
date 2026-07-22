import { cache } from "react"

import type { CpiPoint } from "@workspace/core"

import { getCpiTable } from "./data"
import { allCpi } from "@workspace/db"

/**
 * The annual CPI series, shaped for the client-side calculator.
 *
 * Roughly 113 rows — small enough to serialise into the page so the tool
 * answers instantly and the site can stay fully static. Monthly readings stay
 * on the server; nothing in the UI converts by month.
 */
export const getAnnualCpiPoints = cache(async (): Promise<CpiPoint[]> => {
  const rows = await allCpi()
  return rows
    .filter((row) => row.month === null)
    .map((row) => ({
      year: row.year,
      month: null,
      value: row.value,
      isProvisional: row.isProvisional,
    }))
})

/** Thirty years back, or the start of the series if that is out of range. */
export function defaultFromYear(points: CpiPoint[]): number {
  const latest = points.at(-1)?.year
  const earliest = points[0]?.year
  if (latest === undefined || earliest === undefined) return 1913
  const candidate = latest - 30
  return points.some((p) => p.year === candidate) ? candidate : earliest
}

export { getCpiTable }

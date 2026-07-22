import { formatUsd } from "@workspace/core"

export interface StatFigure {
  label: string
  value: string
  note?: string
  tone?: "up" | "down"
}

export interface StatPoint {
  year: number
  nominal: number
  /** Restated in base-year dollars. Null where no CPI covers that year. */
  real: number | null
}

/**
 * The four figures at the top of an item page.
 *
 * Shared, rather than living inside the client dashboard, because the dashboard
 * reads the pinned year from the URL via nuqs — which calls `useSearchParams`,
 * which forces everything inside its Suspense boundary out of the static
 * shell. The server renders these same figures as the boundary's fallback so
 * the prices are in the HTML, and the client renders them identically once it
 * hydrates. One function, so the two can never drift.
 */
export function itemStats({
  points,
  unit,
  baseYear,
  selectedYear,
}: {
  points: StatPoint[]
  unit: string
  baseYear: number
  /** Omitted on the server: the default view is the latest reading. */
  selectedYear?: number | null
}): StatFigure[] {
  const latest = points.at(-1)
  const selected =
    selectedYear == null ? null : (points.find((p) => p.year === selectedYear) ?? null)
  const shown = selected ?? latest ?? null

  const index = shown ? points.findIndex((p) => p.year === shown.year) : -1
  const prior = index > 0 ? points[index - 1] : undefined
  const yoy = shown && prior ? (shown.nominal / prior.nominal - 1) * 100 : null

  const first = points[0]
  const realChange = first?.real && latest ? (latest.nominal / first.real - 1) * 100 : null

  return [
    {
      label: selected ? `${selected.year} price` : "Latest price",
      value: shown ? formatUsd(shown.nominal) : "—",
      note: unit,
    },
    {
      label: `In ${baseYear} dollars`,
      value: shown?.real == null ? "—" : formatUsd(shown.real),
      note:
        shown?.real == null
          ? "No CPI for this year"
          : shown.year === baseYear
            ? "Already today's money"
            : `${((shown.real / shown.nominal - 1) * 100).toFixed(0)}% above the price of the day`,
    },
    {
      label: "Year on year",
      value: yoy == null ? "—" : `${yoy >= 0 ? "+" : ""}${yoy.toFixed(1)}%`,
      tone: yoy == null ? undefined : yoy >= 0 ? "up" : "down",
      note: prior ? `vs ${formatUsd(prior.nominal)} in ${prior.year}` : "No prior year",
    },
    {
      label: "Real, whole series",
      value: realChange == null ? "—" : `${realChange >= 0 ? "+" : ""}${realChange.toFixed(0)}%`,
      tone: realChange == null ? undefined : realChange >= 0 ? "up" : "down",
      note: first && latest ? `${first.year} → ${latest.year}, inflation removed` : undefined,
    },
  ]
}

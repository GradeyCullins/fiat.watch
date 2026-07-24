import { formatUsd } from "@workspace/core"

import { priceTone } from "@/components/page-shell"

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
 * There used to be a second figure here, "In {baseYear} dollars", which on this
 * page is always the *latest* year's price — and the latest year is the base
 * year, so it deflated a 2026 price into 2026 dollars and printed the number it
 * started with. Gas showed "$3.83" and "$3.83", side by side, with the note
 * "Already today's money" admitting it. Two of the four figures were one fact.
 *
 * The peak replaces it, because it is the thing this series actually has to say
 * and the number no other view surfaces: gas has been more expensive than today
 * before, and you have to remove inflation to see it.
 */
export function itemStats({
  points,
  unit,
  baseYear,
}: {
  points: StatPoint[]
  unit: string
  baseYear: number
}): StatFigure[] {
  const latest = points.at(-1)
  const prior = points.at(-2)
  const yoy = latest && prior ? (latest.nominal / prior.nominal - 1) * 100 : null

  const first = points[0]
  const realChange = first?.real && latest ? (latest.nominal / first.real - 1) * 100 : null

  // Dearest the item has ever been in today's money — not the highest sticker
  // price, which for almost every series is simply the most recent year.
  const peak = points.reduce<StatPoint | null>(
    (best, p) => (p.real != null && (best?.real == null || p.real > best.real) ? p : best),
    null,
  )
  const vsPeak = peak?.real && latest ? (latest.nominal / peak.real - 1) * 100 : null

  return [
    {
      label: "Latest price",
      value: latest ? formatUsd(latest.nominal) : "—",
      note: `${unit} · ${latest?.year ?? "—"}`,
    },
    {
      label: `Peak, in ${baseYear} dollars`,
      value: peak?.real == null ? "—" : formatUsd(peak.real),
      note:
        peak == null || vsPeak == null
          ? "No CPI covers this series"
          : peak.year === latest?.year
            ? "The dearest it has ever been"
            : `${peak.year} — today is ${Math.abs(vsPeak).toFixed(0)}% ${vsPeak >= 0 ? "above" : "below"} it`,
    },
    {
      label: "Year on year",
      value: yoy == null ? "—" : `${yoy >= 0 ? "+" : ""}${yoy.toFixed(1)}%`,
      tone: priceTone(yoy),
      note: prior ? `vs ${formatUsd(prior.nominal)} in ${prior.year}` : "No prior year",
    },
    {
      label: "Real, whole series",
      value: realChange == null ? "—" : `${realChange >= 0 ? "+" : ""}${realChange.toFixed(0)}%`,
      tone: priceTone(realChange),
      note: first && latest ? `${first.year} → ${latest.year}, inflation removed` : undefined,
    },
  ]
}

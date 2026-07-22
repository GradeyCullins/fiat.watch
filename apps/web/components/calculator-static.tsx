import { convert, CpiTable, formatUsd, type CpiPoint } from "@workspace/core"

import type { CalculatorDefaults } from "@/components/inflation-calculator"
import { Stat, StatRail } from "@/components/page-shell"

/**
 * The calculator's default answer, rendered on the server.
 *
 * This is the Suspense fallback for `InflationCalculator`, and it is the only
 * version of that tool a crawler ever sees. nuqs reads the URL through
 * `useSearchParams`, which pulls everything inside the boundary out of the
 * static shell — a build of the seven vertical pages returned zero hits for
 * "is worth", so those pages were shipping Google a skeleton and about
 * twenty-six words of body copy.
 *
 * It renders the same figures the client renders on first paint, so hydration
 * swaps one for the other with nothing visibly changing.
 */
export function CalculatorStatic({
  points,
  defaults,
}: {
  points: CpiPoint[]
  defaults: CalculatorDefaults
}) {
  const table = new CpiTable(points)
  if (!table.has(defaults.from) || !table.has(defaults.to)) return null

  const result = convert(table, {
    amount: defaults.amount,
    from: { year: defaults.from },
    to: { year: defaults.to },
  })

  return (
    <div className="flex flex-col">
      <div className="ruled bg-card border p-4 sm:p-6">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-3 text-lg sm:text-xl">
          <span className="text-muted-foreground font-mono">$</span>
          <span className="ruled tnum flex h-11 w-40 items-center border px-3 font-mono text-lg font-bold sm:text-xl">
            {defaults.amount}
          </span>
          <span className="text-muted-foreground">in</span>
          <span className="ruled tnum flex h-11 items-center border px-3 font-mono text-lg font-bold sm:text-xl">
            {defaults.from}
          </span>
          <span className="text-muted-foreground">is worth</span>
        </p>

        <div className="mt-5 flex flex-wrap items-end gap-x-4 gap-y-3">
          <p className="font-display tnum text-display leading-none">
            {formatUsd(result.converted)}
          </p>
          <div className="mb-1.5 flex items-center gap-3">
            <span className="text-muted-foreground text-lg sm:text-xl">in</span>
            <span className="ruled tnum flex h-11 items-center border px-3 font-mono text-lg font-bold sm:text-xl">
              {defaults.to}
            </span>
          </div>
        </div>
      </div>

      <StatRail>
        <Stat
          label="Change"
          value={`${result.percentChange >= 0 ? "+" : ""}${result.percentChange.toFixed(1)}%`}
          tone={result.percentChange >= 0 ? "up" : "down"}
          note={`${defaults.from} → ${defaults.to}`}
        />
        <Stat
          label="Multiple"
          value={`${result.inflationFactor.toFixed(2)}×`}
          note={`A ${defaults.from} dollar buys what ${formatUsd(result.inflationFactor)} buys in ${defaults.to}`}
        />
        <Stat
          label="CPI-U"
          value={`${result.fromCpi.toFixed(1)} → ${result.toCpi.toFixed(1)}`}
          note={
            result.isProvisional
              ? `${defaults.to} is provisional — not a full published year`
              : "Published annual averages"
          }
        />
      </StatRail>
    </div>
  )
}

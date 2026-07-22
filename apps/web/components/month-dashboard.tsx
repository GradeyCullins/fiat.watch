"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"

import { formatUsd } from "@workspace/core"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@workspace/ui/components/chart"
import { cn } from "@workspace/ui/lib/utils"

export interface MonthPoint {
  month: number
  /** "Jan" — short, because twelve of them share an axis. */
  short: string
  name: string
  nominal: number
  /** Deflated with that month's own CPI where it exists. */
  real: number | null
}

/**
 * The twelve months of one year, as bars rather than a line — twelve readings
 * are discrete observations, and a line between them would imply a daily path
 * nobody measured.
 *
 * Clicking a bar navigates to that month's page. An earlier version wrote
 * `?m=6` instead, which was a second address for exactly what
 * `/costs/gas/1980/06` already says.
 */
export function MonthDashboard({
  slug,
  year,
  unit,
  color,
  baseYear,
  points,
}: {
  slug: string
  year: number
  unit: string
  color: string
  baseYear: number
  points: MonthPoint[]
}) {
  const [basis, setBasis] = React.useState<"real" | "nominal">("real")
  const key = basis


  const values = points.map((p) => p.nominal)
  const low = points[values.indexOf(Math.min(...values))]
  const high = points[values.indexOf(Math.max(...values))]

  const config = React.useMemo<ChartConfig>(
    () => ({ [key]: { label: `Price ${key === "real" ? `in ${baseYear} dollars` : ""}`, color } }),
    [key, color, baseYear],
  )

  return (
    <div className="flex flex-col">
      <div className="ruled bg-card/50 flex flex-wrap items-center gap-2 border border-b-0 px-2 py-2">
        <div className="ruled flex border">
          {(
            [
              { value: "real", label: `${baseYear} $` },
              { value: "nominal", label: "At the time" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setBasis(option.value)}
              aria-pressed={basis === option.value}
              className={cn(
                "ruled border-r px-2.5 py-1 text-xs font-medium transition-colors last:border-r-0",
                basis === option.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <ChartContainer
        config={config}
        className="ruled bg-card aspect-auto h-64 w-full border p-2 sm:h-72 sm:p-4"
      >
        <BarChart
          accessibilityLayer
          data={points}
          margin={{ left: 4, right: 12, top: 8, bottom: 0 }}
        >
          <CartesianGrid vertical={false} strokeDasharray="2 4" />
          <XAxis dataKey="short" tickLine={false} axisLine={false} tickMargin={10} />
          <YAxis
            width={56}
            tickLine={false}
            axisLine={false}
            tickMargin={6}
            // Function form, not the `"dataMin - x"` string form — that only
            // accepts a literal, so `"dataMin - dataMin * 0.08"` parsed to
            // nothing, the scale collapsed, and the cheapest month rendered as
            // a zero-height bar that never appeared.
            domain={[(min: number) => min * 0.92, (max: number) => max * 1.03]}
            tickFormatter={(value: number) =>
              value >= 10 ? `$${Math.round(value)}` : `$${value.toFixed(2)}`
            }
          />
          <ChartTooltip
            cursor={{ fill: "var(--accent)" }}
            content={({ active, payload, label }) =>
              active && payload?.length && payload[0]?.value != null ? (
                <div className="bg-popover text-popover-foreground ruled border p-2.5 shadow-lg">
                  <p className="tnum font-mono text-base leading-none font-bold">
                    {formatUsd(Number(payload[0].value))}
                  </p>
                  <p className="text-muted-foreground mt-1.5 text-xs">
                    {label} {year} · {unit}
                    {key === "real" ? ` · ${baseYear} dollars` : ""}
                  </p>
                </div>
              ) : null
            }
          />
          <Bar dataKey={key} isAnimationActive={false}>
            {points.map((point) => (
              <Cell key={point.month} fill={color} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>

      {low && high && low.month !== high.month ? (
        <p className="text-muted-foreground ruled border border-t-0 px-3 py-2 text-xs">
          At the time: cheapest in {low.name} at{" "}
          <span className="tnum text-foreground font-mono">{formatUsd(low.nominal)}</span>, dearest
          in {high.name} at{" "}
          <span className="tnum text-foreground font-mono">{formatUsd(high.nominal)}</span> — a{" "}
          {(((high.nominal - low.nominal) / low.nominal) * 100).toFixed(1)}% spread inside one year.
        </p>
      ) : null}
    </div>
  )
}

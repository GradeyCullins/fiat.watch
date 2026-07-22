"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { formatUsd } from "@workspace/core"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@workspace/ui/components/chart"
import { cn } from "@workspace/ui/lib/utils"

export interface SeriesPoint {
  /** Year, or a month label on the monthly view. */
  x: string | number
  nominal: number | null
  adjusted: number | null
}

/**
 * One item's price over time, with a toggle between the price of the day and
 * the same price restated in base-year dollars. The gap between the two lines
 * is the whole point of the site, so both are one click apart.
 */
export function SeriesChart({
  points,
  label,
  unit,
  color,
  baseYear,
  className,
}: {
  points: SeriesPoint[]
  label: string
  unit: string
  color: string
  baseYear: number
  className?: string
}) {
  const [real, setReal] = React.useState(true)
  const key = real ? "adjusted" : "nominal"

  const config = React.useMemo<ChartConfig>(
    () => ({ [key]: { label, color } }),
    [key, label, color],
  )

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="ruled flex w-fit border-2">
        <button
          type="button"
          onClick={() => setReal(true)}
          aria-pressed={real}
          className={cn(
            "ruled border-r-2 px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
            real ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent",
          )}
        >
          {baseYear} dollars
        </button>
        <button
          type="button"
          onClick={() => setReal(false)}
          aria-pressed={!real}
          className={cn(
            "px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
            !real ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent",
          )}
        >
          At the time
        </button>
      </div>

      <ChartContainer
        config={config}
        className="ruled bg-card aspect-auto h-72 w-full border-2 p-2 sm:h-80 sm:p-4"
      >
        <AreaChart data={points} margin={{ left: 4, right: 12, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id={`fill-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="2 4" />
          <XAxis dataKey="x" tickLine={false} axisLine={false} tickMargin={10} minTickGap={32} />
          <YAxis
            width={56}
            tickLine={false}
            axisLine={false}
            tickMargin={6}
            tickFormatter={(v: number) => (v >= 10 ? `$${Math.round(v)}` : `$${v.toFixed(2)}`)}
          />
          <ChartTooltip
            cursor={{ stroke: "var(--rule)", strokeWidth: 1 }}
            content={({ active, payload, label: x }) =>
              active && payload?.length && payload[0]!.value != null ? (
                <div className="bg-popover text-popover-foreground ruled brutal-4 border-2 p-3">
                  <p className="font-display tnum text-lg leading-none font-extrabold">
                    {formatUsd(Number(payload[0]!.value))}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {x} · {unit}
                    {real ? ` · in ${baseYear} dollars` : ""}
                  </p>
                </div>
              ) : null
            }
          />
          <Area
            dataKey={key}
            type="monotone"
            stroke={color}
            strokeWidth={2.25}
            fill={`url(#fill-${key})`}
            isAnimationActive={false}
            connectNulls={false}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  )
}

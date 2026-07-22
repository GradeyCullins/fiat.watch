"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts"

import { formatUsd } from "@workspace/core"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@workspace/ui/components/chart"
import { cn } from "@workspace/ui/lib/utils"

import { ItemArt } from "@/components/item-art"

export interface ChartSeries {
  slug: string
  label: string
  unit: string
  color: string
  latest: number
  firstYear: number
  lastYear: number
}

export type ChartRow = Record<string, number | null>

const RANGES = [
  { label: "10y", years: 10 },
  { label: "25y", years: 25 },
  { label: "50y", years: 50 },
  { label: "All", years: Number.POSITIVE_INFINITY },
] as const

const axisMoney = (value: number) =>
  value >= 10 ? `$${Math.round(value)}` : `$${value.toFixed(2).replace(/0$/, "")}`

export function PriceChart({
  series,
  nominal,
  adjusted,
  baseYear,
  className,
}: {
  series: ChartSeries[]
  nominal: ChartRow[]
  /** The same prices restated in `baseYear` dollars. */
  adjusted: ChartRow[]
  baseYear: number
  className?: string
}) {
  const [active, setActive] = React.useState<string[]>(() => series.map((s) => s.slug))
  const [real, setReal] = React.useState(true)
  const [range, setRange] = React.useState<number>(Number.POSITIVE_INFINITY)

  const config = React.useMemo<ChartConfig>(
    () =>
      Object.fromEntries(series.map((s) => [s.slug, { label: s.label, color: s.color }])),
    [series],
  )

  const rows = real ? adjusted : nominal

  const data = React.useMemo(() => {
    if (!Number.isFinite(range)) return rows
    const last = rows.at(-1)?.year ?? 0
    return rows.filter((row) => (row.year ?? 0) > (last ?? 0) - range)
  }, [rows, range])

  const toggle = (slug: string) =>
    setActive((prev) => {
      // Never let the chart empty out — clicking the last remaining series
      // solos it instead of leaving an axis with nothing on it.
      if (prev.length === 1 && prev[0] === slug) return series.map((s) => s.slug)
      return prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    })

  return (
    <div className={cn("flex min-h-0 flex-col gap-4", className)}>
      {/* Legend. ChartLegendContent never spreads props onto its rows, so it
          cannot be made clickable — series toggling has to live out here. */}
      <div className="ruled flex flex-wrap border-2">
        {series.map((s) => {
          const on = active.includes(s.slug)
          return (
            <button
              key={s.slug}
              type="button"
              onClick={() => toggle(s.slug)}
              aria-pressed={on}
              style={{ ["--series" as string]: s.color }}
              className={cn(
                "group ruled relative flex flex-1 basis-32 items-center gap-2.5 border-r-2 px-3 py-2.5 text-left transition-colors last:border-r-0 sm:px-4 sm:py-3",
                on ? "bg-card" : "bg-muted/40 text-muted-foreground",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute inset-x-0 top-0 h-1 transition-opacity",
                  on ? "opacity-100" : "opacity-0",
                )}
                style={{ background: s.color }}
              />
              <ItemArt
                slug={s.slug}
                className={cn("size-5 transition-opacity", on ? "opacity-100" : "opacity-40")}
                style={{ color: on ? s.color : undefined }}
              />
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium">{s.label}</span>
                <span className="tnum block font-mono text-sm font-bold sm:text-base">
                  {formatUsd(s.latest)}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="ruled flex border-2">
          <Segment active={real} onClick={() => setReal(true)}>
            {baseYear} dollars
          </Segment>
          <Segment active={!real} onClick={() => setReal(false)}>
            At the time
          </Segment>
        </div>

        <div className="ruled flex border-2">
          {RANGES.map((r) => (
            <Segment key={r.label} active={range === r.years} onClick={() => setRange(r.years)}>
              {r.label}
            </Segment>
          ))}
        </div>
      </div>

      <ChartContainer
        config={config}
        className="ruled bg-card aspect-auto min-h-0 w-full flex-1 border-2 p-2 sm:p-4"
      >
        <LineChart data={data} margin={{ left: 4, right: 12, top: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="2 4" />
          <XAxis
            dataKey="year"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            minTickGap={40}
            className="tnum"
          />
          <YAxis
            width={52}
            tickLine={false}
            axisLine={false}
            tickMargin={6}
            tickFormatter={axisMoney}
            className="tnum"
          />
          {/* 2020 is the year the shape of every one of these series changes. */}
          <ReferenceLine
            x={2020}
            stroke="var(--muted-foreground)"
            strokeDasharray="3 3"
            strokeOpacity={0.5}
          />
          <ChartTooltip
            cursor={{ stroke: "var(--rule)", strokeWidth: 1 }}
            content={<PriceTooltip series={series} real={real} baseYear={baseYear} />}
          />
          {series
            .filter((s) => active.includes(s.slug))
            .map((s) => (
              <Line
                key={s.slug}
                dataKey={s.slug}
                type="monotone"
                stroke={s.color}
                strokeWidth={2.25}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
                isAnimationActive={false}
                // BLS cancelled October 2025 during the shutdown and could not
                // collect it retroactively. Bridging the gap would draw a line
                // through a month that does not exist.
                connectNulls={false}
              />
            ))}
        </LineChart>
      </ChartContainer>
    </div>
  )
}

function Segment({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "ruled border-r-2 px-3 py-1.5 text-xs font-medium transition-colors last:border-r-0 sm:text-sm",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}

function PriceTooltip({
  active,
  payload,
  label,
  series,
  real,
  baseYear,
}: {
  active?: boolean
  payload?: { dataKey?: string | number; value?: number | string }[]
  label?: string | number
  series: ChartSeries[]
  real: boolean
  baseYear: number
}) {
  if (!active || !payload?.length) return null

  const rows = payload
    .map((entry) => {
      const s = series.find((item) => item.slug === entry.dataKey)
      return s && entry.value != null ? { s, value: Number(entry.value) } : null
    })
    .filter((row): row is { s: ChartSeries; value: number } => row !== null)
    .sort((a, b) => b.value - a.value)

  if (!rows.length) return null

  return (
    <div className="bg-popover text-popover-foreground ruled brutal-4 min-w-56 border-2 p-3">
      <p className="font-display tnum text-lg leading-none font-extrabold">{label}</p>
      <p className="text-muted-foreground text-eyebrow mt-1 uppercase">
        {real ? `In ${baseYear} dollars` : "Price at the time"}
      </p>
      <ul className="mt-3 space-y-1.5">
        {rows.map(({ s, value }) => (
          <li key={s.slug} className="flex items-center gap-2 text-sm">
            <span aria-hidden className="size-2.5 shrink-0" style={{ background: s.color }} />
            <span className="truncate">{s.label}</span>
            <span className="tnum ml-auto font-mono font-bold">{formatUsd(value)}</span>
            <span className="text-muted-foreground w-16 shrink-0 truncate text-xs">{s.unit}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

"use client"

import * as React from "react"
import Link from "next/link"
import { parseAsInteger, parseAsStringLiteral, useQueryStates } from "nuqs"
import { ArrowRightIcon } from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"

import { formatUsd } from "@workspace/core"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@workspace/ui/components/chart"
import { cn } from "@workspace/ui/lib/utils"

import { ActiveLabelProbe } from "@/components/chart-active-label"
import { Stat, StatRail } from "@/components/page-shell"
import { itemStats } from "@/lib/item-stats"

export interface DashboardPoint {
  year: number
  nominal: number
  /** Restated in base-year dollars. Null where no CPI covers that year. */
  real: number | null
  months: number
}

const BASES = ["real", "nominal"] as const
const RANGES = ["10y", "25y", "50y", "all"] as const

const RANGE_YEARS: Record<(typeof RANGES)[number], number> = {
  "10y": 10,
  "25y": 25,
  "50y": 50,
  all: Number.POSITIVE_INFINITY,
}

/**
 * Chart state lives in the URL so a view is shareable and the back button
 * works — but `shallow` stays true (the nuqs default), so it never hits the
 * server and never mints a second crawlable address for content that already
 * has a path. `/costs/gas/1980` is the indexable page; `?y=1980` is a camera
 * angle on `/costs/gas`. The old site put calculator state in query strings on
 * `/` and Search Console reported sixteen of those as duplicates.
 */
export function ItemDashboard({
  slug,
  label,
  unit,
  color,
  baseYear,
  points,
}: {
  slug: string
  label: string
  unit: string
  color: string
  baseYear: number
  points: DashboardPoint[]
}) {
  const [{ y, v, r }, setState] = useQueryStates({
    y: parseAsInteger,
    v: parseAsStringLiteral(BASES).withDefault("real"),
    r: parseAsStringLiteral(RANGES).withDefault("all"),
  })

  const key = v === "real" ? "real" : "nominal"

  const data = React.useMemo(() => {
    const span = RANGE_YEARS[r]
    if (!Number.isFinite(span)) return points
    const last = points.at(-1)?.year ?? 0
    return points.filter((p) => p.year > last - span)
  }, [points, r])

  const selected = React.useMemo(
    () => (y == null ? null : (points.find((p) => p.year === y) ?? null)),
    [points, y],
  )

  const stats = React.useMemo(
    () => itemStats({ points, unit, baseYear, selectedYear: y }),
    [points, unit, baseYear, y],
  )

  const config = React.useMemo<ChartConfig>(() => ({ [key]: { label, color } }), [key, label, color])

  // See chart-active-label.tsx — the state recharts hands to `onClick` has
  // not settled yet, so the hovered year comes from a store subscription.
  const hovered = React.useRef<number | null>(null)
  const trackHover = React.useCallback((label: unknown) => {
    const parsed = Number(label)
    hovered.current = Number.isFinite(parsed) ? parsed : null
  }, [])

  const pin = React.useCallback(() => {
    const year = hovered.current
    if (year == null) return
    setState({ y: year === y ? null : year })
  }, [setState, y])

  return (
    <div className="flex flex-col">
      {/* Stat rail — identical markup to the server-rendered fallback. */}
      <StatRail>
        {stats.map((stat) => (
          <Stat key={stat.label} {...stat} />
        ))}
      </StatRail>

      {/* Controls */}
      <div className="ruled bg-card/50 flex flex-wrap items-center gap-x-1 gap-y-2 border-x border-b px-2 py-2">
        <Segmented
          options={[
            { value: "real", label: `${baseYear} dollars` },
            { value: "nominal", label: "At the time" },
          ]}
          value={v}
          onChange={(next) => setState({ v: next as (typeof BASES)[number] })}
        />
        <span className="bg-border mx-2 hidden h-5 w-px sm:block" />
        <Segmented
          options={RANGES.map((range) => ({ value: range, label: range.toUpperCase() }))}
          value={r}
          onChange={(next) => setState({ r: next as (typeof RANGES)[number] })}
        />

        <div className="ml-auto flex items-center gap-2 pr-1">
          {selected ? (
            <>
              <button
                type="button"
                onClick={() => setState({ y: null })}
                className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-4"
              >
                Clear {selected.year}
              </button>
              <Link
                href={`/costs/${slug}/${selected.year}`}
                className="ruled bg-primary text-primary-foreground flex items-center gap-1.5 border px-2.5 py-1 text-xs font-medium"
              >
                Open {selected.year}
                <ArrowRightIcon className="size-3" />
              </Link>
            </>
          ) : (
            <span className="text-muted-foreground hidden text-xs sm:block">
              Click the chart to pin a year
            </span>
          )}
        </div>
      </div>

      {/* Plot */}
      <ChartContainer
        config={config}
        className="ruled bg-card aspect-auto h-[clamp(18rem,42vh,30rem)] w-full border-x border-b p-2 sm:p-4"
      >
        <AreaChart
          data={data}
          margin={{ left: 4, right: 12, top: 8, bottom: 0 }}
          onClick={pin}
          className="cursor-crosshair"
        >
          <defs>
            <linearGradient id={`fill-${slug}-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <ActiveLabelProbe onChange={trackHover} />
          <CartesianGrid vertical={false} strokeDasharray="2 4" />
          <XAxis dataKey="year" tickLine={false} axisLine={false} tickMargin={10} minTickGap={36} />
          <YAxis
            width={56}
            tickLine={false}
            axisLine={false}
            tickMargin={6}
            tickFormatter={(value: number) =>
              value >= 10 ? `$${Math.round(value)}` : `$${value.toFixed(2)}`
            }
          />
          <ChartTooltip
            cursor={{ stroke: "var(--rule)", strokeWidth: 1, strokeDasharray: "3 3" }}
            content={({ active, payload, label: x }) =>
              active && payload?.length && payload[0]?.value != null ? (
                <div className="bg-popover text-popover-foreground ruled border p-2.5 shadow-lg">
                  <p className="tnum font-mono text-base leading-none font-bold">
                    {formatUsd(Number(payload[0].value))}
                  </p>
                  <p className="text-muted-foreground mt-1.5 text-xs">
                    {x} · {unit}
                    {key === "real" ? ` · ${baseYear} dollars` : ""}
                  </p>
                </div>
              ) : null
            }
          />
          {selected ? (
            <ReferenceLine x={selected.year} stroke={color} strokeDasharray="4 3" />
          ) : null}
          <Area
            dataKey={key}
            type="monotone"
            stroke={color}
            strokeWidth={2}
            fill={`url(#fill-${slug}-${key})`}
            isAnimationActive={false}
            connectNulls={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
          />
          {selected && selected[key] != null ? (
            <ReferenceDot
              x={selected.year}
              y={selected[key] as number}
              r={5}
              fill={color}
              stroke="var(--card)"
              strokeWidth={2}
            />
          ) : null}
        </AreaChart>
      </ChartContainer>
    </div>
  )
}


function Segmented({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="ruled flex border">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={cn(
            "ruled border-r px-2.5 py-1 text-xs font-medium transition-colors last:border-r-0",
            value === option.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

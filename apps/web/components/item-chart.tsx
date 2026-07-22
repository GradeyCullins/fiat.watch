"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts"

import { formatUsd } from "@workspace/core"
import { Card, CardAction, CardContent, CardHeader } from "@workspace/ui/components/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { cn } from "@workspace/ui/lib/utils"

export interface ChartReading {
  /** Year, or year and month when this is a monthly reading. */
  year: number
  month?: number
  nominal: number
  /** Restated in base-year dollars. Null where no CPI covers the period. */
  real: number | null
}

type Interval = "annual" | "monthly"
type Basis = "real" | "nominal"

const RANGES = [
  { label: "1Y", years: 1 },
  { label: "5Y", years: 5 },
  { label: "10Y", years: 10 },
  { label: "25Y", years: 25 },
  { label: "All", years: Number.POSITIVE_INFINITY },
] as const

export interface ChartFocus {
  year?: number
  month?: number
}

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

/**
 * One chart with the two controls a price series actually needs: how much
 * history (range) and at what resolution (interval). Annual is ~50 points,
 * monthly is ~600 of the same series — not a different page, a different zoom.
 *
 * The chart is deliberately not clickable. Navigation to a specific year or
 * month is the chip grid below it: those are real anchors, so they are
 * crawlable and keyboard-reachable, which an `onClick` on an SVG path is not.
 * No shadcn chart block makes a datum clickable either — every "interactive"
 * one drives the chart from chrome, which is what the controls above do.
 */
export function ItemChart({
  slug,
  label,
  unit,
  color,
  baseYear,
  annual,
  monthly,
  focus,
}: {
  slug: string
  label: string
  unit: string
  color: string
  baseYear: number
  annual: ChartReading[]
  monthly: ChartReading[]
  /** Where the route says to start. Undefined on the item page. */
  focus?: ChartFocus
}) {
  // The route sets the *initial* view; the controls own it from then on.
  // Changing a control deliberately does not rewrite the URL — the path is
  // the page you asked for, not a running log of what you have looked at.
  const [interval, setInterval] = React.useState<Interval>(
    focus?.year == null ? "annual" : "monthly",
  )
  const [basis, setBasis] = React.useState<Basis>("real")
  const [range, setRange] = React.useState<string>(focus?.year == null ? "All" : "1Y")

  const key = basis === "real" ? "real" : "nominal"
  const source = interval === "annual" ? annual : monthly

  const data = React.useMemo(() => {
    const span = RANGES.find((r) => r.label === range)?.years ?? Number.POSITIVE_INFINITY

    // Ranges are measured back from the focused period rather than from today,
    // so `/costs/gas/1980` opens on 1980 instead of on the most recent year.
    const anchor = focus?.year ?? source.at(-1)?.year ?? 0
    const rows = !Number.isFinite(span)
      ? source
      : source.filter((r) => r.year > anchor - span && r.year <= anchor)

    return rows.map((r) => ({
      ...r,
      // One label field for the axis and the tooltip, so the same chart works
      // at both resolutions without branching on every formatter.
      x: r.month == null ? String(r.year) : `${MONTHS_SHORT[r.month - 1]} ${r.year}`,
      focused: r.year === focus?.year && r.month === focus?.month,
    }))
  }, [source, range, focus])

  const config = React.useMemo<ChartConfig>(
    () => ({ [key]: { label: basis === "real" ? `${baseYear} dollars` : "Price at the time", color } }),
    [key, basis, baseYear, color],
  )


  return (
    <Card className="gap-0 py-0">
      <CardHeader className="ruled border-b px-3 py-2.5 sm:px-4">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            value={interval}
            onChange={(next) => setInterval(next as Interval)}
            options={[
              { value: "annual", label: "Annual" },
              { value: "monthly", label: "Monthly" },
            ]}
          />
          <Segmented
            value={basis}
            onChange={(next) => setBasis(next as Basis)}
            options={[
              { value: "real", label: `${baseYear} $` },
              { value: "nominal", label: "At the time" },
            ]}
          />

        </div>

        <CardAction className="flex items-center gap-3 self-center">
          {/* Base UI's Select can emit null when a value is cleared; this one
              is never clearable, so fall back to the current range. */}
          <Select value={range} onValueChange={(next) => setRange(next ?? range)}>
            <SelectTrigger size="sm" className="ruled w-24 border" aria-label="History shown">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="ruled border">
              {RANGES.map((r) => (
                <SelectItem key={r.label} value={r.label}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>

      <CardContent className="px-2 py-3 sm:px-4 sm:py-4">
        <ChartContainer
          config={config}
          className="aspect-auto h-[clamp(16rem,38vh,26rem)] w-full"
        >
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{ left: 4, right: 12, top: 8, bottom: 0 }}
          >
            <defs>
              <linearGradient id={`fill-${slug}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.6} />
                <stop offset="95%" stopColor={color} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="x" tickLine={false} axisLine={false} tickMargin={8} minTickGap={40} />
            <YAxis
              width={56}
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              // Fit the visible data rather than pinning the baseline to zero.
              // An area chart defaults to [0, auto], which is honest across a
              // 50-year range and useless at one-year zoom, where a $4.85–$5.22
              // spread renders as a flat line. Function form, not the
              // `"dataMin - x"` string form — that only accepts a literal.
              domain={[(min: number) => min * 0.96, (max: number) => max * 1.04]}
              tickFormatter={(v: number) => (v >= 10 ? `$${Math.round(v)}` : `$${v.toFixed(2)}`)}
            />
            <ChartTooltip
              cursor={{ stroke: "var(--rule)", strokeWidth: 1, strokeDasharray: "3 3" }}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  formatter={(value) => (
                    <span className="tnum font-mono font-semibold">
                      {formatUsd(Number(value))}
                    </span>
                  )}
                />
              }
            />
            {focus?.year != null ? (
              <ReferenceLine
                x={
                  focus.month == null
                    ? String(focus.year)
                    : `${MONTHS_SHORT[focus.month - 1]} ${focus.year}`
                }
                stroke={color}
                strokeDasharray="4 3"
              />
            ) : null}
            <Area
              dataKey={key}
              type="natural"
              stroke={color}
              strokeWidth={2}
              fill={`url(#fill-${slug})`}
              isAnimationActive={false}
              connectNulls={false}
            />
          </AreaChart>
        </ChartContainer>

        <p className="text-muted-foreground mt-2 px-1 text-xs">
          {label}, {unit} ·{" "}
          {interval === "annual"
            ? `${data.length} annual averages`
            : `${data.length} monthly readings`}
          {basis === "real" ? ` · restated in ${baseYear} dollars` : " · price at the time"}
        </p>
      </CardContent>
    </Card>
  )
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
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

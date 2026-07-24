"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts"

import { formatUsd } from "@workspace/core"
import { Card, CardAction, CardContent, CardHeader } from "@workspace/ui/components/card"
import { ChartContainer, ChartTooltip, type ChartConfig } from "@workspace/ui/components/chart"
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

export interface ChartFocus {
  year?: number
  month?: number
}

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

/** Range shortcuts, in years. The dropdowns are the precise control. */
const PRESETS = [1, 5, 10, 25] as const

/**
 * A point in time as a single sortable number: months since year zero.
 *
 * Annual rows have no month, so they mark January — which makes an annual row
 * and the January of the same year compare equal, and that is exactly what is
 * wanted when a span crosses between resolutions.
 */
type Mark = number
interface Span {
  from: Mark
  to: Mark
}

const mark = (r: { year: number; month?: number }): Mark => r.year * 12 + ((r.month ?? 1) - 1)

/** First row at or after `from`; falls back to the start of the series. */
const indexFrom = (rows: Row[], from: Mark) => {
  const at = rows.findIndex((r) => mark(r) >= from)
  return at === -1 ? 0 : at
}

/** Last row at or before `to`; falls back to the end of the series. */
const indexTo = (rows: Row[], to: Mark) => {
  for (let i = rows.length - 1; i >= 0; i--) if (mark(rows[i]!) <= to) return i
  return Math.max(0, rows.length - 1)
}

function initialSpan(rows: Row[], focus?: ChartFocus): Span {
  const first = rows[0]
  const last = rows.at(-1)
  if (!first || !last) return { from: 0, to: 0 }
  if (focus?.year == null) return { from: mark(first), to: mark(last) }

  // A few years either side of the focused reading, so the page you asked for
  // opens on its own neighbourhood rather than on fifty years of context.
  const at = mark({ year: focus.year, month: focus.month })
  return { from: at - 18, to: at + 18 }
}

interface Row extends ChartReading {
  /** Index into the full series, so the tooltip can look backwards. */
  i: number
  x: string
  focused: boolean
}

const label = (r: ChartReading) =>
  r.month == null ? String(r.year) : `${MONTHS_SHORT[r.month - 1]} ${r.year}`

/**
 * One chart, three controls: resolution (annual/monthly), basis (at the
 * time / today's money), and range.
 *
 * Range is two dropdowns, plus shortcuts. Two earlier attempts are worth
 * recording so neither comes back:
 *
 * A Select of 1Y/5Y/10Y/25Y/All — shadcn's own `chart-area-interactive`
 * pattern, lifted across. That block is built for ninety days of homogeneous
 * traffic data where every window is much like any other; it cannot express
 * "1979 to 1982", which on a fifty-year price series is the only kind of
 * question worth asking.
 *
 * Then a recharts `<Brush>`. Fifty years across three hundred pixels makes one
 * pixel two months, so a range is a pixel-hunt, and there is no way to do it
 * from a keyboard at all.
 *
 * A calendar range picker is the third candidate and is worse than both:
 * react-day-picker is a *day* grid, and this data has no days — you would be
 * picking the 14th of March to mean March's average.
 *
 * Default basis is nominal. The page's own title asks a nominal question —
 * "how much did gas cost in 1980" — and the answer is $1.25, the number every
 * other source will give. Today's money is the second thought, and it is on
 * the tooltip at all times anyway.
 */
export function ItemChart({
  slug,
  label: itemLabel,
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
  const [basis, setBasis] = React.useState<Basis>("nominal")

  const key = basis === "real" ? "real" : "nominal"

  const decorate = React.useCallback(
    (list: ChartReading[]): Row[] =>
      list.map((r, i) => ({
        ...r,
        i,
        // One label field for the axis and the tooltip, so the same chart works
        // at both resolutions without branching on every formatter.
        x: label(r),
        focused: r.year === focus?.year && r.month === focus?.month,
      })),
    [focus],
  )

  const annualRows = React.useMemo(() => decorate(annual), [decorate, annual])
  const monthlyRows = React.useMemo(() => decorate(monthly), [decorate, monthly])
  const rows = interval === "annual" ? annualRows : monthlyRows

  /*
   * The visible range is a *span of time*, not a pair of array indices.
   *
   * Indices were the obvious choice and the wrong one: index 12 is 1988 in the
   * annual series and 1977 in the monthly one, so switching resolution threw
   * away the range you had chosen. Every serious charting tool treats these as
   * two independent axes — changing the bar interval on TradingView keeps the
   * dates you were looking at — and holding a span rather than indices is what
   * makes that fall out for free.
   */
  const [span, setSpan] = React.useState<Span>(() => initialSpan(rows, focus))

  const start = indexFrom(rows, span.from)
  const end = Math.max(start, indexTo(rows, span.to))
  const visible = rows.slice(start, end + 1)

  /** Move one end, dragging the other along if it would cross over. */
  const setEdge = (edge: "from" | "to", row: Row) =>
    setSpan((current) => {
      const at = mark(row)
      return edge === "from"
        ? { from: at, to: Math.max(at, current.to) }
        : { from: Math.min(current.from, at), to: at }
    })

  /*
   * A preset sets the range *and* the resolution.
   *
   * "1Y" on the annual series is one data point — a chart of a single dot,
   * which is what it drew before. The window is not wrong; the resolution is.
   * Ten years or less resolves to months (12 to 120 readings), more than that
   * to years, which is the same rule a trading chart applies when it moves you
   * from daily to weekly bars as you zoom out. The Annual/Monthly control
   * still overrides it, and now keeps your dates when you do.
   */
  const trailing = (years: number, to: Mark) => to - (years * 12 - 1)

  const preset = (years: number | null) => {
    const source = years != null && years <= 10 ? monthlyRows : annualRows
    const last = source.at(-1)
    if (!last) return
    setInterval(years != null && years <= 10 ? "monthly" : "annual")
    setSpan(
      years == null
        ? { from: mark(source[0]!), to: mark(last) }
        : { from: trailing(years, mark(last)), to: mark(last) },
    )
  }

  /*
   * Year to date: January of the most recent year to the latest reading.
   *
   * Monthly only — "the year so far" has no meaning on a series of annual
   * averages — and hidden unless the current year has more than one reading,
   * because otherwise it is the single point this whole change exists to
   * avoid. BLS is six months into 2026 for most items.
   */
  const ytdYear = monthlyRows.at(-1)?.year
  const ytdCount = monthlyRows.filter((r) => r.year === ytdYear).length
  const ytd = () => {
    const last = monthlyRows.at(-1)
    if (!last || ytdYear == null) return
    setInterval("monthly")
    setSpan({ from: ytdYear * 12, to: mark(last) })
  }

  /*
   * Which shortcut the current span corresponds to, derived rather than
   * remembered — a stored "active preset" would go on claiming 10Y after you
   * dragged the From dropdown to 1979.
   *
   * Compared on the span alone, not the resolution: 10Y describes a range, and
   * it is still a ten-year range if you switch it to annual bars.
   */
  const active = (() => {
    const first = rows[0]
    const last = rows.at(-1)
    if (!first || !last) return null
    if (span.from <= mark(first) && span.to >= mark(last)) return "All"
    if (ytdYear != null && span.from === ytdYear * 12 && span.to >= mark(last)) return "YTD"
    return (
      PRESETS.find(
        (years) => span.from === trailing(years, span.to) && span.to >= mark(last),
      )?.toString() ?? null
    )
  })()

  const config = React.useMemo<ChartConfig>(
    () => ({ [key]: { label: basis === "real" ? `${baseYear} dollars` : "At the time", color } }),
    [key, basis, baseYear, color],
  )

  return (
    <Card className="float-1 gap-0 overflow-hidden py-0">
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
              { value: "nominal", label: "At the time" },
              { value: "real", label: `${baseYear} $` },
            ]}
          />
        </div>

        <CardAction className="flex flex-wrap items-center gap-1.5 self-center">
          <Edge rows={rows} index={start} onChange={(row) => setEdge("from", row)} label="From" />
          <span aria-hidden className="text-muted-foreground text-xs">→</span>
          <Edge rows={rows} index={end} onChange={(row) => setEdge("to", row)} label="To" />

          <span aria-hidden className="bg-border mx-1 hidden h-4 w-px sm:block" />

          {ytdCount > 1 ? (
            <Preset active={active === "YTD"} onClick={ytd}>
              YTD
            </Preset>
          ) : null}
          {PRESETS.map((years) => (
            <Preset
              key={years}
              active={active === String(years)}
              onClick={() => preset(years)}
              className="tnum font-mono"
            >
              {years}Y
            </Preset>
          ))}
          <Preset active={active === "All"} onClick={() => preset(null)}>
            All
          </Preset>
        </CardAction>

      </CardHeader>

      <CardContent className="px-2 py-3 sm:px-4 sm:py-4">
        <ChartContainer
          config={config}
          className="aspect-auto h-[clamp(17rem,40vh,28rem)] w-full"
        >
          <AreaChart
            accessibilityLayer
            data={visible}
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
                <Readout
                  rows={rows}
                  basis={basis}
                  baseYear={baseYear}
                  color={color}
                  unit={unit}
                  monthlyData={interval === "monthly"}
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
          {itemLabel}, {unit} ·{" "}
          {interval === "annual"
            ? `${visible.length} annual averages`
            : `${visible.length} monthly readings`}
          {basis === "real" ? ` · restated in ${baseYear} dollars` : " · price at the time"}
        </p>
      </CardContent>
    </Card>
  )
}

/**
 * The tooltip.
 *
 * `ChartTooltipContent` is shadcn's, and it renders one line per series — which
 * is right for a chart with several series and useless for a chart with one,
 * where the interesting content is not the value but what it is a change
 * *from*. Both bases, the step before, the same period a year earlier, and the
 * year to date are all derivable from the row's index into the full series, so
 * they cost nothing to show and answer the questions the chart otherwise makes
 * you hover four times to answer.
 */
function Readout({
  rows,
  basis,
  baseYear,
  color,
  unit,
  monthlyData,
  active,
  payload,
}: {
  rows: Row[]
  basis: Basis
  baseYear: number
  color: string
  unit: string
  monthlyData: boolean
  active?: boolean
  payload?: { payload?: Row }[]
}) {
  const row = payload?.[0]?.payload
  if (!active || !row) return null

  const value = basis === "real" ? row.real : row.nominal
  if (value == null) return null

  const delta = (from: Row | undefined) => {
    if (!from) return null
    const before = basis === "real" ? from.real : from.nominal
    if (before == null || before === 0) return null
    return { pct: (value / before - 1) * 100, from }
  }

  /*
   * Three comparisons, and which three depends on the resolution.
   *
   * Monthly: the month before, the same month a year earlier (twelve rows
   * back, which sidesteps seasonality — petrol in June is not petrol in
   * January), and the year to date, measured from the last reading of the
   * previous calendar year rather than from January, because that is what
   * "year to date" means.
   *
   * Annual: the year before, and five years before. There is no month-on-month
   * and no year-to-date to have.
   */
  const priorYearEnd = [...rows.slice(0, row.i)].reverse().find((r) => r.year === row.year - 1)

  const comparisons = monthlyData
    ? [
        { label: "Month on month", change: delta(rows[row.i - 1]) },
        { label: "Same month, prior year", change: delta(rows[row.i - 12]) },
        { label: `Since end of ${row.year - 1}`, change: delta(priorYearEnd) },
      ]
    : [
        { label: "Year on year", change: delta(rows[row.i - 1]) },
        { label: "vs 5 years earlier", change: delta(rows[row.i - 5]) },
        { label: "vs 10 years earlier", change: delta(rows[row.i - 10]) },
      ]

  return (
    <div className="bg-popover text-popover-foreground float-2 min-w-56 rounded-xl border p-3">
      <p className="text-eyebrow text-muted-foreground uppercase">{row.x}</p>

      <p className="mt-1.5 flex items-baseline gap-2">
        <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: color }} />
        <span className="tnum font-mono text-2xl leading-none font-bold">{formatUsd(value)}</span>
        <span className="text-muted-foreground text-xs">{unit}</span>
      </p>
      <p className="text-muted-foreground mt-1 pl-4 text-xs">
        {basis === "real"
          ? `${formatUsd(row.nominal)} at the time`
          : row.real == null
            ? "No CPI covers this period"
            : `${formatUsd(row.real)} in ${baseYear} dollars`}
      </p>

      {comparisons.some((c) => c.change) ? (
        <dl className="mt-2.5 space-y-1 border-t pt-2.5 text-xs">
          {comparisons.map((c) => (
            <Delta key={c.label} label={c.label} change={c.change} />
          ))}
        </dl>
      ) : null}
    </div>
  )
}

function Delta({
  label,
  change,
}: {
  label: string
  change: { pct: number; from: Row } | null
}) {
  if (!change) return null
  const up = change.pct >= 0
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="flex items-baseline gap-2">
        <span className="text-muted-foreground tnum font-mono text-[0.6875rem]">
          {change.from.x}
        </span>
        <span className={cn("tnum font-mono font-semibold", up ? "text-up" : "text-down")}>
          {up ? "+" : "−"}
          {Math.abs(change.pct).toFixed(1)}%
        </span>
      </dd>
    </div>
  )
}

/**
 * One end of the range.
 *
 * A year Select always, plus a month Select when the series is monthly —
 * rather than one Select of six hundred "Mar 1981" options, or shadcn's
 * `Calendar`, which is a day grid and this data has no days: you would be
 * picking the 14th of March to mean March's average.
 *
 * The month list is the months that exist in the chosen year, so it cannot
 * offer October 2025 — the reading BLS never collected.
 */
function Edge({
  rows,
  index,
  onChange,
  label: name,
}: {
  rows: Row[]
  index: number
  onChange: (row: Row) => void
  label: string
}) {
  const current = rows[index]
  if (!current) return null
  const monthly = current.month != null

  const years = React.useMemo(() => [...new Set(rows.map((r) => r.year))], [rows])
  const months = React.useMemo(
    () => rows.filter((r) => r.year === current.year),
    [rows, current.year],
  )

  /** Land on the same month of the new year where it exists, else the nearest. */
  const pickYear = (year: number) => {
    const inYear = rows.filter((r) => r.year === year)
    const exact = inYear.find((r) => r.month === current.month)
    onChange(exact ?? inYear[0] ?? current)
  }

  return (
    <span className="flex items-center gap-1">
      <span className="text-muted-foreground sr-only sm:not-sr-only sm:text-xs">{name}</span>
      {monthly ? (
        <Select
          value={String(current.month)}
          onValueChange={(next) => {
            const row = months.find((r) => String(r.month) === next)
            if (row) onChange(row)
          }}
        >
          <SelectTrigger size="sm" className="w-[4.5rem]" aria-label={`${name} month`}>
            {/* The value is the month number, so `SelectValue` on its own puts
                "7" in the trigger. Base UI takes a render function for exactly
                this: the stored value and the shown label are different things. */}
            <SelectValue>{(month) => MONTHS_SHORT[Number(month) - 1]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {months.map((r) => (
              <SelectItem key={r.month} value={String(r.month)}>
                {MONTHS_SHORT[r.month! - 1]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      <Select
        value={String(current.year)}
        onValueChange={(next) => next && pickYear(Number(next))}
      >
        <SelectTrigger size="sm" className="tnum w-[5.5rem] font-mono" aria-label={`${name} year`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={String(year)} className="tnum font-mono">
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </span>
  )
}

/** A range shortcut. `aria-pressed` so the state is announced, not just seen. */
function Preset({
  active,
  onClick,
  className,
  children,
}: {
  active: boolean
  onClick: () => void
  className?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-md px-2 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
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
    <div className="ruled flex overflow-hidden rounded-lg border">
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

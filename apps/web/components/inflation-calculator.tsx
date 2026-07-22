"use client"

import * as React from "react"
import { parseAsFloat, parseAsInteger, useQueryStates } from "nuqs"
import {
  Area,
  AreaChart,
  Brush,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"

import { convert, CpiTable, formatUsd, type CpiPoint } from "@workspace/core"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@workspace/ui/components/chart"
import { cn } from "@workspace/ui/lib/utils"

export interface CalculatorDefaults {
  amount: number
  from: number
  to: number
}

const CHART_CONFIG = {
  value: { label: "Equivalent value", color: "var(--chart-1)" },
} satisfies ChartConfig

/**
 * True only for the first paint of a session, and never when the visitor has
 * asked for reduced motion.
 *
 * A chart that redraws itself on every navigation is charming once and
 * irritating by the third time, so the flag is spent as soon as it is read.
 */
function useDrawIn(enabled: boolean) {
  const [draw, setDraw] = React.useState(false)

  React.useEffect(() => {
    if (!enabled) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    if (sessionStorage.getItem("fw:drawn")) return
    sessionStorage.setItem("fw:drawn", "1")
    setDraw(true)
  }, [enabled])

  return draw
}

/** Accepts "45,000", "$45,000", "45000.50". Rejects anything else. */
function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[$,\s]/g, "")
  if (!cleaned || !/^\d*\.?\d*$/.test(cleaned)) return null
  const value = Number(cleaned)
  return Number.isFinite(value) && value > 0 ? value : null
}

export function InflationCalculator({
  points,
  defaults,
  noun = "amount",
  /** Draw the line in on first paint. Home page only. */
  animate = false,
  className,
}: {
  points: CpiPoint[]
  defaults: CalculatorDefaults
  noun?: string
  animate?: boolean
  className?: string
}) {
  const drawIn = useDrawIn(animate)
  const table = React.useMemo(() => new CpiTable(points), [points])
  const years = React.useMemo(() => [...table.years].reverse(), [table])

  /**
   * The URL is the state. `shallow` stays true (the nuqs default) so typing
   * never round-trips to the server, and the throttle keeps the History API
   * inside the rate limit browsers enforce — Safari's is the strict one.
   */
  const [{ amount, from, to }, setState] = useQueryStates(
    {
      amount: parseAsFloat.withDefault(defaults.amount),
      from: parseAsInteger.withDefault(defaults.from),
      to: parseAsInteger.withDefault(defaults.to),
    },
    { throttleMs: 350 },
  )

  // A separate string for the field: "12." is a legitimate thing to be halfway
  // through typing, and it is not a number.
  //
  // Reconciled during render rather than in an effect — React's documented way
  // to adjust state when an input changes. An effect would render the stale
  // value first, so following a preset chip would visibly flash the old amount.
  const [raw, setRaw] = React.useState(() => String(amount))
  const [lastAmount, setLastAmount] = React.useState(amount)
  if (lastAmount !== amount) {
    setLastAmount(amount)
    setRaw(String(amount))
  }

  const typed = parseAmount(raw)

  const result = React.useMemo(() => {
    if (typed == null || !table.has(from) || !table.has(to)) return null
    try {
      return convert(table, { amount: typed, from: { year: from }, to: { year: to } })
    } catch {
      return null
    }
  }, [table, typed, from, to])

  const data = React.useMemo(() => {
    if (typed == null || !table.has(from)) return []
    return table.years.map((year) => ({
      year,
      value: convert(table, { amount: typed, from: { year: from }, to: { year } }).converted,
    }))
  }, [table, typed, from])

  /*
   * The two years are the chart's own selection, not a pair of controls beside
   * it. `<Brush>` is recharts' range selector: drag either end across the
   * century and the answer above follows. Two 114-option dropdowns asked the
   * reader to do the comparison in their head; a span is the same shape as the
   * question.
   */
  const indexOf = React.useCallback(
    (year: number) => Math.max(0, table.years.indexOf(year)),
    [table],
  )
  const onBrush = React.useCallback(
    (range: { startIndex?: number; endIndex?: number }) => {
      const a = table.years[range.startIndex ?? 0]
      const b = table.years[range.endIndex ?? table.years.length - 1]
      if (a == null || b == null || (a === from && b === to)) return
      setState({ from: a, to: b })
    },
    [table, from, to, setState],
  )

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="ruled bg-card flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border p-4 sm:p-6">
        <div>
          <label
            htmlFor="amount"
            className="text-eyebrow text-muted-foreground mb-2 block uppercase"
          >
            {noun} in {from}
          </label>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-mono text-lg">$</span>
            <input
              id="amount"
              inputMode="decimal"
              value={raw}
              onChange={(event) => {
                setRaw(event.target.value)
                const next = parseAmount(event.target.value)
                if (next != null) setState({ amount: next })
              }}
              aria-invalid={typed == null}
              className="ruled tnum focus-visible:border-ring h-11 w-40 border bg-transparent px-3 font-mono text-lg font-bold outline-hidden sm:text-xl"
            />
          </div>
        </div>

        <div className="text-right">
          <p className="text-eyebrow text-muted-foreground mb-2 uppercase">is worth in {to}</p>
          <p
            className={cn(
              "font-display tnum text-display leading-none",
              result ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {result ? formatUsd(result.converted) : "—"}
          </p>
        </div>
      </div>

      {result ? (
        <div className="ruled bg-card/50 grid border-x border-b sm:grid-cols-3">
          <Stat
            label="Change"
            value={`${result.percentChange >= 0 ? "+" : ""}${result.percentChange.toFixed(1)}%`}
            tone={result.percentChange >= 0 ? "up" : "down"}
            note={`${from} → ${to}`}
          />
          <Stat
            label="Multiple"
            value={`${result.inflationFactor.toFixed(2)}×`}
            note={`A ${from} dollar buys what ${formatUsd(result.inflationFactor)} buys in ${to}`}
          />
          <Stat
            label="CPI-U"
            value={`${result.fromCpi.toFixed(1)} → ${result.toCpi.toFixed(1)}`}
            note={
              result.isProvisional
                ? `${to} is provisional — not a full published year`
                : "Published annual averages"
            }
          />
        </div>
      ) : (
        <p className="ruled text-destructive border-x border-b px-4 py-3 text-sm">
          Enter a positive dollar amount.
        </p>
      )}

      {data.length ? (
        <ChartContainer
          config={CHART_CONFIG}
          className="ruled bg-card aspect-auto h-64 w-full border-x border-b p-2 sm:h-72 sm:p-4"
        >
          <AreaChart data={data} margin={{ left: 4, right: 12, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="calc-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="2 4" />
            <XAxis dataKey="year" tickLine={false} axisLine={false} tickMargin={10} minTickGap={40} />
            <YAxis
              width={64}
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              tickFormatter={(v: number) =>
                v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${Math.round(v)}`
              }
            />
            <ChartTooltip
              cursor={{ stroke: "var(--rule)", strokeWidth: 1, strokeDasharray: "3 3" }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <div className="bg-popover text-popover-foreground ruled border p-2.5 shadow-lg">
                    <p className="tnum font-mono text-base leading-none font-bold">
                      {formatUsd(Number(payload[0]!.value))}
                    </p>
                    <p className="text-muted-foreground mt-1.5 text-xs">in {label}</p>
                  </div>
                ) : null
              }
            />
            <Area
              dataKey="value"
              type="monotone"
              stroke="var(--chart-1)"
              strokeWidth={2}
              fill="url(#calc-fill)"
              isAnimationActive={drawIn}
              animationDuration={1400}
              animationEasing="ease-out"
            />
            {result ? (
              <ReferenceLine x={to} stroke="var(--chart-1)" strokeDasharray="4 3" />
            ) : null}
            <Brush
              dataKey="year"
              height={28}
              travellerWidth={8}
              startIndex={indexOf(from)}
              endIndex={indexOf(to)}
              onChange={onBrush}
              stroke="var(--chart-1)"
              fill="var(--card)"
              ariaLabel="Year range"
            />
          </AreaChart>
        </ChartContainer>
      ) : null}
    </div>
  )
}

function Stat({
  label,
  value,
  note,
  tone,
}: {
  label: string
  value: string
  note?: string
  tone?: "up" | "down"
}) {
  return (
    <div className="ruled border-b px-4 py-3 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0">
      <p className="text-eyebrow text-muted-foreground uppercase">{label}</p>
      <p
        className={cn(
          "tnum mt-1.5 font-mono text-xl leading-none font-bold",
          tone === "up" && "text-up",
          tone === "down" && "text-down",
        )}
      >
        {value}
      </p>
      {note ? <p className="text-muted-foreground mt-1.5 text-xs">{note}</p> : null}
    </div>
  )
}


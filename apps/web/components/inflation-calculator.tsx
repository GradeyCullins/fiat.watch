"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Area, AreaChart, CartesianGrid, ReferenceDot, XAxis, YAxis } from "recharts"

import { convert, CpiTable, formatUsd, type CpiPoint } from "@workspace/core"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@workspace/ui/components/chart"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { cn } from "@workspace/ui/lib/utils"

export interface CalculatorDefaults {
  amount: number
  from: number
  to: number
}

const CHART_CONFIG = {
  value: { label: "Equivalent value", color: "var(--chart-1)" },
} satisfies ChartConfig

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
  className,
}: {
  points: CpiPoint[]
  defaults: CalculatorDefaults
  noun?: string
  className?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const table = React.useMemo(() => new CpiTable(points), [points])
  const years = React.useMemo(() => [...table.years].reverse(), [table])

  const clampYear = React.useCallback(
    (value: number, fallback: number) => (table.has(value) ? value : fallback),
    [table],
  )

  const [raw, setRaw] = React.useState(() => params.get("amount") ?? String(defaults.amount))
  const [from, setFrom] = React.useState(() =>
    clampYear(Number(params.get("from")), defaults.from),
  )
  const [to, setTo] = React.useState(() => clampYear(Number(params.get("to")), defaults.to))

  const amount = parseAmount(raw)

  // The URL is the shareable state. Replace rather than push so the back
  // button leaves the page instead of walking every keystroke.
  React.useEffect(() => {
    if (amount == null) return
    const next = new URLSearchParams({ amount: String(amount), from: String(from), to: String(to) })
    const timer = window.setTimeout(
      () => router.replace(`${pathname}?${next}`, { scroll: false }),
      250,
    )
    return () => window.clearTimeout(timer)
  }, [amount, from, to, pathname, router])

  const result = React.useMemo(() => {
    if (amount == null) return null
    try {
      return convert(table, { amount, from: { year: from }, to: { year: to } })
    } catch {
      return null
    }
  }, [table, amount, from, to])

  // The same amount carried across every year in the series — the shape of
  // this curve is the answer, the single figure is just the read-off.
  const data = React.useMemo(() => {
    if (amount == null) return []
    return table.years.map((year) => ({
      year,
      value: convert(table, { amount, from: { year: from }, to: { year } }).converted,
    }))
  }, [table, amount, from])

  const pct = result ? result.percentChange : null

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="ruled bg-card brutal-6 border-2 p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-4 text-xl sm:text-2xl">
          <span className="text-muted-foreground">$</span>
          <Input
            inputMode="decimal"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            aria-label={`The ${noun} to convert`}
            aria-invalid={amount == null}
            className="ruled tnum h-12 w-44 border-2 px-3 font-mono text-xl font-bold sm:text-2xl"
          />
          <span className="text-muted-foreground">in</span>
          <YearSelect value={from} onChange={setFrom} years={years} label="Original year" />
          <span className="text-muted-foreground">is worth</span>
        </div>

        <div className="mt-6 flex flex-wrap items-end gap-x-4 gap-y-3">
          <p
            className={cn(
              "font-display tnum text-display leading-none",
              result ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {result ? formatUsd(result.converted) : "—"}
          </p>
          <div className="mb-2 flex items-center gap-3">
            <span className="text-muted-foreground text-xl sm:text-2xl">in</span>
            <YearSelect value={to} onChange={setTo} years={years} label="Comparison year" />
          </div>
        </div>

        {result ? (
          <p className="text-muted-foreground mt-4 text-sm">
            <span
              className={cn(
                "ruled tnum mr-2 inline-block border-2 px-1.5 py-0.5 font-mono font-bold",
                pct! >= 0 ? "bg-primary text-primary-foreground" : "bg-card text-foreground",
              )}
            >
              {pct! >= 0 ? "+" : ""}
              {pct!.toFixed(1)}%
            </span>
            Prices rose {(result.inflationFactor).toFixed(2)}× between {from} and {to}. A dollar in{" "}
            {from} bought what {formatUsd(result.inflationFactor)} buys in {to}.
            {result.isProvisional ? (
              <em className="ml-1 not-italic opacity-80">
                {to} is provisional — BLS has not published a full year yet.
              </em>
            ) : null}
          </p>
        ) : (
          <p className="text-destructive mt-4 text-sm">Enter a positive dollar amount.</p>
        )}
      </div>

      {data.length ? (
        <ChartContainer
          config={CHART_CONFIG}
          className="ruled bg-card aspect-auto h-64 w-full border-2 p-2 sm:h-72 sm:p-4"
        >
          <AreaChart data={data} margin={{ left: 4, right: 12, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="calc-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
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
              cursor={{ stroke: "var(--rule)", strokeWidth: 1 }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <div className="bg-popover text-popover-foreground ruled brutal-4 border-2 p-3">
                    <p className="font-display tnum text-lg leading-none font-extrabold">
                      {formatUsd(Number(payload[0]!.value))}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">in {label}</p>
                  </div>
                ) : null
              }
            />
            <Area
              dataKey="value"
              type="monotone"
              stroke="var(--chart-1)"
              strokeWidth={2.25}
              fill="url(#calc-fill)"
              isAnimationActive={false}
            />
            {result ? (
              <ReferenceDot
                x={to}
                y={result.converted}
                r={5}
                fill="var(--chart-1)"
                stroke="var(--card)"
                strokeWidth={2}
              />
            ) : null}
          </AreaChart>
        </ChartContainer>
      ) : null}
    </div>
  )
}

function YearSelect({
  value,
  onChange,
  years,
  label,
}: {
  value: number
  onChange: (year: number) => void
  years: readonly number[]
  label: string
}) {
  return (
    <Select value={String(value)} onValueChange={(next) => onChange(Number(next))}>
      <SelectTrigger
        aria-label={label}
        className="ruled tnum h-12 border-2 px-3 font-mono text-xl font-bold sm:text-2xl"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="ruled max-h-72 rounded-none border-2">
        {years.map((year) => (
          <SelectItem key={year} value={String(year)} className="tnum font-mono">
            {year}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

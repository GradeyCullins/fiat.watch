import { InfoIcon } from "lucide-react"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

/**
 * Where a number came from, attached to the number.
 *
 * Two reasons this exists, and the second is the important one.
 *
 * For a reader: this site's whole argument is that the official figures
 * understate what they feel. An argument like that is only worth anything if
 * it is scrupulous about what each number actually is — the survey, the
 * series, and what the survey does *not* claim. Being the site that always
 * says so is the cheapest credibility available, and the survey of comparable
 * sites found that not one of them does it: officialdata.org never states its
 * base period anywhere, on any page.
 *
 * For us: two different BLS products are on this site and they are easy to
 * confuse. Average Price data is a dollar level actually collected in shops.
 * The CPI is an index of change, quality-adjusted, and never a dollar. Writing
 * the distinction into a component means the next person adding a figure has
 * to say which one it is.
 */
export type Survey = "ap" | "cpi"

const SURVEYS: Record<Survey, { name: string; measures: string; caveat: string }> = {
  ap: {
    name: "BLS Average Price Data",
    measures:
      "The average price actually paid, collected each month from shops in 75 urban areas.",
    // BLS: "Average prices are estimates of the average price paid by the
    // consumer, not estimates of price change."
    caveat:
      "A price level, not an inflation rate. Percentages here compare one year's average with another's — close to the official CPI rate for this item, but not the same number, because average prices are not quality-adjusted.",
  },
  cpi: {
    name: "BLS Consumer Price Index (CPI-U)",
    measures:
      "An index of price change for all urban consumers, not seasonally adjusted.",
    caveat:
      "An index, not a dollar amount. It measures change against a base period, and it is adjusted for changes in quality and package size.",
  },
}

export function DataSource({
  survey,
  seriesId,
  blsName,
  basePeriod,
  className,
  children,
}: {
  survey: Survey
  /** The exact BLS series, e.g. APU0000708111. Named so it can be looked up. */
  seriesId?: string
  /**
   * BLS's own name for the item, e.g. "Eggs, grade A, large, per doz.".
   *
   * Our labels are short because short is what people search — the page is
   * "eggs", not "eggs, grade A, large". But the series is a specific product,
   * and the difference is not cosmetic: BLS publishes an average price for
   * grade A large and grade AA large and nothing broader, so "eggs" on this
   * site means grade A large and the reader deserves to be able to find that
   * out.
   */
  blsName?: string
  /** CPI only — "1982-84 = 100". Never omit it on an index figure. */
  basePeriod?: string
  className?: string
  /** What the tooltip hangs off. Defaults to a small ⓘ. */
  children?: React.ReactNode
}) {
  const meta = SURVEYS[survey]

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={`Source: ${meta.name}${seriesId ? `, series ${seriesId}` : ""}`}
            className={cn(
              "text-muted-foreground hover:text-foreground inline-flex items-center align-middle transition-colors",
              className,
            )}
          />
        }
      >
        {children ?? <InfoIcon className="size-3.5" />}
      </TooltipTrigger>

      {/* shadcn's TooltipContent is `inline-flex items-center gap-1.5` — built
          for one short line, so several paragraphs come out as side-by-side
          columns. This is more than a tooltip normally carries, so it has to
          opt into a column. */}
      <TooltipContent className="max-w-[18rem] flex-col items-start gap-1.5 py-2 text-left leading-relaxed">
        <p className="font-semibold">{meta.name}</p>
        {seriesId ? (
          <p className="tnum font-mono text-[0.6875rem] opacity-80">
            {seriesId}
            {basePeriod ? ` · ${basePeriod}` : null}
          </p>
        ) : null}
        {blsName ? <p className="opacity-90">Exact series: “{blsName}”</p> : null}
        <p className="opacity-90">{meta.measures}</p>
        <p className="opacity-70">{meta.caveat}</p>
      </TooltipContent>
    </Tooltip>
  )
}

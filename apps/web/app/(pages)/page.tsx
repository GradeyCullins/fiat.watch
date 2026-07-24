import Link from "next/link"

import { formatUsd } from "@workspace/core"

import { CardRail, ItemCard } from "@/components/item-card"
import { assertSlugsExist } from "@/lib/coverage"
import { CALCULATORS, calculatorPath, GENERAL_CALCULATOR } from "@/lib/calculators"
import { getAnnual, getCpiTable, getItems } from "@/lib/data"
import { jsonLd, pageMetadata, SITE } from "@/lib/site"

export const metadata = pageMetadata({
  // No " | Fiat Watch" suffix — the root layout's title template adds it.
  title: "US Prices and Inflation, 1913 to Today",
  description:
    "What things actually cost, year by year, from official BLS data. Average prices for 160 everyday items plus eight inflation calculators.",
  path: "/",
})

/**
 * The front door: two shelves, nothing else.
 *
 * It used to *be* the general inflation calculator — headline, tool, chart —
 * which made `/` both the home page and the eighth calculator while the other
 * seven lived in a section that did not contain it. The tool now has its own
 * URL at `/calculators/inflation` and this page's job is to point at things.
 *
 * The old headline also spoiled the calculator's default answer: 3¢, $33.73,
 * +3273.3%, 33.73× and 9.9 → 334.0 were the same fact five times, printed
 * above the tool that computes it. What survives is the one sentence, because
 * it is the reason to care, not the output of a form.
 */
export default async function Page() {
  const [table, items] = await Promise.all([getCpiTable(), getItems()])

  const earliest = table.earliestYear
  const baseYear = table.latestYear

  // A sample, not the catalogue. There are 160 items; `/costs` is the list.
  const FEATURED = [
    "gas", "eggs", "bread", "milk", "ground-beef", "ground-coffee",
    "bacon", "bananas", "boneless-chicken-breast", "butter", "electricity", "sugar",
  ]
  assertSlugsExist("home picker", FEATURED, new Set(items.map((i) => i.slug)))
  const picker = await Promise.all(
    FEATURED.map(async (slug) => {
      const item = items.find((i) => i.slug === slug)!
      return { item, latest: (await getAnnual(slug)).at(-1)?.value ?? 0 }
    }),
  )

  return (
    <main className="mx-auto w-full max-w-[1800px] px-4 py-8 sm:px-6 sm:py-10 xl:px-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd({
          "@type": "WebSite",
          name: SITE.name,
          url: SITE.url.toString(),
          description:
            "US average prices and inflation, from Bureau of Labor Statistics data.",
        })}
      />

      {/*
        No year in the headline.

        It read "since 1973", taken from the earliest first-year across the
        catalogue — and exactly two of the 160 items go back that far. The
        median item starts in 1980 and some do not begin until 2018, so
        "everything since 1973" claimed a depth the data does not have. There
        is no single honest year to put here, so there is no year.

        No width cap either: it sat in `max-w-3xl`, which stopped the type at
        768px inside a container with 1800px available.
      */}
      <div className="mb-8">
        <p className="text-eyebrow text-muted-foreground uppercase">
          US average prices · Bureau of Labor Statistics
        </p>
        <h1 className="font-display text-display mt-2 text-balance">
          The price of{" "}
          {/* The `{" "}` is load-bearing. Without it the heading's text content
              is "The price ofeverything" — the margin makes it *look* spaced,
              but that is the string a screen reader announces and Google
              indexes. `ml-2` not `mx-2`: nothing follows the box now, and a right
              margin left the full stop floating a quarter-inch away. */}
          <span className="text-primary-foreground bg-primary ruled ml-2 inline-block -rotate-1 border-2 px-2.5 align-baseline">
            everything
          </span>
        </h1>
      </div>

      <Shelf
        title="Calculators"
        blurb={`What your money was worth, ${earliest} to ${baseYear}`}
        href="/calculators"
      >
        <CalculatorCard
          href={GENERAL_CALCULATOR.path}
          emoji={GENERAL_CALCULATOR.emoji}
          label={GENERAL_CALCULATOR.label}
          meta={`${earliest}–${baseYear}`}
        />
        {CALCULATORS.map((c) => (
          <CalculatorCard
            key={c.slug}
            href={calculatorPath(c.slug)}
            emoji={c.emoji}
            label={c.heading.replace(" inflation calculator", "")}
            meta="Inflation calculator"
          />
        ))}
      </Shelf>

      <Shelf
        title="Prices"
        blurb={`${items.length} items BLS actually priced, not an index`}
        href="/costs"
        className="mt-10"
      >
        {picker.map(({ item, latest }) => (
          <li key={item.slug}>
          <ItemCard
            slug={item.slug}
            label={item.label}
            meta={`${item.unit} · ${item.firstYear}–${item.lastYear}`}
            value={formatUsd(latest)}
            href={`/costs/${item.slug}`}
          />
          </li>
        ))}
      </Shelf>
    </main>
  )
}

/** A titled row of cards, with the section it belongs to linked from the head. */
function Shelf({
  title,
  blurb,
  href,
  className,
  children,
}: {
  title: string
  blurb: string
  href: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={className}>
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="font-display text-xl font-bold tracking-tight">{title}</h2>
        <p className="text-muted-foreground text-sm">{blurb}</p>
        <Link
          href={href}
          className="text-muted-foreground hover:text-foreground ml-auto text-sm underline underline-offset-4"
        >
          See all →
        </Link>
      </div>
      <CardRail>
        {/* `ItemCard` renders its own <li>; these are wrapped to match. */}
        {children}
      </CardRail>
    </section>
  )
}

function CalculatorCard({
  href,
  emoji,
  label,
  meta,
}: {
  href: string
  emoji: string
  label: string
  meta: string
}) {
  return (
    <li>
      <Link
        href={href}
        className="group bg-card float-1 hover:float-2 hover:border-primary/40 flex h-full flex-col items-center gap-2 rounded-2xl border px-4 py-5 text-center transition-all hover:-translate-y-1"
      >
        <span
          aria-hidden
          className="grid size-16 place-items-center text-[3rem] leading-none transition-transform group-hover:scale-105"
        >
          {emoji}
        </span>
        <span className="mt-0.5 w-full">
          <span className="block truncate text-sm font-medium first-letter:uppercase">
            {label}
          </span>
          <span className="text-muted-foreground block truncate text-[0.6875rem]">{meta}</span>
        </span>
      </Link>
    </li>
  )
}

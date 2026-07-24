import { Fragment } from "react"
import Link from "next/link"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { cn } from "@workspace/ui/lib/utils"

import { jsonLd, SITE } from "@/lib/site"

export interface Crumb {
  label: string
  href?: string
}

/**
 * Breadcrumbs, rendered and marked up. The old site had a three-level URL
 * hierarchy and zero BreadcrumbList markup on any of it.
 */
export function Crumbs({ trail }: { trail: Crumb[] }) {
  /*
   * Drop any crumb that resolves to the same URL as the one before it.
   *
   * Several trails pointed a middle level at "/" because the section it named
   * had no index page yet, which emitted the same URL at positions 1 and 2 —
   * a malformed BreadcrumbList, and two adjacent visible links going to the
   * same place. Guarding here rather than at each call site means a future
   * trail cannot reintroduce it.
   */
  const seen = new Set<string>()
  trail = trail.filter((crumb, i) => {
    if (!crumb.href) return true
    if (seen.has(crumb.href) && i > 0) return false
    seen.add(crumb.href)
    return true
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd({
          "@type": "BreadcrumbList",
          itemListElement: trail.map((crumb, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: crumb.label,
            ...(crumb.href ? { item: new URL(crumb.href, SITE.url).toString() } : {}),
          })),
        })}
      />
      <Breadcrumb className="mb-4">
        <BreadcrumbList className="text-eyebrow uppercase">
          {/* The separator renders its own <li>, so it has to be a sibling of
              the item rather than a child of it. */}
          {trail.map((crumb, i) => {
            const last = i === trail.length - 1
            return (
              <Fragment key={crumb.label}>
                <BreadcrumbItem>
                  {crumb.href && !last ? (
                    <BreadcrumbLink render={<Link href={crumb.href} />}>
                      {crumb.label}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {last ? null : <BreadcrumbSeparator />}
              </Fragment>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </>
  )
}

export function Shell({
  children,
  className,
  wide,
}: {
  children: React.ReactNode
  className?: string
  wide?: boolean
}) {
  return (
    <main
      className={cn(
        "mx-auto w-full px-4 py-8 sm:px-6 sm:py-12 xl:px-10",
        wide ? "max-w-[1800px]" : "max-w-5xl",
        className,
      )}
    >
      {children}
    </main>
  )
}

/** The row of figures that opens every data page. Four across on desktop. */
export function StatRail({ children }: { children: React.ReactNode }) {
  return (
    <div className="ruled bg-card float-1 grid overflow-hidden rounded-xl border sm:grid-cols-2 lg:grid-cols-4">
      {children}
    </div>
  )
}

/**
 * Which way is "good" on a page about the cost of living.
 *
 * Every figure here was coloured with stock-market logic — up green, down red —
 * which is right when you hold the asset and exactly backwards when you buy it.
 * Gas rising 17.6% was printed in the same green as a portfolio gain, on a site
 * whose argument is that rising prices are your money being debased.
 *
 * `up`/`down` stay as the *direction* tokens. This maps a price movement onto
 * how it lands for the reader: dearer is bad, cheaper is good.
 */
export const priceTone = (change: number | null | undefined): "up" | "down" | undefined =>
  change == null ? undefined : change > 0 ? "down" : "up"

export function Stat({
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
    <div className="ruled border-b px-4 py-3 last:border-b-0 sm:border-r sm:[&:nth-child(2n)]:border-r-0 lg:border-r lg:border-b-0 lg:[&:nth-child(2n)]:border-r lg:last:border-r-0">
      <p className="text-eyebrow text-muted-foreground uppercase">{label}</p>
      <p
        className={cn(
          "tnum mt-1.5 font-mono text-2xl leading-none font-bold",
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

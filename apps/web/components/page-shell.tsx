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
    <div className="ruled bg-card grid border sm:grid-cols-2 lg:grid-cols-4">{children}</div>
  )
}

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

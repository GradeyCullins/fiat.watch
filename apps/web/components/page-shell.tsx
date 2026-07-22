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
      <Breadcrumb className="mb-6">
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

export function PageTitle({
  eyebrow,
  children,
  lede,
}: {
  eyebrow?: string
  children: React.ReactNode
  lede?: React.ReactNode
}) {
  return (
    <div className="mb-8">
      {eyebrow ? (
        <p className="text-eyebrow text-muted-foreground mb-3 uppercase">{eyebrow}</p>
      ) : null}
      <h1 className="font-display text-headline text-balance">{children}</h1>
      {lede ? (
        <p className="text-muted-foreground mt-4 max-w-2xl text-base text-pretty">{lede}</p>
      ) : null}
    </div>
  )
}

export function Section({
  title,
  children,
  className,
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("mt-12", className)}>
      <h2 className="font-display mb-4 text-2xl font-bold tracking-tight">{title}</h2>
      {children}
    </section>
  )
}

/**
 * The FAQ block and its JSON-LD are generated from one array, so the markup
 * cannot drift from the visible questions. On the old site the homepage
 * declared three questions in `FAQPage` and displayed a different set.
 */
export function Faq({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd({
          "@type": "FAQPage",
          mainEntity: items.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        })}
      />
      <dl className="ruled divide-y-2 border-2 [&>div]:p-4 sm:[&>div]:p-5">
        {items.map((item) => (
          <div key={item.question}>
            <dt className="font-display text-lg font-bold">{item.question}</dt>
            <dd className="text-muted-foreground mt-1.5 text-sm text-pretty">{item.answer}</dd>
          </div>
        ))}
      </dl>
    </>
  )
}

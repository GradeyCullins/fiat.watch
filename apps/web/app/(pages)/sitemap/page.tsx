import Link from "next/link"

import { Crumbs, Shell } from "@/components/page-shell"
import { CALCULATORS } from "@/lib/calculators"
import { getAnnual, getItems, getPriceKeys } from "@/lib/data"
import { emojiFor } from "@/lib/emoji"
import { pageMetadata } from "@/lib/site"

export const metadata = pageMetadata({
  title: "Sitemap",
  description: "Every calculator and every price series on Fiat Watch.",
  path: "/sitemap",
})

export default async function Page() {
  const items = await getItems()
  const keys = await getPriceKeys()

  const perItem = await Promise.all(
    items.map(async (item) => ({ item, rows: await getAnnual(item.slug) })),
  )

  return (
    <Shell wide>
      <Crumbs trail={[{ label: "Fiat Watch", href: "/" }, { label: "Sitemap" }]} />

      <div className="mb-6">
        <h1 className="font-display text-2xl leading-none font-extrabold tracking-tight sm:text-3xl">
          Everything on this site
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {keys.length.toLocaleString()} monthly readings. Year pages link on to every month BLS
          published for that year.
        </p>
      </div>

      <Section title="Tools">
        <ul className="flex flex-wrap gap-2">
          <SitemapLink href="/">Inflation calculator</SitemapLink>
          {CALCULATORS.map((c) => (
            <SitemapLink key={c.slug} href={c.path}>
              {c.heading}
            </SitemapLink>
          ))}
        </ul>
      </Section>

      {perItem.map(({ item, rows }) => (
        <Section key={item.slug} title={`Historical ${item.labelAttributive} prices`}>
          <div className="mb-3 flex items-center gap-2">
            <span aria-hidden className="size-5 grid place-items-center">{emojiFor(item.slug)}</span>
            <Link
              href={`/costs/${item.slug}`}
              className="text-sm font-medium underline underline-offset-4"
            >
              /costs/{item.slug}
            </Link>
            <span className="text-muted-foreground text-sm">
              · {rows.length} years · {item.unit}
            </span>
          </div>
          <ul className="flex flex-wrap gap-1.5">
            {rows.map((row) => (
              <SitemapLink key={row.year} href={`/costs/${item.slug}/${row.year}`} compact>
                {row.year}
              </SitemapLink>
            ))}
          </ul>
        </Section>
      ))}
    </Shell>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display mb-3 text-lg font-bold tracking-tight">{title}</h2>
      {children}
    </section>
  )
}

function SitemapLink({
  href,
  children,
  compact,
}: {
  href: string
  children: React.ReactNode
  compact?: boolean
}) {
  return (
    <li>
      <Link
        href={href}
        className={
          compact
            ? "ruled hover:bg-primary hover:text-primary-foreground tnum block border-2 px-2 py-0.5 font-mono text-xs transition-colors"
            : "ruled hover:bg-primary hover:text-primary-foreground block border-2 px-2.5 py-1 text-sm transition-colors"
        }
      >
        {children}
      </Link>
    </li>
  )
}

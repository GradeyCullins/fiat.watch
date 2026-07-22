import Link from "next/link"

import { ItemArt } from "@/components/item-art"
import { Crumbs, PageTitle, Section, Shell } from "@/components/page-shell"
import { CALCULATORS } from "@/lib/calculators"
import { getAnnual, getItems, getPriceKeys } from "@/lib/data"
import { colorFor } from "@/lib/series"
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

      <PageTitle
        eyebrow={`${keys.length.toLocaleString()} monthly readings`}
        lede="Year pages link on to every month BLS published for that year."
      >
        Everything on this site
      </PageTitle>

      <Section title="Tools">
        <ul className="flex flex-wrap gap-2">
          <SitemapLink href="/">Compare prices</SitemapLink>
          <SitemapLink href="/calculator">Inflation calculator</SitemapLink>
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
            <ItemArt slug={item.slug} className="size-5" style={{ color: colorFor(item.slug) }} />
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

import Link from "next/link"

import { CALCULATORS } from "@/lib/calculators"
import { assertSlugsExist } from "@/lib/coverage"
import { getItems } from "@/lib/data"

export async function SiteFooter() {
  const items = await getItems()
  const FEATURED = ["gas", "eggs", "bread", "milk", "ground-beef", "ground-coffee", "bacon"]
  assertSlugsExist("site footer", FEATURED, new Set(items.map((i) => i.slug)))
  const featured = FEATURED.map((slug) => items.find((i) => i.slug === slug)).filter(
    (i): i is NonNullable<typeof i> => Boolean(i),
  )

  return (
    <footer className="ruled mt-12 border-t">
      <div className="mx-auto grid w-full max-w-[1800px] gap-8 px-4 py-8 sm:grid-cols-3 sm:px-6 xl:px-10">
        <FooterColumn title="Calculators">
          <FooterLink href="/">Inflation calculator</FooterLink>
          {CALCULATORS.map((c) => (
            <FooterLink key={c.slug} href={c.path}>
              {c.heading.replace(" inflation calculator", "")}
            </FooterLink>
          ))}
        </FooterColumn>

        <FooterColumn title="Prices">
          {/* A sample. There are 160 items — the full list is /costs, and a
              footer that enumerates a catalogue is not a footer. */}
          {featured.map((item) => (
            <FooterLink key={item.slug} href={`/costs/${item.slug}`}>
              {item.label}
            </FooterLink>
          ))}
          <FooterLink href="/costs">
            <span className="text-foreground">All {items.length} items →</span>
          </FooterLink>
        </FooterColumn>

        <FooterColumn title="Fiat Watch">
          {/* Linked deliberately — the HTML sitemap was orphaned on the old site. */}
          <FooterLink href="/sitemap">Every page</FooterLink>
        </FooterColumn>
      </div>

      <div className="ruled text-muted-foreground flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-xs sm:px-6 xl:px-10">
        <span>US Bureau of Labor Statistics · CPI-U and Average Price Data</span>
        <span className="tnum font-mono">National averages, not seasonally adjusted</span>
      </div>
    </footer>
  )
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-eyebrow text-muted-foreground mb-2.5 uppercase">{title}</p>
      <ul className="space-y-1">{children}</ul>
    </div>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="hover:text-foreground text-muted-foreground text-sm">
        {children}
      </Link>
    </li>
  )
}

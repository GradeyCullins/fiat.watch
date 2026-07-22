import Link from "next/link"

import { CALCULATORS } from "@/lib/calculators"
import { getItems } from "@/lib/data"

export async function SiteFooter() {
  const items = await getItems()

  return (
    <footer className="ruled border-t-2">
      <div className="mx-auto grid w-full max-w-[1800px] gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 xl:px-10">
        <div>
          <p className="font-display text-xl font-extrabold tracking-tight">FIAT WATCH</p>
          <p className="text-muted-foreground mt-2 max-w-xs text-sm">
            US consumer prices since 1913, straight from the Bureau of Labor Statistics. No
            estimates, no smoothing.
          </p>
        </div>

        <FooterColumn title="Calculators">
          {CALCULATORS.map((c) => (
            <FooterLink key={c.slug} href={c.path}>
              {c.heading}
            </FooterLink>
          ))}
        </FooterColumn>

        <FooterColumn title="Prices">
          {items.map((item) => (
            <FooterLink key={item.slug} href={`/costs/${item.slug}`}>
              Historical {item.labelAttributive} prices
            </FooterLink>
          ))}
        </FooterColumn>

        <FooterColumn title="About">
          <FooterLink href="/">Compare prices</FooterLink>
          <FooterLink href="/calculator">Inflation calculator</FooterLink>
          {/* Linked deliberately — the HTML sitemap was orphaned on the old site. */}
          <FooterLink href="/sitemap">Sitemap</FooterLink>
          <FooterLink href="https://www.bls.gov/cpi/">BLS CPI home</FooterLink>
        </FooterColumn>
      </div>

      <div className="ruled text-muted-foreground border-t-2 px-4 py-4 text-xs sm:px-6 xl:px-10">
        Source: US Bureau of Labor Statistics, CPI-U (CUUR0000SA0) and Average Price Data. Figures
        are national averages and are not seasonally adjusted.
      </div>
    </footer>
  )
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-eyebrow text-muted-foreground mb-3 uppercase">{title}</p>
      <ul className="space-y-1.5">{children}</ul>
    </div>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="hover:text-foreground text-sm underline-offset-4 hover:underline">
        {children}
      </Link>
    </li>
  )
}

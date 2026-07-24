import Link from "next/link"
import { MenuIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet"

import { GlobeLink } from "@/components/globe-link"
import { LogoMark } from "@/components/logo"
import { PriceTicker } from "@/components/price-ticker"
import { TickerSlot } from "@/components/ticker-slot"
import { SiteSearch } from "@/components/site-search"
import { ThemeToggle } from "@/components/theme-toggle"
import { CALCULATORS, calculatorPath, GENERAL_CALCULATOR } from "@/lib/calculators"
import { getItems } from "@/lib/data"
import { buildSearchIndex } from "@/lib/search"
import { assertSlugsExist } from "@/lib/coverage"
import { emojiFor } from "@/lib/emoji"

function Wordmark() {
  return (
    <Link
      href="/"
      className="font-display flex shrink-0 items-center gap-2 text-base leading-none font-extrabold tracking-tight"
    >
      <LogoMark className="text-primary size-7" />
      <span className="hidden sm:inline">FIAT WATCH</span>
    </Link>
  )
}

export async function SiteHeader() {
  const [items, index] = await Promise.all([getItems(), buildSearchIndex()])

  // The mobile sheet still lists a few items; the desktop nav does not. A
  // "Prices" dropdown that names eight of a hundred and sixty is a worse
  // version of the search field it sat next to.
  const FEATURED = ["gas", "eggs", "bread", "milk", "ground-beef", "ground-coffee", "bacon", "electricity"]
  assertSlugsExist("site nav", FEATURED, new Set(items.map((i) => i.slug)))
  const featured = FEATURED.map((slug) => items.find((i) => i.slug === slug)).filter(
    (i): i is NonNullable<typeof i> => Boolean(i),
  )

  return (
    <header className="bg-background/90 sticky top-0 z-40 backdrop-blur">
      {/* Three tracks, so the search sits on the centre line of the viewport
          rather than wherever the left-hand nav happens to end. */}
      <div className="mx-auto flex h-14 w-full max-w-[1800px] items-center gap-2 px-4 sm:px-6 xl:px-10">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Wordmark />
          {/* A link, not a dropdown. The menu listed eight items that the
              /calculators index now lists better, and the search field beside
              it has a Calculators tab that finds them faster than a hover. */}
          <nav className="ml-1 hidden items-center lg:flex">
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href="/calculators" />}
              className="font-medium"
            >
              Calculators
            </Button>
          </nav>
        </div>

        {/* `min-w-0`: without it the flex item refuses to shrink below its
            content and pushes the trailing buttons off a phone screen. */}
        <div className="flex w-full min-w-0 max-w-xs shrink items-center gap-1.5 sm:max-w-sm lg:max-w-lg">
          <SiteSearch index={index} className="min-w-0 flex-1" />
          <GlobeLink />
        </div>

        <div className="flex flex-1 items-center justify-end gap-1">

          {/* No auth exists yet, so these are buttons rather than links —
              /login and /signup would be two crawlable 404s. */}
          <Button variant="ghost" size="sm" className="hidden font-medium sm:inline-flex">
            Log in
          </Button>
          <Button size="sm" className="hidden rounded-full font-semibold sm:inline-flex">
            Sign up
          </Button>

          <ThemeToggle />

          <Sheet>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menu" />
              }
            >
              <MenuIcon className="size-4" />
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle className="font-display text-xl">Fiat Watch</SheetTitle>
                <SheetDescription>What your money was really worth.</SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col gap-6 overflow-y-auto px-4 pb-8">
                <MobileGroup title="Calculators">
                  <MobileLink href={GENERAL_CALCULATOR.path}>
                    <span aria-hidden className="text-lg">{GENERAL_CALCULATOR.emoji}</span>
                    {GENERAL_CALCULATOR.label}
                  </MobileLink>
                  {CALCULATORS.map((c) => (
                    <MobileLink key={c.slug} href={calculatorPath(c.slug)}>
                      <span aria-hidden className="text-lg">{c.emoji}</span>
                      {c.heading.replace(" inflation calculator", "")}
                    </MobileLink>
                  ))}
                </MobileGroup>
                <MobileGroup title="Prices">
                  {featured.map((item) => (
                    <MobileLink key={item.slug} href={`/costs/${item.slug}`}>
                      <span aria-hidden className="text-lg">{emojiFor(item.slug)}</span>
                      <span className="first-letter:uppercase">{item.label}</span>
                    </MobileLink>
                  ))}
                  <MobileLink href="/costs">All {items.length} items →</MobileLink>
                </MobileGroup>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <TickerSlot>
        <PriceTicker />
      </TickerSlot>
    </header>
  )
}

function MobileGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-muted-foreground text-eyebrow mb-2 uppercase">{title}</p>
      <div className="flex flex-col">{children}</div>
    </div>
  )
}

function MobileLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="hover:bg-accent -mx-2 flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium"
    >
      {children}
    </Link>
  )
}

import Link from "next/link"
import { ChevronDownIcon, MenuIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet"

import { ItemArt } from "@/components/item-art"
import { PriceTicker } from "@/components/price-ticker"
import { SiteSearch } from "@/components/site-search"
import { ThemeToggle } from "@/components/theme-toggle"
import { CALCULATORS } from "@/lib/calculators"
import { getItems } from "@/lib/data"
import { buildSearchIndex } from "@/lib/search"
import { colorFor } from "@/lib/series"

function Wordmark() {
  return (
    <Link
      href="/"
      className="flex shrink-0 items-center gap-2 font-display text-base leading-none font-extrabold tracking-tight"
    >
      <span className="bg-primary text-primary-foreground grid size-7 place-items-center text-sm">
        $
      </span>
      <span className="hidden sm:inline">FIAT WATCH</span>
    </Link>
  )
}

export async function SiteHeader() {
  const [items, index] = await Promise.all([getItems(), buildSearchIndex()])

  return (
    <header className="bg-background/90 ruled sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[1800px] items-center gap-2 px-4 sm:px-6 xl:px-10">
        <Wordmark />

        {/*
          Two menus, not three. There used to be a standalone "Calculator" link
          beside a "Calculators" dropdown, which asked the visitor to work out
          the difference between them. The general CPI tool is a calculator, so
          it is the first item in the menu with the other seven.
        */}
        <nav className="ml-2 hidden items-center lg:flex">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="sm" className="font-medium" />}
            >
              Calculators
              <ChevronDownIcon className="size-3.5 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="ruled w-auto min-w-64 border">
              <DropdownMenuItem render={<Link href="/calculator" />}>
                Inflation calculator
                <span className="text-muted-foreground ml-auto text-xs">Any amount</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {CALCULATORS.map((c) => (
                <DropdownMenuItem key={c.slug} render={<Link href={c.path} />}>
                  {c.heading.replace(" inflation calculator", "")}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="sm" className="font-medium" />}
            >
              Prices
              <ChevronDownIcon className="size-3.5 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="ruled w-auto min-w-64 border">
              {items.map((item) => (
                <DropdownMenuItem key={item.slug} render={<Link href={`/costs/${item.slug}`} />}>
                  <ItemArt
                    slug={item.slug}
                    className="size-4"
                    style={{ color: colorFor(item.slug) }}
                  />
                  {item.label}
                  <span className="text-muted-foreground tnum ml-auto text-xs">
                    {item.firstYear}–{item.lastYear}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* `min-w-0`: without it the flex item refuses to shrink below its
            content and pushes the trailing buttons off a phone screen. */}
        <div className="ml-auto min-w-0 flex-1 lg:max-w-md xl:max-w-lg">
          <SiteSearch index={index} />
        </div>

        <ThemeToggle />

        <Sheet>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menu" />
            }
          >
            <MenuIcon className="size-4" />
          </SheetTrigger>
          <SheetContent side="right" className="ruled w-80 border-l">
            <SheetHeader>
              <SheetTitle className="font-display text-xl">Fiat Watch</SheetTitle>
              <SheetDescription>What your money was really worth.</SheetDescription>
            </SheetHeader>
            <nav className="flex flex-col gap-6 overflow-y-auto px-4 pb-8">
              <MobileGroup title="Calculators">
                <MobileLink href="/calculator">Inflation calculator</MobileLink>
                {CALCULATORS.map((c) => (
                  <MobileLink key={c.slug} href={c.path}>
                    {c.heading.replace(" inflation calculator", "")}
                  </MobileLink>
                ))}
              </MobileGroup>
              <MobileGroup title="Prices">
                {items.map((item) => (
                  <MobileLink key={item.slug} href={`/costs/${item.slug}`}>
                    <ItemArt
                      slug={item.slug}
                      className="size-4"
                      style={{ color: colorFor(item.slug) }}
                    />
                    {item.label}
                  </MobileLink>
                ))}
              </MobileGroup>
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      <PriceTicker />
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
      className="hover:bg-accent -mx-2 flex items-center gap-2 px-2 py-2 text-sm font-medium"
    >
      {children}
    </Link>
  )
}

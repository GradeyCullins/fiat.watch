import Link from "next/link"
import { ChevronDownIcon, MenuIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { SiteSearch } from "@/components/site-search"
import { ThemeToggle } from "@/components/theme-toggle"
import { CALCULATORS } from "@/lib/calculators"
import { getItems } from "@/lib/data"
import { colorFor } from "@/lib/series"
import { buildSearchIndex } from "@/lib/search"

function Wordmark() {
  return (
    <Link
      href="/"
      className="group flex shrink-0 items-baseline gap-1.5 font-display text-lg leading-none font-extrabold tracking-tight"
    >
      <span className="bg-primary text-primary-foreground ruled border-2 px-1.5 py-1">FIAT</span>
      <span className="hidden sm:inline">WATCH</span>
    </Link>
  )
}

export async function SiteHeader() {
  const [items, index] = await Promise.all([getItems(), buildSearchIndex()])

  const priceLinks = items.map((item) => ({
    href: `/costs/${item.slug}`,
    label: item.label,
    slug: item.slug,
    hint: `${item.firstYear}–${item.lastYear}`,
  }))

  return (
    <header className="bg-background/85 ruled sticky top-0 z-40 border-b-2 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1800px] items-center gap-3 px-4 sm:gap-4 sm:px-6 xl:px-10">
        <Wordmark />

        {/* `min-w-0`: without it the flex item refuses to shrink below its
            content and pushes the trailing buttons off a phone screen. */}
        <div className="min-w-0 flex-1 sm:px-4 lg:max-w-2xl">
          <SiteSearch index={index} />
        </div>

        <nav className="hidden items-center gap-1 lg:flex">
          <Button
            variant="ghost"
            className="font-medium"
            nativeButton={false}
            render={<Link href="/calculator" />}
          >
            Calculator
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" className="font-medium" />}>
              Calculators
              <ChevronDownIcon className="size-3.5 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="ruled w-auto min-w-64 rounded-none border-2"
            >
              {CALCULATORS.map((c) => (
                <DropdownMenuItem key={c.slug} render={<Link href={c.path} />}>
                  {c.heading}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" className="font-medium" />}>
              Prices
              <ChevronDownIcon className="size-3.5 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="ruled w-auto min-w-64 rounded-none border-2"
            >
              {priceLinks.map((link) => (
                <DropdownMenuItem key={link.slug} render={<Link href={link.href} />}>
                  <ItemArt
                    slug={link.slug}
                    className="size-4"
                    style={{ color: colorFor(link.slug) }}
                  />
                  {link.label}
                  <span className="text-muted-foreground tnum ml-auto text-xs">{link.hint}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <ThemeToggle />

        <Sheet>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="ruled border-2 lg:hidden"
                aria-label="Menu"
              />
            }
          >
            <MenuIcon className="size-4" />
          </SheetTrigger>
          <SheetContent side="right" className="ruled w-80 border-l-2">
            <SheetHeader>
              <SheetTitle className="font-display text-2xl">Fiat Watch</SheetTitle>
              <SheetDescription>What your money was really worth.</SheetDescription>
            </SheetHeader>
            <nav className="flex flex-col gap-6 overflow-y-auto px-4 pb-8">
              <MobileGroup title="Tools">
                <MobileLink href="/">Compare prices</MobileLink>
                <MobileLink href="/calculator">Inflation calculator</MobileLink>
              </MobileGroup>
              <MobileGroup title="Calculators">
                {CALCULATORS.map((c) => (
                  <MobileLink key={c.slug} href={c.path}>
                    {c.heading}
                  </MobileLink>
                ))}
              </MobileGroup>
              <MobileGroup title="Prices">
                {priceLinks.map((link) => (
                  <MobileLink key={link.slug} href={link.href}>
                    <ItemArt
                      slug={link.slug}
                      className="size-4"
                      style={{ color: colorFor(link.slug) }}
                    />
                    {link.label}
                  </MobileLink>
                ))}
              </MobileGroup>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
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

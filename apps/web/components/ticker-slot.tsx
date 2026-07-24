"use client"

import { usePathname } from "next/navigation"

/**
 * Hides the price rail on routes that have their own way of choosing an item.
 *
 * `/map` is the case: it opens with its own item picker, so the marquee is a
 * second, differently-shaped control for the same job, and it costs the map
 * ~130px of vertical space it would rather have.
 *
 * The ticker is a server component rendered by the layout and passed in as
 * children, so hiding it here costs nothing on the routes that keep it — the
 * client boundary wraps an already-rendered tree rather than pulling the data
 * layer across it.
 */
const WITHOUT_TICKER = ["/map"]

export function TickerSlot({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (WITHOUT_TICKER.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return null
  }
  return <>{children}</>
}

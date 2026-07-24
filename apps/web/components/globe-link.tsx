"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@workspace/ui/lib/utils"

/**
 * The map link, next to the search rather than out with the account buttons —
 * it is a way into the data, not account chrome.
 *
 * Client-side only because it needs the current path to show itself as
 * current; a link that looks identical whether or not you are on its page is a
 * link that has stopped navigating and started decorating.
 */
export function GlobeLink() {
  const pathname = usePathname()
  const active = pathname === "/map" || pathname.startsWith("/map/")

  return (
    <Link
      href="/map"
      aria-label="Prices by place"
      aria-current={active ? "page" : undefined}
      title="Prices by place"
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full text-xl leading-none transition-all",
        active
          ? "bg-accent ring-primary/40 scale-105 ring-2"
          : "hover:bg-accent hover:scale-110",
      )}
    >
      {/* 🌎 rather than 🌍 or 🌐: the data is entirely American, and the
          Americas-facing globe is the one that says so at 20px. */}
      <span aria-hidden>🌎</span>
    </Link>
  )
}

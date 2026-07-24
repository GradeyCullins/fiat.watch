"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { formatUsd } from "@workspace/core"
import { cn } from "@workspace/ui/lib/utils"

import { emojiFor } from "@/lib/emoji"

export interface RailItem {
  slug: string
  label: string
  value: number
}

/**
 * The item rail under the nav.
 *
 * It was an infinite CSS marquee, and three things were wrong with that.
 *
 * Motion implies live data. A ticker that slides says "the market is moving
 * right now"; these are BLS averages that change once a month, so the movement
 * was promising a liveness the numbers do not have.
 *
 * You cannot put a current-page state on a moving target — by the time you
 * reach for it, it has gone. The rail is navigation, and navigation should say
 * where you are.
 *
 * And it was `hidden lg:block`, so the smallest screens — the ones that most
 * want a horizontal strip they can flick — got nothing at all.
 *
 * Scrolling instead of animating fixes all three and costs nothing: native
 * touch scrolling on a phone, scroll-snap, and a real `aria-current` on the
 * item you are looking at.
 */
export function PriceRail({ items }: { items: RailItem[] }) {
  const pathname = usePathname()
  const scroller = React.useRef<HTMLDivElement>(null)
  const [edges, setEdges] = React.useState({ start: false, end: false })

  const measure = React.useCallback(() => {
    const el = scroller.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setEdges({ start: el.scrollLeft > 8, end: el.scrollLeft < max - 8 })
  }, [])

  React.useEffect(() => {
    const el = scroller.current
    if (!el) return
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [measure])

  const nudge = React.useCallback(
    (direction: -1 | 1) => {
      const el = scroller.current
      if (!el) return
      el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" })
      // Re-measure on a timer rather than trusting the scroll event alone. A
      // smooth scroll reports its *starting* position synchronously, and the
      // arrows have to know they are at an end even if no scroll event lands.
      window.setTimeout(measure, 450)
    },
    [measure],
  )

  /*
   * Centre the current item — once, on first mount only.
   *
   * It used to re-run on every navigation, which meant clicking a chip near
   * the end of the rail yanked the whole strip under your cursor as the page
   * changed. Landing on /costs/bacon from a search result should still find
   * bacon; clicking bacon should leave the rail exactly where your eye left it.
   *
   * `scrollLeft`, not `scrollIntoView`: the latter walks every ancestor
   * scroller including the document, so centring a chip in this rail also
   * nudged the whole page down by the height of the sticky header.
   */
  React.useEffect(() => {
    const el = scroller.current
    const active = el?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!el || !active) return
    // After paint: emoji are webfont-free but the row still settles a frame
    // late, and offsetLeft read too early centres the wrong chip.
    const id = requestAnimationFrame(() => {
      // `instant` — this one must not animate: it is placing the rail before
      // first paint, not moving it in response to anything.
      el.scrollTo({
        left: active.offsetLeft - (el.clientWidth - active.clientWidth) / 2,
        behavior: "instant",
      })
    })
    return () => cancelAnimationFrame(id)
    // Deliberately empty: first mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!items.length) return null

  return (
    <div className="relative">
      <div
        ref={scroller}
        onScroll={measure}
        /*
         * No `scroll-smooth` here, deliberately.
         *
         * With CSS `scroll-behavior: smooth` set on the element, a JS
         * `scrollBy({ behavior: "smooth" })` is swallowed entirely — measured:
         * smooth moved it 0px, instant moved it 480px on the same node. The
         * arrows looked dead and the handler was fine all along. Behaviour is
         * decided per call in JS instead; CSS scroll-behavior only ever
         * affected programmatic scrolls anyway, never the touch or trackpad.
         *
         * `snap-proximity`, not `snap-mandatory`: mandatory re-snaps after a
         * programmatic scroll, dragging the centred item back to the edge.
         */
        className="no-scrollbar flex snap-x snap-proximity overflow-x-auto py-3"
      >
        {items.map((row) => {
          const href = `/costs/${row.slug}`
          const current = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={row.slug}
              href={href}
              aria-current={current ? "page" : undefined}
              // Both states live on the emoji. A tint across the whole chip
              // made the current item a coloured slab in a row of transparent
              // ones — heavier than a nav strip needs, and it fought the
              // hover, which is also on the emoji.
              className="group flex w-[7.5rem] shrink-0 snap-start flex-col items-center gap-1 px-2 py-2 text-center"
            >
              {/* 36px, down from 44px. At 44 the glyph outweighed the price
                  it is labelling — on a 27" the rail read as a row of icons
                  with some numbers under them. */}
              <span
                aria-hidden
                className={cn(
                  "grid size-12 place-items-center rounded-full text-[2.25rem] leading-none transition-all duration-200 group-hover:-translate-y-0.5 group-hover:scale-110",
                  current && "bg-accent ring-primary/30 ring-2",
                )}
              >
                {emojiFor(row.slug)}
              </span>
              {/*
                Name and price, both at full contrast. An earlier pass made the
                name small and muted to build a hierarchy — which was the exact
                grey-and-light treatment that made this strip unreadable the
                first time round.

                The year-on-year percentage is gone. Two figures on one line,
                one of them coloured, is two things competing inside 120px, and
                it forced a red/green judgement into a strip whose only job is
                "what does this cost, and where do I click". It lives on the
                item page, which has room to caveat it.
              */}
              <span className="text-foreground w-full truncate text-[0.8125rem] leading-tight font-semibold first-letter:uppercase">
                {row.label}
              </span>
              <span className="tnum text-foreground font-mono text-[0.9375rem] leading-none font-bold">
                {formatUsd(row.value)}
              </span>
            </Link>
          )
        })}

      </div>

      {/*
        Fades, then the arrows over them.

        The arrows are plain absolutely-positioned siblings. The first attempt
        nested them inside the fade, which is `pointer-events-none` — so a
        click that missed the 28px button by a pixel fell straight through to
        whichever chip sat behind it, and I spent a while thinking the handler
        was broken. Nothing sits between the button and the cursor now.
      */}
      <div
        aria-hidden
        className={cn(
          "from-background pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r to-transparent transition-opacity",
          edges.start ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        aria-hidden
        className={cn(
          "from-background pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l to-transparent transition-opacity",
          edges.end ? "opacity-100" : "opacity-0",
        )}
      />

      <Arrow side="start" show={edges.start} onClick={() => nudge(-1)} />
      <Arrow side="end" show={edges.end} onClick={() => nudge(1)} />
    </div>
  )
}

/**
 * The scroll control — a floating disc over the edge of the rail, the way a
 * delivery app does it. Hidden below `sm`, where you flick instead.
 */
function Arrow({
  side,
  show,
  onClick,
}: {
  side: "start" | "end"
  show: boolean
  onClick: () => void
}) {
  const Icon = side === "start" ? ChevronLeftIcon : ChevronRightIcon
  return (
    <button
      type="button"
      aria-label={side === "start" ? "Scroll left" : "Scroll right"}
      onClick={onClick}
      tabIndex={show ? 0 : -1}
      className={cn(
        "bg-background float-2 absolute top-1/2 z-20 hidden size-9 -translate-y-1/2 place-items-center rounded-full border transition-all sm:grid",
        "hover:bg-accent hover:scale-105",
        side === "start" ? "left-1" : "right-1",
        show ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <Icon className="size-4" />
    </button>
  )
}

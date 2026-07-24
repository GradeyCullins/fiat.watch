import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og"

export const alt = "Fiat Watch — historical US prices from BLS data"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

/**
 * The card for `/_not-found`, and only that.
 *
 * `app/(pages)/opengraph-image.tsx` is the home page's card: `(pages)` is a
 * route group, so it adds no segment and both files resolve to `/` — the one
 * inside the group wins for every page under it, which is every content page
 * on the site. This file is left holding exactly one route, the 404.
 *
 * It is kept rather than deleted so a shared dead link still previews as the
 * site instead of as a bare URL. It went stale once already, carrying the
 * pre-rebuild headline ("What your money was really worth") long after `/`
 * stopped being the calculator, so it now draws through the same `ogCard` as
 * everything else and cannot drift from the house style again.
 */
export default function OpengraphImage() {
  return ogCard({
    eyebrow: "Page not found",
    lead: "The price of",
    highlight: "everything",
    footer: "160 items priced in real shops, from Bureau of Labor Statistics data",
    emoji: "🧭",
  })
}

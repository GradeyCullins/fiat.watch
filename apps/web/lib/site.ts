import type { Metadata } from "next"

export const SITE = {
  name: "Fiat Watch",
  short: "fiat.watch",
  tagline: "What your money was really worth.",
  url: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://fiat.watch"),
} as const

/**
 * Per-page metadata: title, description, canonical. Nothing else.
 *
 * It used to build a whole `openGraph` block here, and that quietly broke the
 * `opengraph-image` file convention. Metadata merge is shallow — a route that
 * sets `openGraph` at all replaces the parent's — and an explicit
 * `openGraph.images` beats a file-based image. So a per-segment
 * `opengraph-image.tsx` was being rendered, served, and then ignored.
 * Omitting `images` was no better: the card vanished entirely.
 *
 * Leaving `openGraph` alone here is what makes the convention work. Next fills
 * `og:title` / `og:description` from the page's own title and description, and
 * `og:image` from the nearest `opengraph-image` file up the tree — then
 * mirrors all of it into `twitter:*`. The static keys (type, siteName, locale,
 * card) live once in the root layout.
 */
/**
 * A description may not contain the answer.
 *
 * The Rails app opened every description with the figure — "Gas cost $1.16 per
 * gallon in 1990" — which is why it earned impressions and no clicks: the
 * search result satisfied the query outright, so there was nothing left to
 * click for. Google rewrites most descriptions and can lift a number off the
 * page anyway, so this is not a complete fix; what it changes is what the
 * snippet *promises*.
 *
 * It is a build-time throw rather than a review note because the leak is one
 * careless template literal away, on 6,800 pages, and nothing on the rendered
 * page would look wrong.
 */
/*
 * The shapes an answer can take.
 *
 * The first version of this matched `/\$\s?\d/` and ran on the description
 * only, which is narrower than the rule it claims to enforce: it would have
 * passed "eggs cost 3 dollars 12" and it never looked at the title at all —
 * the field Google shows in full and rewrites least. The copy was clean by
 * authorial discipline, not because this caught anything.
 */
const ANSWER_PATTERNS = [
  /\$\s*\d/, //                                    $3, $ 3
  /\bUSD\s*\d|\d\s*USD\b/i, //                     USD 3, 3 USD
  /\b\d[\d,]*(?:\.\d+)?\s*(?:dollars?|cents?|bucks?)\b/i, // 3 dollars, 12 cents
  /\b\d+\.\d{2}\b/, //                             a bare 3.12 — no unit on this site is written that way
  /\b\d[\d,]*(?:\.\d+)?\s*%/, //                   up 412% is an answer too
]

/*
 * The one legitimate collision: "in 2026 dollars" / "1990 dollars" is the name
 * of a basis, not a price. Stripped before matching so the `dollars` pattern
 * can stay broad.
 */
const BASIS_IDIOM = /\b(1[89]\d{2}|20\d{2})\s+dollars\b/gi

function assertNoAnswer(path: string, field: "title" | "description", text: string) {
  const cleaned = text.replace(BASIS_IDIOM, "")
  for (const pattern of ANSWER_PATTERNS) {
    const hit = cleaned.match(pattern)
    if (hit) {
      throw new Error(
        `Metadata ${field} for ${path} contains an answer ("${hit[0].trim()}"). ` +
          "Metadata says what the page covers, never what it answers — see lib/site.ts.",
      )
    }
  }
}

export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string
  description: string
  path: string
  /** Route-specific card. Defaults to the site image. */
}): Metadata {
  const url = new URL(path, SITE.url).toString()
  assertNoAnswer(path, "title", title)
  assertNoAnswer(path, "description", description)

  return {
    title,
    description,
    alternates: { canonical: url },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

export function jsonLd(data: Record<string, unknown>) {
  return {
    __html: JSON.stringify({ "@context": "https://schema.org", ...data }),
  }
}

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const

export const monthName = (m: number) => MONTHS[m - 1] ?? String(m)

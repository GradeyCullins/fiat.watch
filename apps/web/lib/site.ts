import type { Metadata } from "next"

export const SITE = {
  name: "Fiat Watch",
  short: "fiat.watch",
  tagline: "What your money was really worth.",
  url: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://fiat.watch"),
} as const

/**
 * Metadata merge in the App Router is shallow: a route that sets `openGraph`
 * at all replaces the parent's object rather than merging into it. So every
 * route builds its OG block from this helper instead of setting a partial one.
 */
export function pageMetadata({
  title,
  description,
  path,
  image,
}: {
  title: string
  description: string
  path: string
  /** Route-specific card. Defaults to the site image. */
  image?: string
}): Metadata {
  const url = new URL(path, SITE.url).toString()

  /*
   * The default matters. This helper exists because metadata merge is shallow
   * — a route that sets `openGraph` at all replaces the parent's object rather
   * than merging into it — but it omitted `images`, so *every* page that used
   * it dropped the root `opengraph-image.tsx` and shipped no card at all. The
   * only page in the build that had one was the noindex 404.
   */
  const card = [
    {
      url: new URL(image ?? "/opengraph-image", SITE.url).toString(),
      width: 1200,
      height: 630,
      alt: title,
    },
  ]

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: SITE.name,
      locale: "en_US",
      title,
      description,
      url,
      images: card,
    },
    // `twitter.images` is filled from `openGraph.images` when omitted, so the
    // separate twitter-image.tsx route was producing a byte-identical second
    // copy of the same picture.
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

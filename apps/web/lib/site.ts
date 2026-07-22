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
  images,
}: {
  title: string
  description: string
  path: string
  images?: Metadata["openGraph"] extends { images?: infer I } ? I : never
}): Metadata {
  const url = new URL(path, SITE.url).toString()

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
      ...(images ? { images } : {}),
    },
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

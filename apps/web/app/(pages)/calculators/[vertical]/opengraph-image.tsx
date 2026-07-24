import { notFound } from "next/navigation"

import { CALCULATORS } from "@/lib/calculators"
import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og"

export const alt = "Inflation calculator built on official BLS CPI data"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

/** See the item card: image routes need their own params or they build as `ƒ`. */
export function generateStaticParams() {
  return CALCULATORS.map((c) => ({ vertical: c.slug }))
}

export default async function Image({ params }: { params: Promise<{ vertical: string }> }) {
  const { vertical } = await params
  const page = CALCULATORS.find((c) => c.slug === vertical)
  if (!page) notFound()

  return ogCard({
    eyebrow: "CPI-U · Bureau of Labor Statistics",
    lead: page.heading.replace(" inflation calculator", ""),
    highlight: "inflation",
    tail: "calculator",
    footer: "Convert any amount between any two years, 1913 to today",
    emoji: page.emoji,
  })
}

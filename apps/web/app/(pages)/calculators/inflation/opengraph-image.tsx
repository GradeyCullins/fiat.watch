import { GENERAL_CALCULATOR } from "@/lib/calculators"
import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og"

export const alt = "US inflation calculator built on official BLS CPI-U data"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function Image() {
  return ogCard({
    eyebrow: "CPI-U · 1913 to today · Bureau of Labor Statistics",
    lead: "US inflation",
    highlight: "calculator",
    footer: "What any dollar amount was worth, in any other year",
    emoji: GENERAL_CALCULATOR.emoji,
  })
}

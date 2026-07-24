import { CALCULATORS } from "@/lib/calculators"
import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og"

export const alt = "Inflation calculators built on official BLS CPI data"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function Image() {
  return ogCard({
    eyebrow: "CPI-U · Bureau of Labor Statistics",
    lead: "Inflation",
    highlight: "calculators",
    footer: `${CALCULATORS.length + 1} tools · any amount, any two years from 1913`,
  })
}

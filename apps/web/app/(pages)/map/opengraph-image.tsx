import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og"

export const alt = "US prices by census region and metropolitan area"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function Image() {
  return ogCard({
    eyebrow: "US average prices · Bureau of Labor Statistics",
    lead: "Where things",
    highlight: "cost more",
    footer: "By census region and city — BLS publishes no state-level prices",
    emoji: "🌎",
  })
}

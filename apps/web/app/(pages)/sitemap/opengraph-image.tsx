import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og"

export const alt = "Every page on Fiat Watch"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function Image() {
  return ogCard({
    eyebrow: "Fiat Watch",
    lead: "Everything on",
    highlight: "this site",
    footer: "Every calculator and every price series",
  })
}

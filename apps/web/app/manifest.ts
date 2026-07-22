import type { MetadataRoute } from "next"

import { SITE } from "@/lib/site"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: SITE.short,
    description: SITE.tagline,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f4f8f5",
    theme_color: "#f4f8f5",
    orientation: "portrait-primary",
    categories: ["finance", "utilities", "education"],
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  }
}

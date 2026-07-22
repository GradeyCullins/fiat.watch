import type { MetadataRoute } from "next"

import { SITE } from "@/lib/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // `/calculation?…` was the old query-string form of the homepage. Google
      // flagged sixteen of those URLs as duplicates of `/`; they now redirect,
      // but keep crawlers off the pattern entirely.
      disallow: ["/calculation"],
    },
    sitemap: new URL("/sitemap.xml", SITE.url).toString(),
    host: SITE.url.host,
  }
}

import type { MetadataRoute } from "next"

import { SITE } from "@/lib/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Nothing is disallowed, deliberately.
      //
      // `/calculation?…` used to be listed here. It is the old query-string
      // form of the homepage and Search Console flagged sixteen of those URLs
      // as duplicates of `/`, so next.config.ts 301s the path. Disallowing it
      // as well cancelled that: a blocked URL is never fetched, so Googlebot
      // could not see the redirect and the duplicates had no way to
      // consolidate. The redirect is the fix; the block prevented it working.
    },
    sitemap: new URL("/sitemap.xml", SITE.url).toString(),
    host: SITE.url.host,
  }
}

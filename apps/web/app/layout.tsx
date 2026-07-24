import type { Metadata, Viewport } from "next"
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google"

import "@workspace/ui/globals.css"
import { cn } from "@workspace/ui/lib/utils"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { NuqsAdapter } from "nuqs/adapters/next/app"

import { SiteHeader } from "@/components/site-header"
import { ThemeProvider } from "@/components/theme-provider"
import { SITE } from "@/lib/site"

/**
 * Three families, three jobs. The old site's "display serif" was `ui-serif`
 * with no webfont behind it, so it rendered as a different typeface on every
 * operating system — this is a real one.
 */
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display-src",
})

const sans = Geist({ subsets: ["latin"], variable: "--font-sans-src" })

const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono-src" })

export const metadata: Metadata = {
  // Required: without it, relative OG image URLs are a build error.
  metadataBase: SITE.url,
  title: {
    default: `US Inflation Calculator With CPI Data | ${SITE.name}`,
    template: `%s | ${SITE.name}`,
  },
  description:
    "Find out what your money was really worth. Compare US prices and purchasing power across any two years using official BLS CPI data.",
  applicationName: SITE.name,
  authors: [{ name: SITE.name, url: SITE.url.toString() }],
  category: "finance",
  robots: { index: true, follow: true },
  // The parts that never change per page. Pages deliberately do not set
  // `openGraph` at all — see `pageMetadata` — so this block is inherited and
  // Next fills in title, description and the nearest file-based image itself.
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image" },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f8f5" },
    { media: "(prefers-color-scheme: dark)", color: "#16191f" },
  ],
  colorScheme: "light dark",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased font-sans",
        display.variable,
        sans.variable,
        mono.variable,
      )}
    >
      <body className="flex min-h-dvh flex-col">
        {/* nuqs holds the chart/calculator state that belongs in the URL. */}
        <NuqsAdapter>
          <ThemeProvider>
            <TooltipProvider>
              <SiteHeader />
              <div className="flex flex-1 flex-col">{children}</div>
            </TooltipProvider>
          </ThemeProvider>
        </NuqsAdapter>
      </body>
    </html>
  )
}

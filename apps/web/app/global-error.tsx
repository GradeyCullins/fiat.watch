"use client"

import "@workspace/ui/globals.css"

/**
 * Replaces the root layout entirely, so it has to render its own <html> and
 * <body> and re-import the stylesheet. It also cannot export `metadata` —
 * unlike `global-not-found.tsx`, which can. React 19's document metadata
 * support covers the gap.
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  reset: () => void
  unstable_retry: () => void
}) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground flex min-h-dvh flex-col antialiased">
        <title>Something went wrong | Fiat Watch</title>
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-24">
          <p className="text-primary text-7xl leading-none font-extrabold">500</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">The app failed to start.</h1>
          <p className="text-muted-foreground mt-3">
            An error escaped the root layout, so the usual page chrome is not available.
          </p>
          <div className="mt-8 flex gap-3">
            <button
              onClick={unstable_retry}
              className="bg-primary text-primary-foreground rounded-lg px-4 py-2 font-medium"
            >
              Try again
            </button>
            {/* A plain anchor, not next/link: this boundary replaces the root
                layout, so client-side routing is exactly what failed. A full
                document load is the recovery. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" className="rounded-lg border px-4 py-2 font-medium">
              Back to the chart
            </a>
          </div>
          {error.digest ? (
            <p className="text-muted-foreground mt-8 font-mono text-xs">
              Reference {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  )
}

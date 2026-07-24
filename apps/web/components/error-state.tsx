"use client"

import Link from "next/link"

import { Button } from "@workspace/ui/components/button"

/**
 * The one place error UI is defined. `error.tsx`, `global-error.tsx`, and
 * `not-found.tsx` all render this, so the chrome stays consistent and there is
 * a single file to edit when the recovery API changes name again.
 */
export function ErrorState({
  code,
  title,
  message,
  onRetry,
  digest,
}: {
  code: string
  title: string
  message: string
  onRetry?: () => void
  digest?: string
}) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-24 sm:px-6">
      <p className="font-display text-display text-primary leading-none">{code}</p>
      <h1 className="font-display text-headline mt-4">{title}</h1>
      <p className="text-muted-foreground mt-3 text-pretty">{message}</p>

      <div className="mt-8 flex flex-wrap gap-3">
        {onRetry ? (
          <Button onClick={onRetry}>
            Try again
          </Button>
        ) : null}
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/" />}
        >
          Back to the chart
        </Button>
        <Button variant="ghost" nativeButton={false} render={<Link href="/sitemap" />}>
          Every page
        </Button>
      </div>

      {digest ? (
        <p className="text-muted-foreground mt-8 font-mono text-xs">Reference {digest}</p>
      ) : null}
    </main>
  )
}

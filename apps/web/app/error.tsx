"use client"

import { useEffect } from "react"

import { ErrorState } from "@/components/error-state"

/**
 * `unstable_retry`, not `reset`. `reset` re-renders the client boundary, which
 * cannot recover an error thrown while rendering a Server Component — it just
 * throws again. `unstable_retry` re-requests the RSC payload.
 */
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  reset: () => void
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <ErrorState
      code="500"
      title="Something broke on the way to the data."
      message="This site is prerendered, so this is unusual. Retrying will re-request the page."
      onRetry={unstable_retry}
      digest={error.digest}
    />
  )
}

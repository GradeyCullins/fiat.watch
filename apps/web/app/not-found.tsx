import type { Metadata } from "next"

import { ErrorState } from "@/components/error-state"

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <ErrorState
      code="404"
      title="No reading for that."
      message="Either the page moved or BLS never published a price for that item, year, or month. October 2025 in particular does not exist — the survey was suspended."
    />
  )
}

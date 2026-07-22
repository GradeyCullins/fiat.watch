"use client"

import * as React from "react"
import { useActiveTooltipLabel } from "recharts"

/**
 * Reports the chart's currently hovered category to the parent.
 *
 * Recharts dispatches the user's `onClick` through the same store as its own
 * mouse handling, and the click is read before the mousemove that preceded it
 * has committed — so the state handed to `onClick` reports
 * `isTooltipActive: false` and no `activeLabel`, and click-to-select silently
 * does nothing.
 *
 * `useActiveTooltipLabel` subscribes to that store properly, so a child of the
 * chart always sees the settled value. This component renders nothing; it
 * exists to hold the subscription and push the label into a ref the click
 * handler can read.
 */
export function ActiveLabelProbe({ onChange }: { onChange: (label: unknown) => void }) {
  const label = useActiveTooltipLabel()

  React.useEffect(() => {
    onChange(label)
  }, [label, onChange])

  return null
}

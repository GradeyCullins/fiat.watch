import { cn } from "@workspace/ui/lib/utils"

/**
 * The mark.
 *
 * One unbroken stroke doing three jobs: it is a W, it is a price line, and the
 * gap between its two troughs is a pyramid. The dot sits inside that pyramid
 * as the eye off the dollar bill.
 *
 * There is deliberately no F. A mark carrying four ideas carries none, and the
 * F already has somewhere to live — the wordmark next to it.
 */
export function LogoMark({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={cn("size-6 shrink-0", className)}
      {...props}
    >
      <path
        d="M2 7 L10 25 L16 12 L22 25 L30 7"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <circle cx="16" cy="19.5" r="2" fill="currentColor" />
    </svg>
  )
}

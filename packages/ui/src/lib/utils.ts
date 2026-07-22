import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * tailwind-merge has to be told about theme keys we invented.
 *
 * `text-*` is ambiguous — it is both the font-size scale and the text-colour
 * scale — so tailwind-merge resolves unknown values by looking them up in its
 * built-in scales. `text-display` is in neither, it guesses colour, and then
 * `cn("text-display", "text-foreground")` silently drops the size. Registering
 * the sizes under `font-size` puts them in the right conflict group.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["display", "headline", "eyebrow", "figure"],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

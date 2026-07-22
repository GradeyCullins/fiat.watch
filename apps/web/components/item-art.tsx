import { cn } from "@workspace/ui/lib/utils"

/**
 * Item glyphs.
 *
 * Flat, chunky, single-colour. They inherit `currentColor` so the same glyph
 * is the item's chart colour in a legend, the foreground colour in a menu, and
 * white on a dark OG image — no per-context variants.
 */

type GlyphProps = React.SVGProps<SVGSVGElement>

function Frame({ children, className, ...props }: GlyphProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden
      className={cn("size-6 shrink-0", className)}
      {...props}
    >
      {children}
    </svg>
  )
}

function Gas(props: GlyphProps) {
  return (
    <Frame {...props}>
      <path d="M5 28V6a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v22" />
      <path d="M3 28h17" />
      <path d="M5 12h13" />
      <path d="M21 10l4 4v10a2 2 0 0 0 4 0V13l-4-4" />
    </Frame>
  )
}

function Eggs(props: GlyphProps) {
  return (
    <Frame {...props}>
      <path d="M16 4c5 0 9 8 9 14A9 9 0 1 1 7 18c0-6 4-14 9-14Z" />
      <path d="M12 19a4 4 0 0 0 4 4" strokeWidth={2} />
    </Frame>
  )
}

function Bread(props: GlyphProps) {
  return (
    <Frame {...props}>
      <path d="M4 16a8 8 0 0 1 8-8h8a8 8 0 0 1 8 8v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
      <path d="M11 12l3-4M17 12l3-4" strokeWidth={2} />
      <path d="M4 20h24" strokeWidth={2} />
    </Frame>
  )
}

function Milk(props: GlyphProps) {
  return (
    <Frame {...props}>
      <path d="M11 3h10v4l4 5v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V12l4-5Z" />
      <path d="M7 12h18" strokeWidth={2} />
      <path d="M13 17h6v5h-6z" strokeWidth={2} />
    </Frame>
  )
}

function Beef(props: GlyphProps) {
  return (
    <Frame {...props}>
      <path d="M3 22c0-7 6-12 13-12s13 5 13 12" />
      <path d="M2 22h28v4a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1Z" />
      <path d="M10 17h3M16 14h3M21 18h3" strokeWidth={2} />
    </Frame>
  )
}

const GLYPHS: Record<string, (props: GlyphProps) => React.ReactElement> = {
  gas: Gas,
  eggs: Eggs,
  bread: Bread,
  milk: Milk,
  "ground-beef": Beef,
}

function Fallback(props: GlyphProps) {
  return (
    <Frame {...props}>
      <path d="M6 6h20v20H6z" />
      <path d="M6 6l20 20M26 6L6 26" strokeWidth={2} />
    </Frame>
  )
}

export function ItemArt({ slug, ...props }: { slug: string } & GlyphProps) {
  const Glyph = GLYPHS[slug] ?? Fallback
  return <Glyph {...props} />
}

export const hasArt = (slug: string) => slug in GLYPHS

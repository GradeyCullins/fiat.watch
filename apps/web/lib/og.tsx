import { readFileSync } from "node:fs"
import { join } from "node:path"

import { ImageResponse } from "next/og"

/**
 * The social card, drawn as an engraved banknote.
 *
 * Two rules, and the second is the whole point.
 *
 * Satori — what `next/og` renders with — supports flexbox and very little
 * else. No CSS variables, no Tailwind, and every element that contains more
 * than one child needs an explicit `display: flex`. The palette is duplicated
 * as hex here because a `var(--primary)` would simply not resolve, and every
 * rule, flourish and guilloché line is inline SVG because `repeating-linear-
 * gradient` — the obvious way to get banknote texture — is not rendered.
 *
 * And no card ever states a price. These pages exist to answer "how much did
 * gas cost in 1990"; if the card answers it, the person scrolling past has no
 * reason to click, and neither does the search result that embeds it. A card
 * says what the page *is* — the item, the period, the unit, the source — and
 * never what the page *says*.
 */
export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = "image/png"

/* The light theme, converted from oklch by hand. Satori has no colour space. */
const PAPER = "#f3f8f4" // --background
const INK = "#0d1a15" // --foreground
const GREEN = "#008651" // --primary
const DEEP = "#005735" // the plate ink: --primary darkened, for rules
const MUTED = "#57655d" // --muted-foreground
const HAIR = "#8bbfa4" // the fine second rule
const WEAVE = "#dfeee6" // the guilloché line — barely there on purpose
const WEAVE_2 = "#cfe6d9" // the rosette, one step up from the weave

const W = OG_SIZE.width
const H = OG_SIZE.height

/*
 * The plate impression sits at 22 and its hairline at 33; the corner
 * flourishes reach 60 in from there. Type therefore starts at 96, which is
 * the one measurement in this file that everything else is arranged around —
 * it is what keeps the longest footer clear of the bottom-left ornament.
 */
const FRAME = 22
const RULE = 33
const CORNER = 60
const PAD_X = 96
const CONTENT_W = W - PAD_X * 2
const MEDALLION = 208
const MEDALLION_GAP = 44

/* ------------------------------------------------------------------ fonts */

type FontSpec = {
  name: string
  data: ArrayBuffer
  weight: 400 | 600 | 700 | 800
  style: "normal"
}

/**
 * Read once per process, not once per card.
 *
 * The build renders thirteen thousand of these. Four `readFileSync` calls
 * apiece would be four too many, so the buffers are memoised in module scope
 * and the first card pays for all of them.
 */
let cachedFonts: FontSpec[] | null = null

function bytes(file: string) {
  const buf = readFileSync(join(process.cwd(), "assets/fonts", file))
  return buf.buffer.slice(
    buf.byteOffset,
    buf.byteOffset + buf.byteLength
  ) as ArrayBuffer
}

function fonts(): FontSpec[] {
  if (!cachedFonts) {
    cachedFonts = [
      {
        name: "Bricolage",
        data: bytes("BricolageGrotesque-800.ttf"),
        weight: 800,
        style: "normal",
      },
      {
        name: "Bricolage",
        data: bytes("BricolageGrotesque-600.ttf"),
        weight: 600,
        style: "normal",
      },
      {
        name: "Mono",
        data: bytes("GeistMono-700.ttf"),
        weight: 700,
        style: "normal",
      },
      {
        name: "Mono",
        data: bytes("GeistMono-400.ttf"),
        weight: 400,
        style: "normal",
      },
    ]
  }
  return cachedFonts
}

/* --------------------------------------------------------------- ornament */

/**
 * One wavy rule of the background weave.
 *
 * Uniform amplitude, with each line's phase walked along by a fixed step, so
 * the field reads as combed diagonal ripples rather than the interference
 * blobs that alternating phases produce.
 */
function weaveLine(y: number, amp: number, shift: number) {
  const a = amp * 1.34
  let d = `M ${-140 + shift} ${y}`
  for (let x = -140 + shift; x < W + 140; x += 132) {
    d += ` q 33 ${-a} 66 0 q 33 ${a} 66 0`
  }
  return d
}

/**
 * A guilloché ring: a scalloped circle, drawn as a fine polygon.
 *
 * Twenty samples per lobe, not a flat count — sample too coarsely and the
 * scallops rasterise as sawtooth, which reads as noise on the plate rather
 * than as engine turning.
 */
function rosette(
  cx: number,
  cy: number,
  r: number,
  lobes: number,
  k: number,
  phase: number
) {
  const steps = lobes * 20
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2
    const rr = r * (1 + k * Math.cos(lobes * t + phase))
    pts.push(
      `${(cx + rr * Math.cos(t)).toFixed(1)} ${(cy + rr * Math.sin(t)).toFixed(1)}`
    )
  }
  return `M ${pts.join(" L ")} Z`
}

const WEAVE_LINES = (() => {
  const out: string[] = []
  for (let y = -16, i = 0; y < H + 16; y += 15, i++) {
    out.push(weaveLine(y, 6, (i * 13) % 132))
  }
  return out
})()

/*
 * The rosette is centred on the medallion, so on an item card it reads as a
 * halo around the portrait and on a card without one it fills the right of
 * the plate rather than leaving it bare. It runs off the trim on purpose.
 */
const ROSETTE_CX = W - PAD_X - MEDALLION / 2
const ROSETTE_CY = 306

const ROSETTE_RINGS = (() => {
  const out: string[] = []
  for (let i = 0; i < 6; i++) {
    out.push(rosette(ROSETTE_CX, ROSETTE_CY, 112 + i * 25, 16, 0.038, i * 0.26))
  }
  return out
})()

/** The full-bleed engraving that sits under everything. */
function Plate() {
  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ position: "absolute", left: 0, top: 0 }}
    >
      <g fill="none" stroke={WEAVE} strokeWidth="0.85">
        {WEAVE_LINES.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <g fill="none" stroke={WEAVE_2} strokeWidth="0.8">
        {ROSETTE_RINGS.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  )
}

/**
 * The corner flourishes, all four drawn in one SVG.
 *
 * Mirrored with `<g transform>` rather than four rotated divs: SVG transforms
 * survive Satori intact, and CSS ones on flex children are a coin toss.
 */
function Corners() {
  const arm = (
    <g fill="none" stroke={DEEP} strokeLinecap="round">
      <path
        d={`M ${CORNER} 3 A ${CORNER - 3} ${CORNER - 3} 0 0 1 3 ${CORNER}`}
        strokeWidth="1"
      />
      <path d="M 41 3 A 38 38 0 0 1 3 41" strokeWidth="2.2" />
      <path d="M 30.5 8.5 L 35.5 13.5" strokeWidth="1.3" />
      <path d="M 8.5 30.5 L 13.5 35.5" strokeWidth="1.3" />
      <circle cx="17.5" cy="17.5" r="3.8" fill={DEEP} stroke="none" />
    </g>
  )
  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ position: "absolute", left: 0, top: 0 }}
    >
      <g transform={`translate(${RULE} ${RULE})`}>{arm}</g>
      <g transform={`translate(${W - RULE} ${RULE}) scale(-1 1)`}>{arm}</g>
      <g transform={`translate(${RULE} ${H - RULE}) scale(1 -1)`}>{arm}</g>
      <g transform={`translate(${W - RULE} ${H - RULE}) scale(-1 -1)`}>{arm}</g>
    </svg>
  )
}

/** The portrait medallion: a ruled rim, engraved ground, and the item's glyph. */
function Medallion({ emoji }: { emoji: string }) {
  const c = MEDALLION / 2
  const ticks: string[] = []
  for (let i = 0; i < 84; i++) {
    const t = (i / 84) * Math.PI * 2
    ticks.push(
      `M ${(c + 88 * Math.cos(t)).toFixed(1)} ${(c + 88 * Math.sin(t)).toFixed(1)} ` +
        `L ${(c + 97 * Math.cos(t)).toFixed(1)} ${(c + 97 * Math.sin(t)).toFixed(1)}`
    )
  }
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: MEDALLION,
        height: MEDALLION,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width={MEDALLION}
        height={MEDALLION}
        viewBox={`0 0 ${MEDALLION} ${MEDALLION}`}
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        <circle cx={c} cy={c} r="102" fill={PAPER} />
        <g fill="none" stroke={WEAVE_2} strokeWidth="0.8">
          <path d={rosette(c, c, 78, 16, 0.045, 0)} />
          <path d={rosette(c, c, 63, 16, 0.05, 0.45)} />
          <path d={rosette(c, c, 48, 16, 0.055, 0.9)} />
        </g>
        <g stroke={HAIR} strokeWidth="0.9">
          {ticks.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        <circle
          cx={c}
          cy={c}
          r="102.5"
          fill="none"
          stroke={DEEP}
          strokeWidth="2.6"
        />
        <circle
          cx={c}
          cy={c}
          r="85.5"
          fill="none"
          stroke={HAIR}
          strokeWidth="1"
        />
      </svg>
      <div style={{ display: "flex", fontSize: 92 }}>{emoji}</div>
    </div>
  )
}

/** The counterfoil rule: two lines, end ticks, and a lozenge on the centre. */
function FooterRule() {
  const mid = CONTENT_W / 2
  return (
    <svg
      width={CONTENT_W}
      height="14"
      viewBox={`0 0 ${CONTENT_W} 14`}
      style={{ display: "flex" }}
    >
      <path d={`M 0 3 H ${CONTENT_W}`} stroke={DEEP} strokeWidth="2.4" />
      <path d={`M 0 8.5 H ${CONTENT_W}`} stroke={HAIR} strokeWidth="1" />
      <path d="M 1 0 V 12" stroke={DEEP} strokeWidth="1.6" />
      <path d={`M ${CONTENT_W - 1} 0 V 12`} stroke={DEEP} strokeWidth="1.6" />
      <path
        d={`M ${mid} 12.5 L ${mid - 9} 4.2 L ${mid} -4 L ${mid + 9} 4.2 Z`}
        fill={PAPER}
      />
      <path
        d={`M ${mid} 11 L ${mid - 7} 4.2 L ${mid} -2.6 L ${mid + 7} 4.2 Z`}
        fill="none"
        stroke={DEEP}
        strokeWidth="1.6"
      />
    </svg>
  )
}

/* ------------------------------------------------------------------ metre */

/**
 * Bricolage 800 and Geist Mono advance widths, measured off a render.
 *
 * Satori will not tell us how wide a string came out, and the catalogue holds
 * strings twice the length of the ones this card was designed against —
 * `small-jar freeze dried coffee` beside a medallion, `Steak, sirloin, graded
 * and ungraded, …` in the footer. So the type is sized arithmetically to fit
 * the box it is given, and the box always wins. Both ratios are deliberately
 * a little generous: an over-wide guess costs a point of type size, an
 * under-wide one costs a clipped headline.
 */
const DISPLAY_ADVANCE = 0.52
const MONO_ADVANCE = 0.6

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, Math.floor(n)))
}

/** Largest display size where no chunk overhangs and the whole fits 3 lines. */
function headlineSize(chunks: string[], box: number) {
  const longest = Math.max(...chunks.map((c) => c.length))
  const total = chunks.join(" ").length
  const perChunk = box / (DISPLAY_ADVANCE * longest)
  const perBlock = (3 * box) / (DISPLAY_ADVANCE * total)
  return clamp(Math.min(80, perChunk, perBlock), 42, 80)
}

/** Largest mono size at which a letter-spaced single line still fits. */
function eyebrowSize(text: string, box: number, spacing: number) {
  return clamp(
    (box / Math.max(text.length, 1) - spacing) / MONO_ADVANCE,
    12,
    19
  )
}

/* ------------------------------------------------------------------- card */

/**
 * One card layout: an eyebrow, a headline with one highlighted phrase, and a
 * footer. `emoji` is optional and takes the portrait medallion on the right.
 */
export function ogCard({
  eyebrow,
  lead,
  highlight,
  tail,
  footer,
  emoji,
}: {
  eyebrow: string
  /** Plain text before the highlighted phrase. */
  lead?: string
  /** The one phrase in green. Never a figure. */
  highlight: string
  /** Plain text after it. */
  tail?: string
  footer: string
  emoji?: string
}) {
  const box = emoji ? CONTENT_W - MEDALLION - MEDALLION_GAP : CONTENT_W
  const chunks = [lead, highlight, tail].filter(Boolean) as string[]
  const size = headlineSize(chunks, box)
  const ebSpace = 3
  const ebSize = eyebrowSize(eyebrow, box - 48, ebSpace)
  /* Two lines of source are allowed; under 15px it stops being read at all. */
  const ftSize = clamp(
    (2 * CONTENT_W) / (MONO_ADVANCE * Math.max(footer.length, 1)),
    15,
    18
  )

  return new ImageResponse(
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
        background: PAPER,
        /* Cream stock: the token background, warmed at the centre and
             shaded at the trim, so the field reads as paper and not as fill. */
        backgroundImage: `radial-gradient(115% 88% at 46% 40%, #fcfdf5 0%, ${PAPER} 56%, #e6efe6 100%)`,
        color: INK,
        padding: `56px ${PAD_X}px 52px`,
        fontFamily: "Bricolage",
      }}
    >
      <Plate />

      {/* The plate impression: a heavy rule with a hairline inside it. */}
      <div
        style={{
          position: "absolute",
          left: FRAME,
          top: FRAME,
          width: W - FRAME * 2,
          height: H - FRAME * 2,
          border: `3px solid ${DEEP}`,
          borderRadius: 4,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: RULE,
          top: RULE,
          width: W - RULE * 2,
          height: H - RULE * 2,
          border: `1px solid ${HAIR}`,
          borderRadius: 2,
        }}
      />
      <Corners />

      {/* Masthead: the mark on the left, the denomination corner opposite. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <svg width="42" height="42" viewBox="0 0 32 32" fill="none">
            <path
              d="M2 7 L10 25 L16 12 L22 25 L30 7"
              stroke={DEEP}
              strokeWidth="3.4"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
            <circle cx="16" cy="19.5" r="2.3" fill={DEEP} />
          </svg>
          <div
            style={{ display: "flex", flexDirection: "column", marginLeft: 15 }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 27,
                fontWeight: 800,
                letterSpacing: 1.4,
              }}
            >
              FIAT WATCH
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 4,
                fontFamily: "Mono",
                fontWeight: 400,
                fontSize: 13,
                letterSpacing: 3.4,
                color: MUTED,
              }}
            >
              FIAT.WATCH
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 56,
            height: 56,
            border: `2.4px solid ${DEEP}`,
            borderRadius: 3,
            color: DEEP,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44,
              border: `1px solid ${HAIR}`,
              borderRadius: 2,
              fontSize: 27,
              fontWeight: 800,
            }}
          >
            $
          </div>
        </div>
      </div>

      {/* The engraved centre. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: box }}>
          <div
            style={{ display: "flex", alignItems: "center", marginBottom: 24 }}
          >
            <div
              style={{
                display: "flex",
                width: 34,
                height: 2,
                background: DEEP,
              }}
            />
            <div
              style={{
                display: "flex",
                marginLeft: 14,
                fontFamily: "Mono",
                fontWeight: 700,
                fontSize: ebSize,
                letterSpacing: ebSpace,
                textTransform: "uppercase",
                color: DEEP,
              }}
            >
              {eyebrow}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              width: box,
              fontSize: size,
              fontWeight: 800,
              letterSpacing: -size * 0.028,
              lineHeight: 1.06,
            }}
          >
            {lead ? (
              <div style={{ display: "flex", marginRight: size * 0.24 }}>
                {lead}
              </div>
            ) : null}
            <div
              style={{
                display: "flex",
                color: GREEN,
                marginRight: size * 0.24,
              }}
            >
              {highlight}
            </div>
            {tail ? <div style={{ display: "flex" }}>{tail}</div> : null}
          </div>
        </div>

        {emoji ? <Medallion emoji={emoji} /> : null}
      </div>

      {/* Counterfoil: the rule, then the source in plate lettering. */}
      <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
        <FooterRule />
        <div
          style={{
            marginTop: 12,
            width: CONTENT_W,
            fontFamily: "Mono",
            fontWeight: 400,
            fontSize: ftSize,
            lineHeight: 1.45,
            color: MUTED,
          }}
        >
          {footer}
        </div>
      </div>
    </div>,
    { ...OG_SIZE, fonts: fonts() }
  )
}

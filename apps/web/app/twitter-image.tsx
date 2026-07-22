import { ImageResponse } from "next/og"

export const alt = "Fiat Watch — what your money was really worth"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const INK = "#16191f"
const PAPER = "#f4f8f5"
const GREEN = "#2f7d55"

/**
 * Drawn with plain divs and inline styles: `next/og` runs Satori, which
 * supports flexbox and little else — no CSS variables, no Tailwind classes.
 * The palette is duplicated as hex here on purpose.
 */
export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: INK,
          color: PAPER,
          padding: 64,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <svg width="52" height="52" viewBox="0 0 32 32" fill="none">
            <path
              d="M2 7 L10 25 L16 12 L22 25 L30 7"
              stroke={GREEN}
              strokeWidth="3.4"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
            <circle cx="16" cy="19.5" r="2.3" fill={GREEN} />
          </svg>
          <div style={{ display: "flex", marginLeft: 16, fontSize: 34, fontWeight: 800 }}>
            FIAT WATCH
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 104,
              fontWeight: 800,
              letterSpacing: -4,
              lineHeight: 1,
            }}
          >
            What your money
          </div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 10 }}>
            <div
              style={{
                display: "flex",
                fontSize: 104,
                fontWeight: 800,
                letterSpacing: -4,
                lineHeight: 1,
              }}
            >
              was
            </div>
            <div
              style={{
                display: "flex",
                color: GREEN,
                marginLeft: 22,
                fontSize: 104,
                fontWeight: 800,
                letterSpacing: -4,
                lineHeight: 1,
              }}
            >
              really worth.
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: `2px solid ${GREEN}`,
            paddingTop: 22,
            fontSize: 26,
            color: "#9aa0a8",
          }}
        >
          <div style={{ display: "flex" }}>US consumer prices since 1913</div>
          <div style={{ display: "flex" }}>Bureau of Labor Statistics · CPI-U</div>
        </div>
      </div>
    ),
    size,
  )
}

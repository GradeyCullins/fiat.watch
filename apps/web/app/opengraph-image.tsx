import { ImageResponse } from "next/og"

export const alt = "Fiat Watch — what your money was really worth"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const INK = "#211f1c"
const PAPER = "#f6f3e7"
const ACID = "#e8e34a"

/**
 * Drawn with plain divs and inline styles: `next/og` runs Satori, which
 * supports flexbox and little else — no CSS variables, no Tailwind classes, no
 * `gap` shorthand quirks. The palette is duplicated as hex here on purpose.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: PAPER,
          color: INK,
          padding: 64,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              background: ACID,
              border: `4px solid ${INK}`,
              padding: "6px 14px",
              fontSize: 34,
              fontWeight: 800,
              letterSpacing: -1,
            }}
          >
            FIAT
          </div>
          <div style={{ display: "flex", marginLeft: 14, fontSize: 34, fontWeight: 800 }}>
            WATCH
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
          <div style={{ display: "flex", alignItems: "center", marginTop: 8 }}>
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
                background: ACID,
                border: `5px solid ${INK}`,
                marginLeft: 18,
                padding: "0 16px 10px",
                fontSize: 104,
                fontWeight: 800,
                letterSpacing: -4,
                lineHeight: 1,
              }}
            >
              really
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 104,
                fontWeight: 800,
                letterSpacing: -4,
                lineHeight: 1,
                marginLeft: 18,
              }}
            >
              worth.
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: `4px solid ${INK}`,
            paddingTop: 20,
            fontSize: 26,
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

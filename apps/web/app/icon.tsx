import { ImageResponse } from "next/og"

export const size = { width: 512, height: 512 }
export const contentType = "image/png"

/**
 * The mark on a solid tile — a thin stroke alone disappears in a browser tab,
 * so the tile carries the colour and the stroke stays paper-white.
 *
 * A literal `favicon.ico` cannot be generated this way. Every current browser
 * accepts this PNG instead.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1f6b47",
        }}
      >
        <svg width="360" height="360" viewBox="0 0 32 32" fill="none">
          <path
            d="M2 7 L10 25 L16 12 L22 25 L30 7"
            stroke="#f4f8f5"
            strokeWidth="3.4"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
          <circle cx="16" cy="19.5" r="2.3" fill="#f4f8f5" />
        </svg>
      </div>
    ),
    size,
  )
}

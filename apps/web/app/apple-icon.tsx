import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

/** iOS masks and composites this itself, so it is drawn edge to edge. */
export default function AppleIcon() {
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
        <svg width="128" height="128" viewBox="0 0 32 32" fill="none">
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

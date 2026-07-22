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
          background: "#e8e34a",
        }}
      >
        <svg width="180" height="180" viewBox="0 0 512 512" fill="none">
          <path
            d="M64 128 L192 288 L288 208 L448 384"
            stroke="#211f1c"
            strokeWidth="56"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
          <path d="M448 288 L448 384 L352 384" stroke="#211f1c" strokeWidth="56" fill="none" />
        </svg>
      </div>
    ),
    size,
  )
}

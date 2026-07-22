import { ImageResponse } from "next/og"

export const size = { width: 512, height: 512 }
export const contentType = "image/png"

/**
 * The mark: an acid square with a falling line through it. Drawn rather than
 * shipped as a raster so it stays crisp and stays in the palette.
 *
 * A literal `favicon.ico` cannot be generated this way — browsers that demand
 * one fall back to this PNG, which every current browser accepts.
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
          background: "#e8e34a",
        }}
      >
        <svg width="512" height="512" viewBox="0 0 512 512" fill="none">
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

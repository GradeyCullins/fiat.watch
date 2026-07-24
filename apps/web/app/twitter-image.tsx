/**
 * The X / Twitter card.
 *
 * Re-exported from the Open Graph card rather than written twice. Next already
 * falls back to `og:image` for `twitter:image` when this file is absent, so
 * this exists to make the surface explicit and editable — the day the two
 * should diverge, replace this line with a real component. Until then a copy
 * of the layout would only be a second thing to forget to update.
 *
 * `alt`, `size` and `contentType` come across too; for a generated card these
 * exports *are* the alt text. `twitter-image.alt.txt` is the mechanism for a
 * static .png/.jpg and does nothing next to a .tsx.
 */
export { default, alt, size, contentType } from "./opengraph-image"

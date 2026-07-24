/**
 * See the co-located `opengraph-image.tsx`. Re-exported so the two cannot
 * drift; replace this line the day X should get a different card.
 */
export {
  default,
  alt,
  size,
  contentType,
  // Not decorative: a re-export list is the whole module, so without this the
  // card builds as `f` (on demand) even though the OG route beside it is
  // static. The two must be exported together or half the fix ships.
  generateStaticParams,
} from "./opengraph-image"

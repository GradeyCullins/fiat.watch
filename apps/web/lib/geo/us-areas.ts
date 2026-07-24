/**
 * BLS areas projected onto US geography.
 *
 * Two lookups, both keyed by the area slugs in `packages/db/seed/catalogue.json`:
 * `STATE_AREA` colours a state by the census region/division containing it, and
 * `METRO_POINT` places a marker for each of the 35 BLS metro areas.
 *
 * Sources
 * -------
 * Region/division membership — US Census Bureau, "Census Bureau Regions and
 * Divisions with State FIPS Codes":
 *   https://www2.census.gov/geo/docs/maps-data/maps/reg_div.txt
 * The 4 regions and 9 divisions below are transcribed from that file verbatim;
 * they are a fixed standard, not a judgement call.
 *
 * Metro coordinates — USGS Geographic Names Information System (GNIS),
 * Domestic Names, national file:
 *   https://prd-tnm.s3.amazonaws.com/StagedProducts/GeographicNames/DomesticNames/DomesticNames_National_Text.zip
 *   https://www.usgs.gov/us-board-on-geographic-names/download-gnis-data
 * Each point is the `prim_lat_dec`/`prim_long_dec` of the "Populated Place"
 * record for the city, rounded to 3 decimals (~110 m). GNIS puts that point
 * downtown, which is what we want. The Census place gazetteer was the obvious
 * alternative and is worse here: its internal points are polygon centroids, so
 * San Francisco lands 50 km offshore in the Farallon Islands and Anchorage
 * lands 30 km east of the city in its 1,700 sq mi borough.
 *
 * Boundaries live next door in `us-states.geojson` (Census 1:20m cartographic
 * boundary file). Both files are public domain.
 */

/** USPS code → the census region and division that state belongs to. */
export const STATE_AREA: Record<string, { region: string; division: string }> =
  {
    // Region 1: Northeast — Division 1: New England
    CT: { region: "northeast", division: "new-england" },
    ME: { region: "northeast", division: "new-england" },
    MA: { region: "northeast", division: "new-england" },
    NH: { region: "northeast", division: "new-england" },
    RI: { region: "northeast", division: "new-england" },
    VT: { region: "northeast", division: "new-england" },

    // Region 1: Northeast — Division 2: Middle Atlantic
    NJ: { region: "northeast", division: "middle-atlantic" },
    NY: { region: "northeast", division: "middle-atlantic" },
    PA: { region: "northeast", division: "middle-atlantic" },

    // Region 2: Midwest — Division 3: East North Central
    IL: { region: "midwest", division: "east-north-central" },
    IN: { region: "midwest", division: "east-north-central" },
    MI: { region: "midwest", division: "east-north-central" },
    OH: { region: "midwest", division: "east-north-central" },
    WI: { region: "midwest", division: "east-north-central" },

    // Region 2: Midwest — Division 4: West North Central
    IA: { region: "midwest", division: "west-north-central" },
    KS: { region: "midwest", division: "west-north-central" },
    MN: { region: "midwest", division: "west-north-central" },
    MO: { region: "midwest", division: "west-north-central" },
    NE: { region: "midwest", division: "west-north-central" },
    ND: { region: "midwest", division: "west-north-central" },
    SD: { region: "midwest", division: "west-north-central" },

    // Region 3: South — Division 5: South Atlantic
    DE: { region: "south", division: "south-atlantic" },
    DC: { region: "south", division: "south-atlantic" },
    FL: { region: "south", division: "south-atlantic" },
    GA: { region: "south", division: "south-atlantic" },
    MD: { region: "south", division: "south-atlantic" },
    NC: { region: "south", division: "south-atlantic" },
    SC: { region: "south", division: "south-atlantic" },
    VA: { region: "south", division: "south-atlantic" },
    WV: { region: "south", division: "south-atlantic" },

    // Region 3: South — Division 6: East South Central
    AL: { region: "south", division: "east-south-central" },
    KY: { region: "south", division: "east-south-central" },
    MS: { region: "south", division: "east-south-central" },
    TN: { region: "south", division: "east-south-central" },

    // Region 3: South — Division 7: West South Central
    AR: { region: "south", division: "west-south-central" },
    LA: { region: "south", division: "west-south-central" },
    OK: { region: "south", division: "west-south-central" },
    TX: { region: "south", division: "west-south-central" },

    // Region 4: West — Division 8: Mountain
    AZ: { region: "west", division: "mountain" },
    CO: { region: "west", division: "mountain" },
    ID: { region: "west", division: "mountain" },
    MT: { region: "west", division: "mountain" },
    NV: { region: "west", division: "mountain" },
    NM: { region: "west", division: "mountain" },
    UT: { region: "west", division: "mountain" },
    WY: { region: "west", division: "mountain" },

    // Region 4: West — Division 9: Pacific
    AK: { region: "west", division: "pacific" },
    CA: { region: "west", division: "pacific" },
    HI: { region: "west", division: "pacific" },
    OR: { region: "west", division: "pacific" },
    WA: { region: "west", division: "pacific" },
  }

/**
 * BLS metro area slug → its representative coordinates.
 *
 * BLS publishes overlapping series for the same ground — a combined CSA and its
 * component metros are separate areas with separate prices, so several slugs
 * below describe the same city. Rather than stack markers exactly on top of
 * each other, each duplicate is placed deliberately; see the comments.
 */
export const METRO_POINT: Record<string, { lng: number; lat: number }> = {
  // --- Straightforward: GNIS populated-place point for the named city. ---
  pittsburgh: { lng: -79.996, lat: 40.441 },
  buffalo: { lng: -78.878, lat: 42.886 },
  scranton: { lng: -75.662, lat: 41.409 },
  cleveland: { lng: -81.695, lat: 41.499 },
  milwaukee: { lng: -87.906, lat: 43.039 },
  cincinnati: { lng: -84.515, lat: 39.103 },
  boston: { lng: -71.06, lat: 42.358 },
  "new-york": { lng: -74.006, lat: 40.714 },
  philadelphia: { lng: -75.164, lat: 39.952 },
  chicago: { lng: -87.65, lat: 41.85 },
  detroit: { lng: -83.046, lat: 42.331 },
  minneapolis: { lng: -93.264, lat: 44.98 },
  "st-louis": { lng: -90.198, lat: 38.627 },
  miami: { lng: -80.194, lat: 25.774 },
  atlanta: { lng: -84.388, lat: 33.749 },
  tampa: { lng: -82.458, lat: 27.948 },
  dallas: { lng: -96.807, lat: 32.783 },
  houston: { lng: -95.363, lat: 29.763 },
  phoenix: { lng: -112.074, lat: 33.448 },
  denver: { lng: -104.985, lat: 39.739 },
  "san-diego": { lng: -117.157, lat: 32.715 },
  "san-francisco": { lng: -122.419, lat: 37.775 },
  seattle: { lng: -122.332, lat: 47.606 },

  /** BLS "Kansas City" straddles MO/KS; anchored on Kansas City, Missouri. */
  "kansas-city": { lng: -94.579, lat: 39.1 },

  /** BLS area A425 "Portland" is Portland, *Oregon* — not Portland, Maine. */
  portland: { lng: -122.676, lat: 45.523 },

  /** BLS "Urban Hawaii" (S49F) — the state's urban core, i.e. Honolulu. */
  hawaii: { lng: -157.858, lat: 21.307 },

  /** BLS "Urban Alaska" (S49G) — the state's urban core, i.e. Anchorage. */
  alaska: { lng: -149.9, lat: 61.218 },

  // --- Washington / Baltimore: three cities' worth of slugs, two cities. ---

  /**
   * A311 "Washington-Baltimore" is the combined DC–Baltimore CSA. Placed at the
   * midpoint of the two city points (near Laurel, MD) so it reads as the pair
   * rather than sitting on top of either component.
   */
  "washington-baltimore": { lng: -76.824, lat: 39.093 },

  /** A315 "Washington, DC-MD-VA" — DC proper, exact GNIS point. */
  "washington-dc-md-va": { lng: -77.036, lat: 38.895 },

  /**
   * S35A "Washington, DC" — the same city as A315 above, a different BLS
   * series. Nudged ~4 km NE (still inside DC) so the two markers separate.
   */
  washington: { lng: -77.006, lat: 38.925 },

  /** A317 "Baltimore, MD" — Baltimore proper, exact GNIS point. */
  "baltimore-md": { lng: -76.612, lat: 39.29 },

  /**
   * S35E "Baltimore" — the same city as A317 above. Nudged ~4 km NE (still
   * inside the city) for the same reason.
   */
  baltimore: { lng: -76.582, lat: 39.32 },

  // --- Los Angeles / Riverside: combined CSA plus its two components. ---

  /**
   * A421 "Los Angeles-Riverside" is the combined CSA. Placed at the midpoint of
   * the LA and Riverside city points (near Pomona) for the same reason as
   * Washington-Baltimore.
   */
  "los-angeles-riverside": { lng: -117.82, lat: 34.003 },

  /** S49A "Los Angeles" — exact GNIS point, downtown LA. */
  "los-angeles": { lng: -118.244, lat: 34.052 },

  /** S49C "Riverside" — exact GNIS point, Riverside County (not the two other
   *  California places also named Riverside, in Sacramento and Stanislaus). */
  riverside: { lng: -117.396, lat: 33.953 },
}

/**
 * A label anchor for each census region and division.
 *
 * Without these the map had emoji and prices for exactly twelve items — the
 * energy ones with city series — and for everything else drew four coloured
 * blobs and no numbers. "Bread costs $1.84 in the Midwest" is the fact the
 * page exists to show, and it had nowhere to sit.
 *
 * These are not centroids. A true centroid of the West lands in eastern Nevada
 * and of the South in northern Mississippi, both of which collide with the
 * metro pins that sit in the same places. Each point below is picked inside its
 * own area, away from the cities BLS prices separately, so a region label and a
 * city label never stack. Approximate by construction and deliberately so —
 * they anchor a label, they do not measure anything.
 */
export const AREA_POINT: Record<string, { lng: number; lat: number }> = {
  // Regions — placed in the empty middle of each, clear of the metro pins.
  northeast: { lng: -75.4, lat: 43.4 }, // upstate New York
  midwest: { lng: -97.5, lat: 44.6 }, // eastern South Dakota
  south: { lng: -88.6, lat: 33.6 }, // northern Mississippi
  west: { lng: -114.2, lat: 42.4 }, // southern Idaho

  // Divisions — the finer cut, used by the eight items that publish it.
  "new-england": { lng: -71.6, lat: 44.4 }, // New Hampshire
  "middle-atlantic": { lng: -77.3, lat: 41.6 }, // central Pennsylvania
  "east-north-central": { lng: -85.6, lat: 43.9 }, // northern Michigan
  "west-north-central": { lng: -98.7, lat: 42.4 }, // northern Nebraska
  "south-atlantic": { lng: -80.4, lat: 33.4 }, // central South Carolina
  "east-south-central": { lng: -86.9, lat: 35.4 }, // central Tennessee
  "west-south-central": { lng: -93.4, lat: 34.6 }, // northern Arkansas
  mountain: { lng: -108.6, lat: 43.4 }, // central Wyoming
  pacific: { lng: -122.4, lat: 44.4 }, // western Oregon
}

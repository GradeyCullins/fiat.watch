/**
 * The catalogue: every item, place and series this site carries.
 *
 * Generated from the BLS flat files (`ap.item`, `ap.area`, `ap.series`) and
 * then named by hand, because BLS titles are catalogue entries rather than
 * English — "Bread, white, pan, per lb. (453.6 gm)" cannot go in a heading.
 * The BLS title is kept alongside as `blsName` so provenance is never lost.
 *
 * It is committed rather than fetched at ingest time so a build is
 * reproducible and a rename is a reviewable diff.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// See client.ts — `new URL(x, import.meta.url)` is a bundler asset reference.
const CATALOGUE_FILE = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "seed",
  "catalogue.json",
);

export interface ItemDefinition {
  itemCode: string;
  slug: string;
  label: string;
  labelAttributive: string;
  unit: string;
  category: string;
  group: string;
  blsName: string;
}

export interface AreaDefinition {
  areaCode: string;
  slug: string;
  name: string;
  kind: string;
  blsName: string;
}

export interface SeriesDefinition {
  seriesId: string;
  itemCode: string;
  areaCode: string;
  beginYear: number;
  endYear: number;
}

interface Catalogue {
  items: ItemDefinition[];
  areas: AreaDefinition[];
  series: SeriesDefinition[];
}

const catalogue = JSON.parse(readFileSync(CATALOGUE_FILE, "utf8")) as Catalogue;

export const ITEMS = catalogue.items;
export const AREAS = catalogue.areas;
export const SERIES = catalogue.series;

export const CPI_SERIES_ID = "CUUR0000SA0";

/** CUUR0000SA0 begins in 1913. */
export const CPI_START_YEAR = 1913;

/**
 * The Rails importer floored at 1976 and gas began at exactly that year, so it
 * was impossible to tell whether 1976 was the true start of the series or just
 * where we stopped asking. Ask from the earliest year any series claims and
 * let BLS answer; years before a series exists come back empty.
 */
export const PRICE_START_YEAR = Math.min(...SERIES.map((s) => s.beginYear));

export const ITEM_BY_CODE = new Map(ITEMS.map((i) => [i.itemCode, i]));
export const AREA_BY_CODE = new Map(AREAS.map((a) => [a.areaCode, a]));
export const SERIES_BY_ID = new Map(SERIES.map((s) => [s.seriesId, s]));

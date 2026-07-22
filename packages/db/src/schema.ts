/**
 * The schema exists to make four things structurally impossible, each of
 * which was a real defect in something this replaces:
 *
 *  1. **Five names for one item.** `question_name` in JSON, `PRICE_SUBJECTS`
 *     in a controller, `HISTORICAL_PRICE_LINK_LABELS` in a helper, `name` and
 *     `item_name` in the data file (both dead). Two used different plurality,
 *     so one page read "Historical egg prices" while its own meta description
 *     said "historical eggs costs". Here an item has exactly one row.
 *
 *  2. **A second, lossy copy of the price data.** The annual JSON file was
 *     `mean(months).round(3)` — every one of its 220 values reproduces from
 *     the monthly file, 11 of them with rounding drift. Annual item prices
 *     are therefore *derived*, never stored. (CPI is different: BLS publishes
 *     a real annual average as period M13, so that one IS stored.)
 *
 *  3. **Silent provisional data.** 2026's "annual average" is a single April
 *     reading; 2025 is an eleven-month mean; 1995 milk is six months. The
 *     importer detected all of this and printed it to stdout. Now it is a
 *     column, and every figure derived from it inherits the caveat.
 *
 *  4. **One series per item.** The first version of this schema hung a single
 *     BLS series id off the item row. BLS publishes the same item for many
 *     places — gasoline alone has 47 live series across 21 metros, four
 *     regions, nine divisions and the national average — so item and place are
 *     now separate, joined by a `series` row that owns the BLS identifier.
 *
 * A fifth state is expressed by absence: October 2025 has no rows, because
 * BLS never collected it (the shutdown) and never will. An absent row is not
 * a zero, and charts must gap rather than interpolate across it.
 */
import { relations } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  pgTable,
  smallint,
  text,
  unique,
} from "drizzle-orm/pg-core";

/** A commodity, independent of where it was priced. */
export const items = pgTable("items", {
  /** BLS item code, e.g. "74714" for unleaded regular. The natural key. */
  itemCode: text("item_code").primaryKey(),
  /** URL segment. `/costs/ground-beef` → "ground-beef". */
  slug: text("slug").notNull().unique(),
  /** Sentence form — "the price of {eggs}". Used in copy, meta and legends. */
  label: text("label").notNull(),
  /**
   * Attributive form — "{egg} prices". English needs both and the Rails app
   * conflated them, which is why one page read "Historical egg prices by year"
   * while its own meta description said "See historical eggs costs".
   */
  labelAttributive: text("label_attributive").notNull(),
  /** "per gallon", "per dozen" — rendered verbatim next to a price. */
  unit: text("unit").notNull(),
  /** energy · meat · dairy · bakery · produce · pantry. Drives `/costs`. */
  category: text("category").notNull(),
  /**
   * Clusters near-identical variants so they sit together instead of
   * competing as peers — the four gasoline grades share "gasoline". Empty
   * where an item stands alone.
   */
  group: text("group").notNull().default(""),
  /** The BLS catalogue title, kept verbatim for provenance. */
  blsName: text("bls_name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

/** A place BLS prices things in: the nation, a region, a division, a metro. */
export const areas = pgTable("areas", {
  /** BLS area code, e.g. "0000" for the U.S. city average. */
  areaCode: text("area_code").primaryKey(),
  /** URL segment. `/costs/gas/in/chicago` → "chicago". */
  slug: text("slug").notNull().unique(),
  /** Short display name: "Chicago", "Midwest", "United States". */
  name: text("name").notNull(),
  /** national · region · division · metro · sizeclass. */
  kind: text("kind").notNull(),
  blsName: text("bls_name").notNull(),
});

/**
 * One BLS series: this item, in this place.
 *
 * `endYear` is load-bearing rather than cosmetic. Roughly a thousand of these
 * have stopped publishing — some decades ago — and a page that prints "Latest
 * price" for a series BLS retired in 2013 is lying. Discontinued series still
 * carry real history and stay on the site; they just cannot wear live chrome.
 */
export const series = pgTable(
  "series",
  {
    /** BLS series id, e.g. "APU000074714". */
    seriesId: text("series_id").primaryKey(),
    itemCode: text("item_code")
      .notNull()
      .references(() => items.itemCode, { onDelete: "cascade" }),
    areaCode: text("area_code")
      .notNull()
      .references(() => areas.areaCode, { onDelete: "cascade" }),
    beginYear: integer("begin_year").notNull(),
    endYear: integer("end_year").notNull(),
    /** True once BLS stops publishing. Derived at ingest from `endYear`. */
    isDiscontinued: boolean("is_discontinued").notNull().default(false),
  },
  (t) => [
    unique("series_item_area_key").on(t.itemCode, t.areaCode),
    index("series_item_idx").on(t.itemCode),
    index("series_area_idx").on(t.areaCode),
  ],
);

export const prices = pgTable(
  "prices",
  {
    seriesId: text("series_id")
      .notNull()
      .references(() => series.seriesId, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    /** 1–12. Monthly only — annual figures are derived, never stored. */
    month: smallint("month").notNull(),
    value: doublePrecision("value").notNull(),
  },
  (t) => [
    unique("prices_series_period_key").on(t.seriesId, t.year, t.month),
    index("prices_series_year_idx").on(t.seriesId, t.year),
  ],
);

export const cpi = pgTable(
  "cpi",
  {
    year: integer("year").notNull(),
    /**
     * 1–12, or NULL for the annual average.
     *
     * Unlike item prices, the annual row is NOT derived — BLS publishes it as
     * period M13 and it is not simply the mean of the twelve months. Both
     * granularities are authoritative and both are stored.
     */
    month: smallint("month"),
    value: doublePrecision("value").notNull(),
    /**
     * True when this stands in for a value BLS has not published yet — most
     * importantly the current year, whose "annual average" is really the
     * latest single month.
     */
    isProvisional: boolean("is_provisional").notNull().default(false),
    /** Why it is provisional, shown to the reader rather than buried. */
    provisionalNote: text("provisional_note"),
  },
  (t) => [
    // NULLS NOT DISTINCT so the annual row (month IS NULL) is genuinely unique
    // per year. Without it Postgres treats every NULL as distinct and you can
    // insert 1913's annual average an unlimited number of times.
    unique("cpi_period_key").on(t.year, t.month).nullsNotDistinct(),
  ],
);

/** Provenance, so a stale ingest is visible rather than inferred. */
export const ingestRuns = pgTable("ingest_runs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  seriesId: text("series_id").notNull(),
  startYear: integer("start_year").notNull(),
  endYear: integer("end_year").notNull(),
  rowsWritten: integer("rows_written").notNull(),
  fetchedAt: text("fetched_at").notNull(),
});

export const itemsRelations = relations(items, ({ many }) => ({
  series: many(series),
}));

export const areasRelations = relations(areas, ({ many }) => ({
  series: many(series),
}));

export const seriesRelations = relations(series, ({ one, many }) => ({
  item: one(items, { fields: [series.itemCode], references: [items.itemCode] }),
  area: one(areas, { fields: [series.areaCode], references: [areas.areaCode] }),
  prices: many(prices),
}));

export const pricesRelations = relations(prices, ({ one }) => ({
  series: one(series, { fields: [prices.seriesId], references: [series.seriesId] }),
}));

export type Item = typeof items.$inferSelect;
export type Area = typeof areas.$inferSelect;
export type Series = typeof series.$inferSelect;
export type Price = typeof prices.$inferSelect;
export type Cpi = typeof cpi.$inferSelect;

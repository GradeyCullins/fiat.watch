/**
 * The schema exists to make three things structurally impossible, each of
 * which was a real defect in the Rails app it replaces:
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
 * A fourth state is expressed by absence: October 2025 has no rows, because
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

export const items = pgTable("items", {
  /** URL segment. `/costs/ground-beef` → "ground-beef". */
  slug: text("slug").primaryKey(),
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
  /** BLS series identifier, e.g. APU000074714. */
  seriesId: text("series_id").notNull().unique(),
  seriesName: text("series_name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const prices = pgTable(
  "prices",
  {
    itemSlug: text("item_slug")
      .notNull()
      .references(() => items.slug, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    /** 1–12. Monthly only — annual figures are derived, never stored. */
    month: smallint("month").notNull(),
    value: doublePrecision("value").notNull(),
  },
  (t) => [
    unique("prices_item_period_key").on(t.itemSlug, t.year, t.month),
    index("prices_item_year_idx").on(t.itemSlug, t.year),
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
  prices: many(prices),
}));

export const pricesRelations = relations(prices, ({ one }) => ({
  item: one(items, { fields: [prices.itemSlug], references: [items.slug] }),
}));

export type Item = typeof items.$inferSelect;
export type Price = typeof prices.$inferSelect;
export type Cpi = typeof cpi.$inferSelect;

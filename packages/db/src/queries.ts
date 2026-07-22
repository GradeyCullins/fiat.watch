/**
 * Read queries used at build time by `generateStaticParams` and page
 * components. Everything here runs during `next build` and never at request
 * time — the deployed artifact is static.
 */
import { and, asc, eq, isNull, sql } from "drizzle-orm";

import { getDb } from "./client";
import { cpi, items, prices } from "./schema";

export interface ItemSummary {
  slug: string;
  label: string;
  labelAttributive: string;
  unit: string;
  firstYear: number;
  lastYear: number;
  observations: number;
  /** Years where BLS published fewer than twelve months. */
  partialYears: number[];
}

/** Every item, with the coverage facts a page needs to caveat itself honestly. */
export async function listItems(): Promise<ItemSummary[]> {
  const db = getDb();
  const rows = await db
    .select({
      slug: items.slug,
      label: items.label,
      labelAttributive: items.labelAttributive,
      unit: items.unit,
      sortOrder: items.sortOrder,
      firstYear: sql<number>`min(${prices.year})::int`,
      lastYear: sql<number>`max(${prices.year})::int`,
      observations: sql<number>`count(${prices.value})::int`,
    })
    .from(items)
    .leftJoin(prices, eq(prices.itemSlug, items.slug))
    .groupBy(items.slug, items.label, items.labelAttributive, items.unit, items.sortOrder)
    .orderBy(asc(items.sortOrder));

  const partial = await db
    .select({
      slug: prices.itemSlug,
      year: prices.year,
      n: sql<number>`count(*)::int`,
    })
    .from(prices)
    .groupBy(prices.itemSlug, prices.year)
    .having(sql`count(*) <> 12`);

  return rows.map((r) => ({
    slug: r.slug,
    label: r.label,
    labelAttributive: r.labelAttributive,
    unit: r.unit,
    firstYear: r.firstYear,
    lastYear: r.lastYear,
    observations: r.observations,
    partialYears: partial
      .filter((p) => p.slug === r.slug)
      .map((p) => p.year)
      .sort((a, b) => a - b),
  }));
}

export interface AnnualPrice {
  year: number;
  /** Mean of the months BLS published for that year. */
  value: number;
  /** How many months that mean is over. Fewer than 12 is a real caveat. */
  months: number;
}

/**
 * Annual prices, derived in SQL rather than stored.
 *
 * The Rails app kept a second JSON file of these; every value reproduced as
 * `mean(months).round(3)`, and 11 of 220 had drifted from the monthly source.
 * Deriving means there is exactly one source of truth and no drift is possible.
 */
export async function annualPrices(slug: string): Promise<AnnualPrice[]> {
  const db = getDb();
  return db
    .select({
      year: prices.year,
      value: sql<number>`avg(${prices.value})::float8`,
      months: sql<number>`count(*)::int`,
    })
    .from(prices)
    .where(eq(prices.itemSlug, slug))
    .groupBy(prices.year)
    .orderBy(asc(prices.year));
}

/** Monthly prices for one item-year. Absent months are simply not returned. */
export async function monthlyPrices(slug: string, year: number) {
  const db = getDb();
  return getDb()
    .select({ month: prices.month, value: prices.value })
    .from(prices)
    .where(and(eq(prices.itemSlug, slug), eq(prices.year, year)))
    .orderBy(asc(prices.month));
}

/** Every CPI point, annual and monthly, for constructing a CpiTable. */
export async function allCpi() {
  const db = getDb();
  return db
    .select({
      year: cpi.year,
      month: cpi.month,
      value: cpi.value,
      isProvisional: cpi.isProvisional,
      provisionalNote: cpi.provisionalNote,
    })
    .from(cpi)
    .orderBy(asc(cpi.year), asc(cpi.month));
}

/** The year every "in today's dollars" figure is expressed in. */
export async function latestCpiYear() {
  const db = getDb();
  const [row] = await db
    .select({
      year: sql<number>`max(${cpi.year})::int`,
    })
    .from(cpi)
    .where(isNull(cpi.month));
  return row?.year ?? null;
}

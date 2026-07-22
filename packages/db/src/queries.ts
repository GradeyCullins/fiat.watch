/**
 * Read queries used at build time by `generateStaticParams` and page
 * components. Everything here runs during `next build` and never at request
 * time — the deployed artifact is static.
 *
 * Every item query takes an area, defaulting to the national average. BLS
 * publishes the same item for many places (gasoline has 47 live series), so
 * "the price of gas" is only a question once you say where.
 */
import { and, asc, eq, sql } from "drizzle-orm";

import { getDb } from "./client";
import { areas, cpi, items, prices, series } from "./schema";

/** The U.S. city average — what every page means unless it says otherwise. */
export const NATIONAL = "us";

export interface ItemSummary {
  slug: string;
  label: string;
  labelAttributive: string;
  unit: string;
  category: string;
  group: string;
  areaSlug: string;
  areaName: string;
  firstYear: number;
  lastYear: number;
  observations: number;
  /** True once BLS stops publishing. No "latest price", no ticker. */
  isDiscontinued: boolean;
  /** Years where BLS published fewer than twelve months. */
  partialYears: number[];
}

/** Every item available in one area, with the facts a page needs to caveat itself. */
export async function listItems(areaSlug: string = NATIONAL): Promise<ItemSummary[]> {
  const db = await getDb();

  const rows = await db
    .select({
      slug: items.slug,
      label: items.label,
      labelAttributive: items.labelAttributive,
      unit: items.unit,
      category: items.category,
      group: items.group,
      areaSlug: areas.slug,
      areaName: areas.name,
      isDiscontinued: series.isDiscontinued,
      sortOrder: items.sortOrder,
      firstYear: sql<number>`min(${prices.year})::int`,
      lastYear: sql<number>`max(${prices.year})::int`,
      observations: sql<number>`count(${prices.value})::int`,
    })
    .from(series)
    .innerJoin(items, eq(items.itemCode, series.itemCode))
    .innerJoin(areas, eq(areas.areaCode, series.areaCode))
    .innerJoin(prices, eq(prices.seriesId, series.seriesId))
    .where(eq(areas.slug, areaSlug))
    .groupBy(
      items.slug,
      items.label,
      items.labelAttributive,
      items.unit,
      items.category,
      items.group,
      areas.slug,
      areas.name,
      series.isDiscontinued,
      items.sortOrder,
    )
    .orderBy(asc(items.sortOrder));

  const partial = await db
    .select({ slug: items.slug, year: prices.year })
    .from(prices)
    .innerJoin(series, eq(series.seriesId, prices.seriesId))
    .innerJoin(items, eq(items.itemCode, series.itemCode))
    .innerJoin(areas, eq(areas.areaCode, series.areaCode))
    .where(eq(areas.slug, areaSlug))
    .groupBy(items.slug, prices.year)
    .having(sql`count(*) <> 12`);

  return rows.map((r) => ({
    ...r,
    partialYears: partial
      .filter((p) => p.slug === r.slug)
      .map((p) => p.year)
      .sort((a, b) => a - b),
  }));
}

/** Which places publish a given item, so a page can offer them. */
export async function areasForItem(itemSlug: string) {
  const db = await getDb();
  return db
    .select({
      slug: areas.slug,
      name: areas.name,
      kind: areas.kind,
      beginYear: series.beginYear,
      endYear: series.endYear,
      isDiscontinued: series.isDiscontinued,
    })
    .from(series)
    .innerJoin(items, eq(items.itemCode, series.itemCode))
    .innerJoin(areas, eq(areas.areaCode, series.areaCode))
    .where(eq(items.slug, itemSlug))
    .orderBy(asc(areas.kind), asc(areas.name));
}

/** Every (item, area) pair that has data — the exact set of item pages. */
export async function allItemKeys() {
  const db = await getDb();
  return db
    .selectDistinct({ item: items.slug, area: areas.slug })
    .from(prices)
    .innerJoin(series, eq(series.seriesId, prices.seriesId))
    .innerJoin(items, eq(items.itemCode, series.itemCode))
    .innerJoin(areas, eq(areas.areaCode, series.areaCode))
    .orderBy(asc(items.slug), asc(areas.slug));
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
export async function annualPrices(
  itemSlug: string,
  areaSlug: string = NATIONAL,
): Promise<AnnualPrice[]> {
  const db = await getDb();
  return db
    .select({
      year: prices.year,
      value: sql<number>`avg(${prices.value})::float8`,
      months: sql<number>`count(*)::int`,
    })
    .from(prices)
    .innerJoin(series, eq(series.seriesId, prices.seriesId))
    .innerJoin(items, eq(items.itemCode, series.itemCode))
    .innerJoin(areas, eq(areas.areaCode, series.areaCode))
    .where(and(eq(items.slug, itemSlug), eq(areas.slug, areaSlug)))
    .groupBy(prices.year)
    .orderBy(asc(prices.year));
}

/** Monthly prices for one item-year. Absent months are simply not returned. */
export async function monthlyPrices(
  itemSlug: string,
  year: number,
  areaSlug: string = NATIONAL,
) {
  const db = await getDb();
  return db
    .select({ month: prices.month, value: prices.value })
    .from(prices)
    .innerJoin(series, eq(series.seriesId, prices.seriesId))
    .innerJoin(items, eq(items.itemCode, series.itemCode))
    .innerJoin(areas, eq(areas.areaCode, series.areaCode))
    .where(and(eq(items.slug, itemSlug), eq(areas.slug, areaSlug), eq(prices.year, year)))
    .orderBy(asc(prices.month));
}

/** Every monthly reading for one item in one area, oldest first. */
export async function monthlySeries(itemSlug: string, areaSlug: string = NATIONAL) {
  const db = await getDb();
  return db
    .select({ year: prices.year, month: prices.month, value: prices.value })
    .from(prices)
    .innerJoin(series, eq(series.seriesId, prices.seriesId))
    .innerJoin(items, eq(items.itemCode, series.itemCode))
    .innerJoin(areas, eq(areas.areaCode, series.areaCode))
    .where(and(eq(items.slug, itemSlug), eq(areas.slug, areaSlug)))
    .orderBy(asc(prices.year), asc(prices.month));
}

/**
 * Every (item, area, year, month) that has a reading — the exact set of month
 * pages that could exist. Absent months (October 2025) are simply not rows, so
 * they never become a URL.
 */
export async function allPriceKeys(areaSlug: string = NATIONAL) {
  const db = await getDb();
  return db
    .select({ slug: items.slug, year: prices.year, month: prices.month })
    .from(prices)
    .innerJoin(series, eq(series.seriesId, prices.seriesId))
    .innerJoin(items, eq(items.itemCode, series.itemCode))
    .innerJoin(areas, eq(areas.areaCode, series.areaCode))
    .where(eq(areas.slug, areaSlug))
    .orderBy(asc(items.slug), asc(prices.year), asc(prices.month));
}

/** Every CPI point, annual and monthly, for constructing a CpiTable. */
export async function allCpi() {
  const db = await getDb();
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
  const db = await getDb();
  const [row] = await db
    .select({ year: sql<number>`max(${cpi.year})::int` })
    .from(cpi)
    .where(sql`${cpi.month} is null`);
  return row?.year ?? null;
}

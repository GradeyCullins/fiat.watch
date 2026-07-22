/**
 * BLS → Postgres ingest.
 *
 * Run with `pnpm db:ingest`. Requires BLS_API_KEY for the wider request
 * window; works without one, just in more requests.
 *
 * Replaces `lib/tasks/cpi.rake` and `lib/tasks/average_price.rake`. Three
 * behavioural differences, all deliberate:
 *
 *  1. Monthly CPI is persisted. The Ruby task fetched it and discarded it,
 *     which is why month pages deflated monthly prices with an annual index.
 *  2. Annual item prices are not stored. They were a rounded mean of the
 *     monthly file — a second source of truth that had already drifted in 11
 *     of 220 values. They are derived at query time instead.
 *  3. Partial years are recorded rather than printed. The Ruby task detected
 *     them and wrote them to stdout.
 */
import { sql } from "drizzle-orm";

import { closeDb, getDb } from "../client";
import { cpi, ingestRuns, items, prices } from "../schema";
import { fetchSeries, type Observation } from "./bls";
import {
  CPI_SERIES_ID,
  CPI_SERIES_NAME,
  CPI_START_YEAR,
  ITEMS,
  ITEM_BY_SERIES_ID,
  PRICE_START_YEAR,
} from "./catalog";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

async function main() {
  const apiKey = process.env.BLS_API_KEY;
  const endYear = Number(process.env.BLS_END_YEAR ?? new Date().getUTCFullYear());
  const fetchedAt = new Date().toISOString();
  const db = getDb();

  if (!apiKey) {
    console.warn("! BLS_API_KEY not set — using 10-year request windows instead of 20.");
  }

  // --- items ----------------------------------------------------------------
  await db
    .insert(items)
    .values(ITEMS.map((i) => ({ ...i })))
    .onConflictDoUpdate({
      target: items.slug,
      set: {
        label: sql`excluded.label`,
        labelAttributive: sql`excluded.label_attributive`,
        unit: sql`excluded.unit`,
        seriesName: sql`excluded.series_name`,
        sortOrder: sql`excluded.sort_order`,
      },
    });

  // --- CPI ------------------------------------------------------------------
  console.log(`Fetching CPI ${CPI_SERIES_ID} ${CPI_START_YEAR}–${endYear}…`);
  const cpiRows = await fetchSeries({
    seriesIds: [CPI_SERIES_ID],
    startYear: CPI_START_YEAR,
    endYear,
    apiKey,
    onWindow: (a, b, n) => console.log(`  ${a}–${b}: ${n} observations`),
  });

  const { annual, monthly } = partition(cpiRows);
  const provisional = detectProvisionalCpi(annual, monthly, endYear);

  await db
    .insert(cpi)
    .values([
      ...monthly.map((o) => ({
        year: o.year,
        month: o.month,
        value: o.value,
        isProvisional: false,
        provisionalNote: null,
      })),
      ...annual.map((o) => ({
        year: o.year,
        month: null,
        value: o.value,
        isProvisional: false,
        provisionalNote: null,
      })),
      ...(provisional ? [provisional] : []),
    ])
    .onConflictDoUpdate({
      target: [cpi.year, cpi.month],
      set: {
        value: sql`excluded.value`,
        isProvisional: sql`excluded.is_provisional`,
        provisionalNote: sql`excluded.provisional_note`,
      },
    });

  await db.insert(ingestRuns).values({
    seriesId: CPI_SERIES_ID,
    startYear: CPI_START_YEAR,
    endYear,
    rowsWritten: cpiRows.length,
    fetchedAt,
  });

  console.log(
    `  → ${monthly.length} monthly + ${annual.length} annual CPI observations` +
      (provisional ? `, ${provisional.year} marked provisional` : ""),
  );

  // --- item prices ----------------------------------------------------------
  console.log(`\nFetching ${ITEMS.length} price series ${PRICE_START_YEAR}–${endYear}…`);
  const priceRows = await fetchSeries({
    seriesIds: ITEMS.map((i) => i.seriesId),
    startYear: PRICE_START_YEAR,
    endYear,
    apiKey,
    onWindow: (a, b, n) => console.log(`  ${a}–${b}: ${n} observations`),
  });

  // Monthly only. Annual is derived — see the note at the top of this file.
  const monthlyPrices = priceRows.filter((o) => o.month !== null);

  await db
    .insert(prices)
    .values(
      monthlyPrices.flatMap((o) => {
        const item = ITEM_BY_SERIES_ID.get(o.seriesId);
        if (!item) return [];
        return [{ itemSlug: item.slug, year: o.year, month: o.month!, value: o.value }];
      }),
    )
    .onConflictDoUpdate({
      target: [prices.itemSlug, prices.year, prices.month],
      set: { value: sql`excluded.value` },
    });

  await db.insert(ingestRuns).values({
    seriesId: ITEMS.map((i) => i.seriesId).join(","),
    startYear: PRICE_START_YEAR,
    endYear,
    rowsWritten: monthlyPrices.length,
    fetchedAt,
  });

  await report(db, monthlyPrices);
}

function partition(rows: Observation[]) {
  return {
    annual: rows.filter((o) => o.month === null),
    monthly: rows.filter((o) => o.month !== null),
  };
}

/**
 * BLS publishes the annual average (period M13) once a year, in January. Until
 * then the current year has no annual figure, and the site still needs to
 * answer "in {thisYear} dollars" — so the latest published month stands in.
 *
 * This is the single most consequential number on the site: every
 * inflation-adjusted figure across ~2,800 pages is computed against it. It is
 * recorded as provisional so pages can say so.
 */
function detectProvisionalCpi(annual: Observation[], monthly: Observation[], endYear: number) {
  if (annual.some((o) => o.year === endYear)) return null;

  const latest = monthly
    .filter((o) => o.year === endYear)
    .sort((a, b) => (b.month ?? 0) - (a.month ?? 0))[0];
  if (!latest) return null;

  const name = MONTH_NAMES[(latest.month ?? 1) - 1];
  return {
    year: endYear,
    month: null,
    value: latest.value,
    isProvisional: true,
    provisionalNote:
      `${name} ${endYear} CPI is used for ${endYear} until the annual average is published.`,
  };
}

/** Surface coverage, partial years and genuine holes rather than assuming. */
async function report(db: ReturnType<typeof getDb>, monthlyPrices: Observation[]) {
  console.log("\nCoverage:");
  for (const item of ITEMS) {
    const rows = monthlyPrices.filter((o) => ITEM_BY_SERIES_ID.get(o.seriesId)?.slug === item.slug);
    if (rows.length === 0) {
      console.log(`  ${item.slug.padEnd(12)} NO DATA`);
      continue;
    }
    const years = [...new Set(rows.map((r) => r.year))].sort((a, b) => a - b);
    const byYear = new Map<number, number>();
    for (const r of rows) byYear.set(r.year, (byYear.get(r.year) ?? 0) + 1);

    const partial = years.filter((y) => (byYear.get(y) ?? 0) !== 12);
    console.log(
      `  ${item.slug.padEnd(12)} ${years[0]}–${years.at(-1)}  ${rows.length} months` +
        (partial.length ? `  partial: ${partial.map((y) => `${y}(${byYear.get(y)})`).join(" ")}` : ""),
    );
  }

  const [{ count } = { count: 0 }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(prices);
  console.log(`\nprices rows: ${count}`);
}

try {
  await main();
} finally {
  await closeDb();
}

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

import { closeDb, getDb, type Database } from "../client";
import { areas, cpi, ingestRuns, items, prices, series } from "../schema";
import { fetchSeries, requestCount, type Observation } from "./bls";
import {
  AREAS,
  CPI_SERIES_ID,
  CPI_START_YEAR,
  ITEMS,
  PRICE_START_YEAR,
  SERIES,
  SERIES_BY_ID,
} from "./catalog";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

async function main() {
  const apiKey = process.env.BLS_API_KEY;
  const endYear = Number(process.env.BLS_END_YEAR ?? new Date().getUTCFullYear());
  const fetchedAt = new Date().toISOString();
  const db = await getDb();

  if (!apiKey) {
    console.warn("! BLS_API_KEY not set — using 10-year request windows instead of 20.");
  }

  // --- catalogue ------------------------------------------------------------
  await db
    .insert(items)
    .values(ITEMS.map((i, n) => ({ ...i, sortOrder: n })))
    .onConflictDoUpdate({
      target: items.itemCode,
      set: {
        slug: sql`excluded.slug`,
        label: sql`excluded.label`,
        labelAttributive: sql`excluded.label_attributive`,
        unit: sql`excluded.unit`,
        category: sql`excluded.category`,
        group: sql`excluded."group"`,
        blsName: sql`excluded.bls_name`,
        sortOrder: sql`excluded.sort_order`,
      },
    });

  await db
    .insert(areas)
    .values(AREAS)
    .onConflictDoUpdate({
      target: areas.areaCode,
      set: {
        slug: sql`excluded.slug`,
        name: sql`excluded.name`,
        kind: sql`excluded.kind`,
        blsName: sql`excluded.bls_name`,
      },
    });

  await db
    .insert(series)
    .values(SERIES.map((s) => ({ ...s, isDiscontinued: s.endYear < endYear })))
    .onConflictDoUpdate({
      target: series.seriesId,
      set: {
        beginYear: sql`excluded.begin_year`,
        endYear: sql`excluded.end_year`,
        isDiscontinued: sql`excluded.is_discontinued`,
      },
    });

  console.log(
    `catalogue: ${ITEMS.length} items · ${AREAS.length} areas · ${SERIES.length} series ` +
      `(${SERIES.filter((s) => s.endYear >= endYear).length} live)`,
  );

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
  const cost = requestCount(SERIES.length, PRICE_START_YEAR, endYear, Boolean(apiKey));
  console.log(
    `\nFetching ${SERIES.length} price series ${PRICE_START_YEAR}–${endYear} ` +
      `in ~${cost} requests (BLS allows 500/day with a key)…`,
  );
  const priceRows = await fetchSeries({
    seriesIds: SERIES.map((s) => s.seriesId),
    startYear: PRICE_START_YEAR,
    endYear,
    apiKey,
    onWindow: (a, b, n, batch, batches) =>
      console.log(`  batch ${batch}/${batches}  ${a}–${b}: ${n} observations`),
  });

  // Monthly only. Annual is derived — see the note at the top of this file.
  const monthlyPrices = priceRows.filter((o) => o.month !== null);

  const rows = monthlyPrices.flatMap((o) =>
    SERIES_BY_ID.has(o.seriesId)
      ? [{ seriesId: o.seriesId, year: o.year, month: o.month!, value: o.value }]
      : [],
  );

  // Chunked: drizzle builds one parameter per column per row, and 420,000 rows
  // in a single VALUES list overflows the call stack while the SQL is assembled.
  const CHUNK = 5_000;
  for (let i = 0; i < rows.length; i += CHUNK) {
    await db
      .insert(prices)
      .values(rows.slice(i, i + CHUNK))
      .onConflictDoUpdate({
        target: [prices.seriesId, prices.year, prices.month],
        set: { value: sql`excluded.value` },
      });
  }

  await db.insert(ingestRuns).values({
    seriesId: `${SERIES.length} average-price series`,
    startYear: PRICE_START_YEAR,
    endYear,
    rowsWritten: monthlyPrices.length,
    fetchedAt,
  });

  await report(db, monthlyPrices);

  // Export in the same process. `getDb()` is an in-memory database — nothing
  // survives the exit — so a separate export command would open a fresh, empty
  // one and write a seed with nothing in it. Which it did, once.
  const { exportSeed } = await import("../seed");
  await exportSeed(db);
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
async function report(db: Database, monthlyPrices: Observation[]) {
  const bySeries = new Map<string, number>();
  for (const o of monthlyPrices) bySeries.set(o.seriesId, (bySeries.get(o.seriesId) ?? 0) + 1);

  const empty = SERIES.filter((s) => !bySeries.has(s.seriesId));
  console.log(`\nseries with data: ${bySeries.size}/${SERIES.length}`);
  if (empty.length) {
    console.log(`  ${empty.length} returned nothing:`);
    for (const s of empty.slice(0, 10)) {
      console.log(`    ${s.seriesId}  ${s.itemCode}/${s.areaCode}  ${s.beginYear}–${s.endYear}`);
    }
    if (empty.length > 10) console.log(`    …and ${empty.length - 10} more`);
  }

  const [{ count } = { count: 0 }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(prices);
  console.log(`prices rows: ${count.toLocaleString()}`);
}

try {
  await main();
} finally {
  await closeDb();
}

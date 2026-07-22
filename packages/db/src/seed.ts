/**
 * Seed export/import.
 *
 * `seed/observations.json` is the data: CPI readings and item prices. The
 * catalogue that gives them meaning — items, areas, series — is a separate
 * committed file, because it is hand-named and reviewed while this is machine
 * output that gets replaced wholesale on every refresh.
 *
 * `getDb()` imports both into an in-memory PGlite on first use, so a clone can
 * build the whole site without a BLS key and without network access, and CI is
 * not at the mercy of an API outage.
 *
 * Records are written one per line: it is still valid JSON, but a monthly
 * refresh produces a diff you can actually read.
 *
 *   pnpm export   # db → seed/observations.json, after an ingest
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { sql } from "drizzle-orm";

import type { Database } from "./client";
import { AREAS, ITEMS, SERIES } from "./ingest/catalog";
import { areas, cpi, items, prices, series } from "./schema";

// See client.ts — `new URL(x, import.meta.url)` is a bundler asset reference.
const SEED_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "seed");
const SEED_FILE = join(SEED_DIR, "observations.json");

/** [year, month|null, value, isProvisional, note|null] */
type CpiTuple = [number, number | null, number, 0 | 1, string | null];
/** [seriesId, year, month, value] */
type PriceTuple = [string, number, number, number];

export async function exportSeed(db: Database) {
  const cpiRows = await db.select().from(cpi).orderBy(cpi.year, cpi.month);
  const priceRows = await db
    .select()
    .from(prices)
    .orderBy(prices.seriesId, prices.year, prices.month);

  const cpiTuples: CpiTuple[] = cpiRows.map((r) => [
    r.year,
    r.month,
    r.value,
    r.isProvisional ? 1 : 0,
    r.provisionalNote,
  ]);
  const priceTuples: PriceTuple[] = priceRows.map((r) => [
    r.seriesId,
    r.year,
    r.month,
    r.value,
  ]);

  const lines = [
    "{",
    `  "generatedBy": "pnpm ingest → pnpm export",`,
    `  "note": "Committed so builds need neither a BLS key nor network access. Absent rows are meaningful: October 2025 was never collected.",`,
    `  "cpiSchema": ["year", "month|null", "value", "isProvisional", "provisionalNote"],`,
    `  "cpi": [`,
    ...cpiTuples.map((t, i) => `    ${JSON.stringify(t)}${i < cpiTuples.length - 1 ? "," : ""}`),
    "  ],",
    `  "priceSchema": ["seriesId", "year", "month", "value"],`,
    `  "prices": [`,
    ...priceTuples.map(
      (t, i) => `    ${JSON.stringify(t)}${i < priceTuples.length - 1 ? "," : ""}`,
    ),
    "  ]",
    "}",
  ];

  mkdirSync(SEED_DIR, { recursive: true });
  writeFileSync(SEED_FILE, lines.join("\n") + "\n");
  console.log(
    `wrote ${SEED_FILE}\n  ${cpiRows.length} cpi · ${priceRows.length.toLocaleString()} prices`,
  );
}

/**
 * Catalogue first, then observations — prices carry a foreign key to `series`,
 * so the series rows have to exist before any price can land.
 */
export async function importSeed(db: Database, { quiet = false } = {}) {
  await db.insert(items).values(ITEMS.map((i, n) => ({ ...i, sortOrder: n })));
  await db.insert(areas).values(AREAS);
  await db
    .insert(series)
    .values(SERIES.map((s) => ({ ...s, isDiscontinued: s.endYear < currentYear() })));

  // Absent on a fresh ingest: the catalogue is what makes the database
  // usable, and the observations are what the ingest is about to write.
  if (!existsSync(SEED_FILE)) {
    if (!quiet) console.log("no observations.json yet — catalogue only");
    return;
  }

  const data = JSON.parse(readFileSync(SEED_FILE, "utf8")) as {
    cpi: CpiTuple[];
    prices: PriceTuple[];
  };

  if (!data.cpi.length && !data.prices.length) {
    if (!quiet) console.log("observations.json is empty — catalogue only");
    return;
  }

  await db
    .insert(cpi)
    .values(
      data.cpi.map(([year, month, value, isProvisional, provisionalNote]) => ({
        year,
        month,
        value,
        isProvisional: isProvisional === 1,
        provisionalNote,
      })),
    )
    .onConflictDoUpdate({
      target: [cpi.year, cpi.month],
      set: { value: sql`excluded.value` },
    });

  // Chunked: PGlite builds one statement per insert, and 420,000 rows in a
  // single VALUES list exhausts the WASM stack.
  const CHUNK = 5_000;
  for (let i = 0; i < data.prices.length; i += CHUNK) {
    await db
      .insert(prices)
      .values(
        data.prices
          .slice(i, i + CHUNK)
          .map(([seriesId, year, month, value]) => ({ seriesId, year, month, value })),
      )
      .onConflictDoUpdate({
        target: [prices.seriesId, prices.year, prices.month],
        set: { value: sql`excluded.value` },
      });
  }

  if (!quiet) {
    console.log(
      `seeded from ${SEED_FILE}\n  ${ITEMS.length} items · ${AREAS.length} areas · ` +
        `${SERIES.length} series · ${data.cpi.length} cpi · ${data.prices.length.toLocaleString()} prices`,
    );
  }
}

const currentYear = () => new Date().getUTCFullYear();

/**
 * Seed export/import.
 *
 * `.pglite/` is 39MB across ~1,000 files — a build artifact, not something to
 * commit. The reproducible seed is this compact data file instead, so a clone
 * can build the whole site without a BLS key and without network access, and
 * so CI is not at the mercy of an API outage.
 *
 * Records are written one per line: it is still valid JSON, but a monthly
 * refresh produces a diff you can actually read.
 *
 *   pnpm tsx src/seed.ts export   # db  → seed/bls-data.json
 *   pnpm tsx src/seed.ts import   # file → db
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { sql } from "drizzle-orm";

import { closeDb, getDb } from "./client";
import { cpi, items, prices } from "./schema";

const SEED_DIR = fileURLToPath(new URL("../seed", import.meta.url));
const SEED_FILE = `${SEED_DIR}/bls-data.json`;

/** [year, month|null, value, isProvisional, note|null] */
type CpiTuple = [number, number | null, number, 0 | 1, string | null];
/** [itemSlug, year, month, value] */
type PriceTuple = [string, number, number, number];

async function exportSeed() {
  const db = getDb();
  const itemRows = await db.select().from(items).orderBy(items.sortOrder);
  const cpiRows = await db.select().from(cpi).orderBy(cpi.year, cpi.month);
  const priceRows = await db.select().from(prices).orderBy(prices.itemSlug, prices.year, prices.month);

  const cpiTuples: CpiTuple[] = cpiRows.map((r) => [
    r.year,
    r.month,
    r.value,
    r.isProvisional ? 1 : 0,
    r.provisionalNote,
  ]);
  const priceTuples: PriceTuple[] = priceRows.map((r) => [r.itemSlug, r.year, r.month, r.value]);

  const lines = [
    "{",
    `  "generatedBy": "pnpm db:ingest → pnpm tsx src/seed.ts export",`,
    `  "note": "Committed so builds need neither a BLS key nor network access. Absent rows are meaningful: October 2025 was never collected.",`,
    `  "items": ${JSON.stringify(itemRows)},`,
    `  "cpiSchema": ["year", "month|null", "value", "isProvisional", "provisionalNote"],`,
    `  "cpi": [`,
    ...cpiTuples.map((t, i) => `    ${JSON.stringify(t)}${i < cpiTuples.length - 1 ? "," : ""}`),
    "  ],",
    `  "priceSchema": ["itemSlug", "year", "month", "value"],`,
    `  "prices": [`,
    ...priceTuples.map((t, i) => `    ${JSON.stringify(t)}${i < priceTuples.length - 1 ? "," : ""}`),
    "  ]",
    "}",
  ];

  mkdirSync(SEED_DIR, { recursive: true });
  writeFileSync(SEED_FILE, lines.join("\n") + "\n");
  console.log(
    `wrote ${SEED_FILE}\n  ${itemRows.length} items · ${cpiRows.length} cpi · ${priceRows.length} prices`,
  );
}

async function importSeed() {
  const db = getDb();
  const data = JSON.parse(readFileSync(SEED_FILE, "utf8")) as {
    items: (typeof items.$inferInsert)[];
    cpi: CpiTuple[];
    prices: PriceTuple[];
  };

  await db.insert(items).values(data.items).onConflictDoNothing();

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

  await db
    .insert(prices)
    .values(
      data.prices.map(([itemSlug, year, month, value]) => ({ itemSlug, year, month, value })),
    )
    .onConflictDoUpdate({
      target: [prices.itemSlug, prices.year, prices.month],
      set: { value: sql`excluded.value` },
    });

  console.log(
    `seeded from ${SEED_FILE}\n  ${data.items.length} items · ${data.cpi.length} cpi · ${data.prices.length} prices`,
  );
}

const mode = process.argv[2];
try {
  if (mode === "export") await exportSeed();
  else if (mode === "import") await importSeed();
  else {
    console.error("usage: tsx src/seed.ts <export|import>");
    process.exit(1);
  }
} finally {
  await closeDb();
}

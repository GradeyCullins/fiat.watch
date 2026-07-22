/**
 * Cross-checks the freshly ingested database against the JSON files the Rails
 * app shipped. Any divergence is either a bug in the ingest or a documented
 * improvement — this prints both so neither passes unnoticed.
 *
 * Run: pnpm tsx src/verify.ts <path-to-old-db-dir>
 */
import { readFileSync } from "node:fs";
import { and, eq, isNull, sql } from "drizzle-orm";

import { closeDb, getDb } from "./client";
import { cpi, prices } from "./schema";

const oldDir = process.argv[2];
if (!oldDir) {
  console.error("usage: tsx src/verify.ts <dir containing the old *.json>");
  process.exit(1);
}

const read = (f: string) => JSON.parse(readFileSync(`${oldDir}/${f}`, "utf8"));
const db = getDb();

let problems = 0;
const note = (s: string) => console.log(`  ${s}`);
const fail = (s: string) => {
  problems++;
  console.log(`  ✗ ${s}`);
};

try {
  // --- CPI annual ---------------------------------------------------------
  console.log("CPI annual averages vs cpi_data.json");
  const oldCpi: Record<string, number> = read("cpi_data.json").annual_averages;
  const newAnnual = await db
    .select({ year: cpi.year, value: cpi.value, prov: cpi.isProvisional })
    .from(cpi)
    .where(isNull(cpi.month));
  const newByYear = new Map(newAnnual.map((r) => [r.year, r]));

  let mismatched = 0;
  for (const [year, value] of Object.entries(oldCpi)) {
    const row = newByYear.get(Number(year));
    if (!row) {
      fail(`${year} missing from new data`);
    } else if (row.value !== value && !row.prov) {
      mismatched++;
      if (mismatched <= 5) fail(`${year}: ${row.value} != ${value}`);
    }
  }
  note(`${newAnnual.length} annual rows (old file had ${Object.keys(oldCpi).length})`);
  if (mismatched === 0) note("✓ every non-provisional annual value matches");

  // The provisional year is expected to differ — BLS has published newer
  // months since the old file was written.
  const prov = newAnnual.find((r) => r.prov);
  if (prov) note(`provisional: ${prov.year} = ${prov.value} (old file: ${oldCpi[String(prov.year)]})`);

  // --- CPI monthly (the new capability) -----------------------------------
  console.log("\nCPI monthly — the series cpi.rake discarded");
  const [monthlyCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(cpi)
    .where(sql`${cpi.month} is not null`);
  note(`${monthlyCount?.n} monthly CPI observations`);

  const oct2025 = await db
    .select()
    .from(cpi)
    .where(and(eq(cpi.year, 2025), eq(cpi.month, 10)));
  if (oct2025.length === 0) {
    note("✓ October 2025 CPI absent — BLS cancelled it (shutdown); correct to have no row");
  } else {
    fail(`October 2025 CPI present (${oct2025[0]?.value}) — expected absent`);
  }

  // --- item prices --------------------------------------------------------
  console.log("\nItem monthly prices vs average_price_monthly_data.json");
  const oldItems = read("average_price_monthly_data.json").items as Record<
    string,
    { months: Record<string, Record<string, number>> }
  >;

  const newPrices = await db.select().from(prices);
  const newKey = new Map(newPrices.map((p) => [`${p.itemSlug}:${p.year}:${p.month}`, p.value]));

  let priceMismatch = 0;
  let oldCount = 0;
  for (const [slug, item] of Object.entries(oldItems)) {
    for (const [year, months] of Object.entries(item.months)) {
      for (const [month, value] of Object.entries(months)) {
        oldCount++;
        const k = `${slug}:${Number(year)}:${Number(month)}`;
        const got = newKey.get(k);
        if (got === undefined) {
          priceMismatch++;
          if (priceMismatch <= 5) fail(`${k} missing from new data`);
        } else if (got !== value) {
          priceMismatch++;
          if (priceMismatch <= 5) fail(`${k}: ${got} != ${value}`);
        }
      }
    }
  }
  note(`old file: ${oldCount} observations · new db: ${newPrices.length}`);
  if (priceMismatch === 0) note("✓ every old observation reproduced exactly");
  note(`new observations added since the old fetch: ${newPrices.length - oldCount}`);

  // --- the permanent hole -------------------------------------------------
  console.log("\nOctober 2025 price hole (BLS shutdown)");
  for (const slug of ["gas", "eggs", "bread", "milk", "ground-beef"]) {
    const rows = await db
      .select()
      .from(prices)
      .where(and(eq(prices.itemSlug, slug), eq(prices.year, 2025), eq(prices.month, 10)));
    note(`${slug.padEnd(12)} ${rows.length === 0 ? "absent (expected for food items)" : `present: ${rows[0]?.value}`}`);
  }

  console.log(problems === 0 ? "\n✓ verification passed" : `\n✗ ${problems} problem(s)`);
} finally {
  await closeDb();
}

process.exit(problems === 0 ? 0 : 1);

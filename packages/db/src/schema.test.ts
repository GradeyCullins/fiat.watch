/**
 * The schema makes claims that only hold if the database enforces them.
 * These tests run against a real in-memory Postgres, so they test Postgres,
 * not our belief about Postgres.
 */
import { migrate } from "drizzle-orm/pglite/migrator";
import { and, eq, isNull, sql } from "drizzle-orm";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";

import { createMemoryDb } from "./client";
import { cpi, items, prices } from "./schema";

const db = createMemoryDb();

/**
 * Drizzle wraps driver errors: `message` is always "Failed query: …" and the
 * actual Postgres error (with its constraint name and SQLSTATE) is on `cause`.
 * Asserting against `message` therefore passes for *any* failure, which would
 * make these tests useless — they'd go green even if the insert failed for an
 * unrelated reason.
 */
async function expectRejection(promise: Promise<unknown>, pattern: RegExp) {
  let error: unknown;
  try {
    await promise;
  } catch (e) {
    error = e;
  }
  expect(error, "expected the insert to be rejected").toBeDefined();
  const cause = (error as { cause?: unknown }).cause;
  const text = `${(cause as Error | undefined)?.message ?? ""} ${(error as Error).message}`;
  expect(text).toMatch(pattern);
}

beforeAll(async () => {
  await migrate(db, { migrationsFolder: fileURLToPath(new URL("../drizzle", import.meta.url)) });
  await db.insert(items).values({
    slug: "gas",
    label: "gas",
    labelAttributive: "gas",
    unit: "per gallon",
    seriesId: "APU000074714",
    seriesName: "Gasoline, unleaded regular",
    sortOrder: 1,
  });
});

describe("cpi period uniqueness", () => {
  it("stores a monthly and an annual row for the same year", async () => {
    await db.insert(cpi).values([
      { year: 1990, month: 3, value: 128.7 },
      { year: 1990, month: null, value: 130.7 },
    ]);

    const annual = await db.select().from(cpi).where(and(eq(cpi.year, 1990), isNull(cpi.month)));
    expect(annual).toHaveLength(1);
    expect(annual[0]?.value).toBe(130.7);
  });

  it("rejects a duplicate annual row — NULLS NOT DISTINCT is doing real work", async () => {
    await db.insert(cpi).values({ year: 1991, month: null, value: 136.2 });
    // Without NULLS NOT DISTINCT, Postgres treats every NULL as distinct and
    // this second insert would silently succeed, giving a year two annual
    // averages and making every downstream lookup nondeterministic.
    await expectRejection(
      db.insert(cpi).values({ year: 1991, month: null, value: 999 }),
      /duplicate key|unique/i,
    );
  });

  it("rejects a duplicate monthly row", async () => {
    await db.insert(cpi).values({ year: 1992, month: 6, value: 140.2 });
    await expectRejection(
      db.insert(cpi).values({ year: 1992, month: 6, value: 1 }),
      /duplicate key|unique/i,
    );
  });
});

describe("provisional data is a column, not a footnote", () => {
  it("round-trips the flag and its reason", async () => {
    await db.insert(cpi).values({
      year: 2026,
      month: null,
      value: 333.952,
      isProvisional: true,
      provisionalNote: "June 2026 CPI is used for 2026 until the annual average is published.",
    });

    const [row] = await db.select().from(cpi).where(and(eq(cpi.year, 2026), isNull(cpi.month)));
    expect(row?.isProvisional).toBe(true);
    expect(row?.provisionalNote).toContain("June 2026");
  });

  it("defaults to not provisional", async () => {
    await db.insert(cpi).values({ year: 1985, month: null, value: 107.6 });
    const [row] = await db.select().from(cpi).where(and(eq(cpi.year, 1985), isNull(cpi.month)));
    expect(row?.isProvisional).toBe(false);
  });
});

describe("prices", () => {
  it("requires a month — annual is derived, never stored", async () => {
    // A null month would mean "annual", and storing that here is precisely the
    // second-source-of-truth the old average_price_data.json was.
    await expectRejection(
      db.insert(prices).values({ itemSlug: "gas", year: 1980, month: null as never, value: 1.245 }),
      /null value|not-null/i,
    );
  });

  it("derives the annual average from months in SQL", async () => {
    await db.insert(prices).values(
      Array.from({ length: 12 }, (_, i) => ({
        itemSlug: "gas",
        year: 1981,
        month: i + 1,
        value: i + 1,
      })),
    );

    const [row] = await db
      .select({ avg: sql<number>`avg(${prices.value})::float8`, n: sql<number>`count(*)::int` })
      .from(prices)
      .where(and(eq(prices.itemSlug, "gas"), eq(prices.year, 1981)));

    expect(row?.n).toBe(12);
    expect(row?.avg).toBeCloseTo(6.5, 10);
  });

  it("rejects a price for an unknown item", async () => {
    await expectRejection(
      db.insert(prices).values({ itemSlug: "caviar", year: 2000, month: 1, value: 99 }),
      /foreign key/i,
    );
  });
});

describe("an absent row is meaningful", () => {
  it("distinguishes 'never collected' from zero", async () => {
    // October 2025 was never collected — BLS suspended collection during the
    // shutdown and could not do it retroactively. The correct representation
    // is no row at all; a 0 would be a price, and charts must gap rather than
    // interpolate across it.
    await db.insert(prices).values([
      { itemSlug: "gas", year: 2025, month: 9, value: 3.1 },
      { itemSlug: "gas", year: 2025, month: 11, value: 3.3 },
    ]);

    const rows = await db
      .select()
      .from(prices)
      .where(and(eq(prices.itemSlug, "gas"), eq(prices.year, 2025)));

    expect(rows.map((r) => r.month).sort((a, b) => a - b)).toEqual([9, 11]);
    expect(rows.find((r) => r.month === 10)).toBeUndefined();
  });
});

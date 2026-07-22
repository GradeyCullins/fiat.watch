/**
 * Parity spec.
 *
 * `__fixtures__/rails-golden.json` was captured from the running Rails app
 * immediately before it was deleted. It is the only record of what the old
 * implementation actually produced, and these tests are the reason it was
 * captured: the arithmetic and the money formatting are the only parts of
 * this app that can be silently *wrong* rather than merely ugly.
 *
 * Two kinds of assertion here:
 *
 *   1. Behaviour we must reproduce exactly — the conversion arithmetic.
 *   2. Behaviour we deliberately changed — the money formatter. Rails had
 *      three that disagreed; we standardised on half-up. The divergence is
 *      asserted, not ignored, so it can never drift unnoticed.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { CpiTable, convert, InvalidAmountError, UnknownPeriodError } from "./cpi";
import { formatUsd } from "./format";

interface Golden {
  cpi: {
    annual_averages: Record<string, number>;
    earliest_year: number;
    latest_year: number;
    provisional_years: Record<string, { period: string; note: string }>;
  };
  conversions: Array<{
    amount: number;
    from_year: number;
    to_year: number;
    from_cpi: number;
    to_cpi: number;
    converted: number;
    converted_formatted: string;
    inflation_factor: number;
    percent_change: number;
  }>;
  conversion_errors: Array<{
    input: [unknown, number, number];
    raised: string | null;
    message?: string;
  }>;
  items: Record<
    string,
    {
      annual: Record<
        string,
        { price: number; fmt_sprintf: string; fmt_bigdecimal: string; fmt_number_to_currency: string }
      >;
      monthly: Record<string, { price: number; fmt_bigdecimal: string }> | null;
    }
  >;
  formatter_disagreements: Array<{
    value: number;
    sprintf: string;
    bigdecimal: string;
    number_to_currency: string;
  }>;
  tie_cases: Record<
    string,
    { fmt_sprintf: string; fmt_bigdecimal: string; fmt_number_to_currency: string }
  >;
}

const golden: Golden = JSON.parse(
  readFileSync(fileURLToPath(new URL("../__fixtures__/rails-golden.json", import.meta.url)), "utf8"),
);

const table = new CpiTable(
  Object.entries(golden.cpi.annual_averages).map(([year, value]) => ({
    year: Number(year),
    month: null,
    value,
    isProvisional: year in golden.cpi.provisional_years,
  })),
);

describe("CpiTable mirrors the Rails data surface", () => {
  it("exposes the same year range", () => {
    expect(table.earliestYear).toBe(golden.cpi.earliest_year);
    expect(table.latestYear).toBe(golden.cpi.latest_year);
  });

  it("carries every annual average", () => {
    expect(table.years).toHaveLength(Object.keys(golden.cpi.annual_averages).length);
  });

  it("marks the provisional year", () => {
    const provisional = Object.keys(golden.cpi.provisional_years).map(Number);
    expect(provisional.length).toBeGreaterThan(0);
    for (const year of provisional) expect(table.at(year).isProvisional).toBe(true);
  });
});

describe("conversion arithmetic is bit-identical to Rails", () => {
  it(`reproduces all ${golden.conversions.length} captured conversions`, () => {
    const mismatches: string[] = [];

    for (const c of golden.conversions) {
      const r = convert(table, {
        amount: c.amount,
        from: { year: c.from_year },
        to: { year: c.to_year },
      });

      if (r.fromCpi !== c.from_cpi) mismatches.push(`fromCpi ${c.from_year}`);
      if (r.toCpi !== c.to_cpi) mismatches.push(`toCpi ${c.to_year}`);
      // Exact equality, not toBeCloseTo: both languages use IEEE-754 doubles
      // and perform the same single multiplication, so any drift is a real bug.
      if (r.converted !== c.converted) {
        mismatches.push(`${c.amount} ${c.from_year}->${c.to_year}: ${r.converted} != ${c.converted}`);
      }
      if (r.inflationFactor !== c.inflation_factor) mismatches.push(`factor ${c.amount}`);
      if (r.percentChange !== c.percent_change) mismatches.push(`pct ${c.amount}`);
    }

    expect(mismatches.slice(0, 10)).toEqual([]);
  });
});

describe("guard rails match Rails", () => {
  it.each(golden.conversion_errors.filter((e) => e.raised))(
    "rejects $input",
    ({ input, message }) => {
      const [amount, fromYear, toYear] = input as [number, number, number];
      let thrown: unknown;
      try {
        convert(table, { amount, from: { year: fromYear }, to: { year: toYear } });
      } catch (e) {
        thrown = e;
      }

      expect(thrown).toBeDefined();
      // Rails coerced non-numerics via Float() and raised InvalidAmount; we
      // reject them at the type boundary with the same message.
      if (message?.includes("No CPI")) {
        expect(thrown).toBeInstanceOf(UnknownPeriodError);
        expect((thrown as Error).message).toBe(message);
      } else {
        expect(thrown).toBeInstanceOf(InvalidAmountError);
        expect((thrown as Error).message).toBe(message);
      }
    },
  );
});

describe("formatUsd reproduces the BigDecimal / number_to_currency behaviour", () => {
  it("agrees on every annual price in the dataset", () => {
    const mismatches: string[] = [];
    for (const [slug, item] of Object.entries(golden.items)) {
      for (const [year, row] of Object.entries(item.annual)) {
        const ours = formatUsd(row.price);
        if (ours !== row.fmt_bigdecimal) {
          mismatches.push(`${slug} ${year}: ${row.price} -> ${ours} != ${row.fmt_bigdecimal}`);
        }
        // The two "correct" Rails formatters always agreed; assert that held.
        expect(row.fmt_bigdecimal).toBe(row.fmt_number_to_currency);
      }
    }
    expect(mismatches).toEqual([]);
  });

  it("agrees on every monthly price in the dataset", () => {
    const mismatches: string[] = [];
    for (const [slug, item] of Object.entries(golden.items)) {
      for (const [period, row] of Object.entries(item.monthly ?? {})) {
        const ours = formatUsd(row.price);
        if (ours !== row.fmt_bigdecimal) {
          mismatches.push(`${slug} ${period}: ${row.price} -> ${ours} != ${row.fmt_bigdecimal}`);
        }
      }
    }
    expect(mismatches).toEqual([]);
  });

  it("resolves every case where the three Rails formatters disagreed", () => {
    expect(golden.formatter_disagreements.length).toBeGreaterThan(0);
    for (const d of golden.formatter_disagreements) {
      // We side with bigdecimal/number_to_currency, against sprintf.
      expect(formatUsd(d.value)).toBe(d.bigdecimal);
      expect(formatUsd(d.value)).not.toBe(d.sprintf);
    }
  });

  it("handles the .xx5 tie cases half-up", () => {
    for (const [input, expected] of Object.entries(golden.tie_cases)) {
      expect(formatUsd(Number(input))).toBe(expected.fmt_bigdecimal);
    }
  });
});

describe("formatUsd basics", () => {
  it.each([
    [0.005, "$0.01"],
    [1.245, "$1.25"],
    [1.235, "$1.24"],
    [0.999, "$1.00"],
    [9.999, "$10.00"],
    [1000, "$1,000.00"],
    [1234567.891, "$1,234,567.89"],
    [1_000_000_000_000, "$1,000,000,000,000.00"],
    [0.001, "$0.00"],
  ])("formats %s as %s", (input, expected) => {
    expect(formatUsd(input)).toBe(expected);
  });

  it("never emits exponential notation", () => {
    expect(formatUsd(1e-7)).toBe("$0.00");
    expect(formatUsd(1.5e13)).toBe("$15,000,000,000,000.00");
  });

  it("rejects non-finite input rather than rendering $NaN", () => {
    expect(() => formatUsd(Number.NaN)).toThrow(RangeError);
    expect(() => formatUsd(Infinity)).toThrow(RangeError);
  });
});

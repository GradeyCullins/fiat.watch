/**
 * CPI-U conversion.
 *
 * Deliberately pure: this module knows nothing about the database or the BLS
 * API. Callers hand it a CpiTable; it does arithmetic. That keeps the one
 * thing that can be silently *wrong* (rather than merely ugly) fully unit
 * testable against the fixtures captured from the Rails implementation.
 *
 * The arithmetic is `amount * (toCpi / fromCpi)` in IEEE-754 doubles,
 * unrounded — identical to Ruby, which uses the same doubles. Rounding
 * happens only at the presentation edge, in format.ts.
 */

export class UnknownPeriodError extends Error {
  constructor(year: number, month: number | null) {
    super(`No CPI for ${month == null ? year : `${year}-${String(month).padStart(2, "0")}`}`);
    this.name = "UnknownPeriodError";
  }
}

export class InvalidAmountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAmountError";
  }
}

/** Matches the Rails guard exactly so parity tests can assert on it. */
export const MAX_AMOUNT = 1_000_000_000_000;

export interface CpiPoint {
  year: number;
  /** null = the annual average for that year. */
  month: number | null;
  value: number;
  /**
   * True when this figure is a stand-in rather than a published final value —
   * e.g. 2026's "annual average" is currently a single month's reading, and
   * partial years are means over fewer than twelve months.
   */
  isProvisional: boolean;
}

export interface Period {
  year: number;
  /** Omit or null for the annual average. */
  month?: number | null;
}

export interface ConversionResult {
  amount: number;
  from: Required<Period>;
  to: Required<Period>;
  fromCpi: number;
  toCpi: number;
  converted: number;
  /** converted / amount */
  inflationFactor: number;
  /** (inflationFactor - 1) * 100 */
  percentChange: number;
  /** True if either endpoint is provisional — the answer inherits the caveat. */
  isProvisional: boolean;
}

const key = (year: number, month: number | null | undefined) =>
  `${year}:${month ?? "A"}`;

export class CpiTable {
  #points = new Map<string, CpiPoint>();
  #annualYears: number[] = [];

  constructor(points: Iterable<CpiPoint>) {
    for (const p of points) this.#points.set(key(p.year, p.month), p);
    this.#annualYears = [...this.#points.values()]
      .filter((p) => p.month === null)
      .map((p) => p.year)
      .sort((a, b) => a - b);
  }

  get earliestYear(): number {
    const y = this.#annualYears[0];
    if (y === undefined) throw new Error("CpiTable has no annual data");
    return y;
  }

  get latestYear(): number {
    const y = this.#annualYears.at(-1);
    if (y === undefined) throw new Error("CpiTable has no annual data");
    return y;
  }

  get years(): readonly number[] {
    return this.#annualYears;
  }

  at(year: number, month: number | null = null): CpiPoint {
    const point = this.#points.get(key(year, month));
    if (!point) throw new UnknownPeriodError(year, month);
    return point;
  }

  has(year: number, month: number | null = null): boolean {
    return this.#points.has(key(year, month));
  }
}

export function convert(
  table: CpiTable,
  { amount, from, to }: { amount: number; from: Period; to: Period },
): ConversionResult {
  if (typeof amount !== "number" || Number.isNaN(amount)) {
    throw new InvalidAmountError("Amount must be a number");
  }
  if (amount <= 0) throw new InvalidAmountError("Amount must be positive");
  if (amount > MAX_AMOUNT) throw new InvalidAmountError("Amount too large");

  const fromMonth = from.month ?? null;
  const toMonth = to.month ?? null;

  const fromPoint = table.at(from.year, fromMonth);
  const toPoint = table.at(to.year, toMonth);

  const converted = amount * (toPoint.value / fromPoint.value);
  const inflationFactor = converted / amount;

  return {
    amount,
    from: { year: from.year, month: fromMonth },
    to: { year: to.year, month: toMonth },
    fromCpi: fromPoint.value,
    toCpi: toPoint.value,
    converted,
    inflationFactor,
    percentChange: (inflationFactor - 1) * 100,
    isProvisional: fromPoint.isProvisional || toPoint.isProvisional,
  };
}

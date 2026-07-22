/**
 * The single place item names live.
 *
 * The Rails app had five: `question_name` in the JSON (the only one rendered),
 * `name` and `item_name` also in the JSON (both dead — read nowhere in app/,
 * lib/ or test/), `CostPagesController::PRICE_SUBJECTS`, and
 * `ApplicationHelper::HISTORICAL_PRICE_LINK_LABELS`. Two of them disagreed on
 * plurality and two raised KeyError if a sixth item were ever added.
 */

export const CPI_SERIES_ID = "CUUR0000SA0";

export const CPI_SERIES_NAME =
  "Consumer Price Index for All Urban Consumers (CPI-U), U.S. city average, all items";

/** CUUR0000SA0 begins in 1913. */
export const CPI_START_YEAR = 1913;

/**
 * The Rails importer floored at 1976 (`ENV["AVERAGE_PRICE_START_YEAR"] || 1976`).
 * Gas data began at exactly that year, so it was impossible to tell from the
 * data whether 1976 was the true start of the series or just where we stopped
 * asking. We ask from 1960 and let BLS answer; years before a series exists
 * simply come back empty.
 */
export const PRICE_START_YEAR = 1960;

export interface ItemDefinition {
  slug: string;
  /** Sentence form — "the price of {eggs}". */
  label: string;
  /** Attributive form — "{egg} prices". */
  labelAttributive: string;
  unit: string;
  seriesId: string;
  seriesName: string;
  sortOrder: number;
}

export const ITEMS: readonly ItemDefinition[] = [
  {
    slug: "gas",
    label: "gas",
    labelAttributive: "gas",
    unit: "per gallon",
    seriesId: "APU000074714",
    seriesName: "Gasoline, unleaded regular, per gallon/3.785 liters",
    sortOrder: 1,
  },
  {
    slug: "eggs",
    label: "eggs",
    labelAttributive: "egg",
    unit: "per dozen",
    seriesId: "APU0000708111",
    seriesName: "Eggs, grade A, large, per doz.",
    sortOrder: 2,
  },
  {
    slug: "bread",
    label: "bread",
    labelAttributive: "bread",
    unit: "per pound",
    seriesId: "APU0000702111",
    seriesName: "Bread, white, pan, per lb. (453.6 gm)",
    sortOrder: 3,
  },
  {
    slug: "milk",
    label: "milk",
    labelAttributive: "milk",
    unit: "per gallon",
    seriesId: "APU0000709112",
    seriesName: "Milk, fresh, whole, fortified, per gal. (3.8 lit)",
    sortOrder: 4,
  },
  {
    slug: "ground-beef",
    label: "ground beef",
    labelAttributive: "ground beef",
    unit: "per pound",
    seriesId: "APU0000703112",
    seriesName: "Ground beef, 100% beef, per lb. (453.6 gm)",
    sortOrder: 5,
  },
] as const;

export const ITEM_BY_SERIES_ID = new Map(ITEMS.map((i) => [i.seriesId, i]));

/**
 * The seven vertical calculator pages.
 *
 * Ported from `SeoPagesController::PAGES` on `master`, minus the FAQ and
 * use-case prose, which was filler around a page that had no tool on it.
 *
 * The examples are structured (`amount` + `year`) rather than display strings.
 * In the Rails app all three chips on a page linked to the identical URL and
 * the page had no calculator at all — they were doorway pages. Here each chip
 * deep-links into the working tool.
 */

export interface CalculatorExample {
  amount: number
  year: number
}

export interface CalculatorPage {
  slug: string
  /**
   * The glyph for this calculator, on the definition rather than derived.
   *
   * `emojiFor()` keys off item slugs, so asking it for "salary" or "rent"
   * returned the fallback receipt — five of the seven calculators were a 🧾.
   * These are about a *kind of spending*, not a BLS item, so they carry their
   * own.
   */
  emoji: string
  /**
   * Where this page lived on Rails. Kept only so `next.config.ts` can 301 it —
   * nothing links here. See `path` for the live URL.
   */
  legacyPath: string
  title: string
  heading: string
  description: string
  intro: string
  /** Placed in the amount field, e.g. "salary" → "45000". */
  noun: string
  examples: CalculatorExample[]
  /** Average-price items worth surfacing on this page. */
  costItems: string[]
}

/**
 * The live URL for a calculator.
 *
 * These moved from `/gas-inflation-calculator` to `/calculators/gas` — a
 * deliberate trade. The old paths rank and every one of them is now a 301,
 * which resets them; what it buys is a real section with one shape, instead of
 * seven pages loose at the root pretending not to be a group.
 */
export const calculatorPath = (slug: string) => `/calculators/${slug}`

/**
 * The general dollar converter. Not one of the seven verticals, but a
 * calculator, so it lives in the same section rather than on the home page.
 */
export const GENERAL_CALCULATOR = {
  emoji: "💵",
  label: "Inflation calculator",
  path: "/calculators/inflation",
  blurb: "Any amount, any two years — the general dollar converter.",
} as const

/** The one CPI series every calculator currently runs on. */
export const CPI_SERIES = "CUUR0000SA0"

export const CALCULATORS: CalculatorPage[] = [
  {
    slug: "salary",
    emoji: "💼",
    legacyPath: "/salary-inflation-calculator",
    title: "Salary Inflation Calculator With CPI Data",
    heading: "Salary inflation calculator",
    description:
      "Compare a salary from one year to another using official BLS CPI data. See what old paychecks, raises, and job offers are worth in today's dollars.",
    intro:
      "A raise can look bigger on paper than it feels in real life. Compare salaries across years and see whether compensation kept up with inflation.",
    noun: "salary",
    examples: [
      { amount: 45000, year: 2000 },
      { amount: 80000, year: 2015 },
      { amount: 100000, year: 1990 },
    ],
    costItems: [],
  },
  {
    slug: "rent",
    emoji: "🏠",
    legacyPath: "/rent-inflation-calculator",
    title: "Rent Inflation Calculator With CPI Data",
    heading: "Rent inflation calculator",
    description:
      "Compare rent prices across years with official BLS CPI data. Convert old monthly rent into today's purchasing power.",
    intro:
      "Rent is one of the clearest ways inflation shows up in everyday budgets. Compare an old lease, apartment listing, or housing cost against another year.",
    noun: "monthly rent",
    examples: [
      { amount: 750, year: 1998 },
      { amount: 1200, year: 2010 },
      { amount: 350, year: 1985 },
    ],
    costItems: [],
  },
  {
    slug: "groceries",
    emoji: "🛒",
    legacyPath: "/grocery-inflation-calculator",
    title: "Grocery Inflation Calculator With CPI Data",
    heading: "Grocery inflation calculator",
    description:
      "Compare grocery spending across years with official BLS CPI data. Estimate what past food budgets mean in today's dollars.",
    intro:
      "Grocery budgets make inflation tangible. Convert an old weekly or monthly grocery bill into another year's dollars using the same CPI engine as the main calculator.",
    noun: "grocery bill",
    examples: [
      { amount: 50, year: 1995 },
      { amount: 125, year: 2008 },
      { amount: 300, year: 2020 },
    ],
    costItems: ["eggs", "bread", "milk", "ground-beef"],
  },
  {
    slug: "gas",
    emoji: "⛽",
    legacyPath: "/gas-inflation-calculator",
    title: "Gas Inflation Calculator With CPI Data",
    heading: "Gas inflation calculator",
    description:
      "Compare gas prices across years with official BLS CPI data. Convert old fuel costs into today's dollars.",
    intro:
      "Gas prices are one of the easiest ways to feel inflation. Convert an old fill-up, gallon price, or fuel budget into another year's dollars.",
    noun: "fuel cost",
    examples: [
      { amount: 1.25, year: 1980 },
      { amount: 1.51, year: 2000 },
      { amount: 2.17, year: 2020 },
    ],
    costItems: ["gas"],
  },
  {
    slug: "car-prices",
    emoji: "🚗",
    legacyPath: "/car-price-inflation-calculator",
    title: "Car Price Inflation Calculator With CPI Data",
    heading: "Car price inflation calculator",
    description:
      "Compare car prices across years with official BLS CPI data. Convert old vehicle prices into today's dollars.",
    intro:
      "Sticker prices are hard to compare across decades. Convert an old car price, loan amount, or down payment into another year's purchasing power.",
    noun: "vehicle price",
    examples: [
      { amount: 8000, year: 1985 },
      { amount: 18000, year: 2000 },
      { amount: 35000, year: 2020 },
    ],
    costItems: [],
  },
  {
    slug: "college-tuition",
    emoji: "🎓",
    legacyPath: "/college-tuition-inflation-calculator",
    title: "College Tuition Inflation Calculator With CPI Data",
    heading: "College tuition inflation calculator",
    description:
      "Compare college tuition and education costs across years with official BLS CPI data.",
    intro:
      "Tuition numbers move fast, and old prices can sound unreal. Convert tuition, fees, or student budgets into another year's dollars.",
    noun: "tuition bill",
    examples: [
      { amount: 2500, year: 1980 },
      { amount: 10000, year: 2000 },
      { amount: 25000, year: 2015 },
    ],
    costItems: [],
  },
  {
    slug: "minimum-wage",
    emoji: "🪙",
    legacyPath: "/minimum-wage-inflation-calculator",
    title: "Minimum Wage Inflation Calculator With CPI Data",
    heading: "Minimum wage inflation calculator",
    description: "See what an old hourly wage is worth today using official BLS CPI data.",
    intro:
      "Hourly pay only tells part of the story. Convert an old minimum wage, starting wage, or hourly rate into today's purchasing power.",
    noun: "hourly wage",
    examples: [
      { amount: 3.35, year: 1985 },
      { amount: 5.15, year: 2000 },
      { amount: 7.25, year: 2010 },
    ],
    costItems: [],
  },
]

export const calculatorBySlug = (slug: string) => CALCULATORS.find((c) => c.slug === slug) ?? null

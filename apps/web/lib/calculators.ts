/**
 * The seven vertical calculator pages.
 *
 * Ported from `SeoPagesController::PAGES` on `master`, with one substantive
 * change: the examples are structured (`amount` + `year`) rather than display
 * strings. In the Rails app all three chips on a page linked to the identical
 * URL and the page had no calculator on it at all — they were doorway pages.
 * Here each chip deep-links into a working tool.
 */

export interface CalculatorExample {
  amount: number
  year: number
}

export interface CalculatorPage {
  slug: string
  /** The URL path, unchanged from Rails — these rank and must not move. */
  path: string
  title: string
  heading: string
  description: string
  intro: string
  /** Placed in the amount field, e.g. "salary" → "45000". */
  noun: string
  examples: CalculatorExample[]
  /** Average-price items worth surfacing on this page. */
  costItems: string[]
  useCases: string[]
  faq: { question: string; answer: string }[]
}

export const CALCULATORS: CalculatorPage[] = [
  {
    slug: "salary",
    path: "/salary-inflation-calculator",
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
    useCases: [
      "Compare an old offer letter with a current salary.",
      "Check whether a raise or promotion beat inflation.",
      "Translate annual pay or hourly wages into another year's dollars.",
    ],
    faq: [
      {
        question: "How do I calculate salary inflation?",
        answer:
          "Enter the salary amount, the year it was paid, and the comparison year. Fiat Watch converts the amount using the CPI-U ratio between those years.",
      },
      {
        question: "Can this show whether my raise beat inflation?",
        answer:
          "Yes. Compare your old salary to the year of your new salary, then compare the result with your actual pay.",
      },
      {
        question: "Does this work for hourly wages?",
        answer:
          "Yes. Enter the hourly rate as the amount and compare it across years the same way you would compare an annual salary.",
      },
    ],
  },
  {
    slug: "rent",
    path: "/rent-inflation-calculator",
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
    useCases: [
      "Convert an old monthly rent into today's dollars.",
      "Compare apartment listings or lease renewals across years.",
      "Put past housing costs in context before comparing budgets.",
    ],
    faq: [
      {
        question: "How do I compare rent prices across years?",
        answer:
          "Enter the monthly rent amount, the lease year, and the year you want to compare against. The calculator adjusts the rent with CPI-U.",
      },
      {
        question: "Is this the same as local rent inflation?",
        answer:
          "No. CPI-U is a national consumer price measure, so it is best for broad purchasing-power comparisons rather than city-specific rent indexes.",
      },
      {
        question: "Can I use this for mortgage or housing costs?",
        answer:
          "You can use it to compare a dollar amount across years, but it does not model interest rates, taxes, insurance, or local home prices.",
      },
    ],
  },
  {
    slug: "groceries",
    path: "/grocery-inflation-calculator",
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
    useCases: [
      "Compare weekly or monthly grocery spending across years.",
      "Translate old food budgets into today's dollars.",
      "Put historical food costs in context with current household spending.",
    ],
    faq: [
      {
        question: "How do I calculate grocery inflation?",
        answer:
          "Enter a grocery bill or food budget, choose the original year, and pick the comparison year. Fiat Watch adjusts the amount with CPI-U.",
      },
      {
        question: "Does this use a food-only CPI series?",
        answer:
          "No. This page uses the same all-items CPI-U engine as the main calculator for broad purchasing-power comparisons.",
      },
      {
        question: "Can I compare specific grocery items?",
        answer:
          "Yes — Fiat Watch also carries BLS average-price series for eggs, bread, milk, and ground beef, linked below.",
      },
    ],
  },
  {
    slug: "gas",
    path: "/gas-inflation-calculator",
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
    useCases: [
      "Compare a historical gas price per gallon with today's dollars.",
      "Convert an old fill-up or monthly fuel budget across years.",
      "Separate general inflation from the sticker shock of gasoline prices.",
    ],
    faq: [
      {
        question: "How do I calculate gas price inflation?",
        answer:
          "Enter the gas price or fuel spend, choose the original year, and pick the target year. The result shows the CPI-U adjusted value.",
      },
      {
        question: "Is this a gasoline-only inflation index?",
        answer:
          "No. This calculator uses all-items CPI-U. For actual BLS average gas prices, use the historical gas cost pages.",
      },
      {
        question: "Can I compare a full tank instead of a gallon price?",
        answer: "Yes. Enter the total fill-up cost as the amount and compare it between years.",
      },
    ],
  },
  {
    slug: "car-prices",
    path: "/car-price-inflation-calculator",
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
    useCases: [
      "Convert an old vehicle sticker price into today's dollars.",
      "Compare car down payments, loan amounts, or repair bills across years.",
      "Put classic car ads or old purchase prices into inflation-adjusted context.",
    ],
    faq: [
      {
        question: "How do I compare car prices across years?",
        answer:
          "Enter the vehicle price, the purchase year, and the comparison year. Fiat Watch adjusts the amount using CPI-U.",
      },
      {
        question: "Does this account for new-car features or financing?",
        answer:
          "No. It compares purchasing power only and does not adjust for quality changes, interest rates, taxes, incentives, or dealer fees.",
      },
      {
        question: "Can I use it for used cars?",
        answer:
          "Yes. Any dollar amount can be compared across years, including used-car prices and private-sale listings.",
      },
    ],
  },
  {
    slug: "college-tuition",
    path: "/college-tuition-inflation-calculator",
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
    useCases: [
      "Convert old tuition bills into today's dollars.",
      "Compare student budgets, fees, or semester costs across years.",
      "Put historical college prices in context before comparing school costs.",
    ],
    faq: [
      {
        question: "How do I calculate tuition inflation?",
        answer:
          "Enter a tuition amount, choose the year it was charged, and pick the comparison year. The calculator adjusts the amount with CPI-U.",
      },
      {
        question: "Is this a college-specific price index?",
        answer:
          "No. It uses all-items CPI-U for general purchasing power, not a dedicated education or tuition index.",
      },
      {
        question: "Can I include fees, room, and board?",
        answer:
          "Yes. Enter the total dollar amount you want to compare, whether that is tuition only or a broader student budget.",
      },
    ],
  },
  {
    slug: "minimum-wage",
    path: "/minimum-wage-inflation-calculator",
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
    useCases: [
      "Convert an old minimum wage into today's dollars.",
      "Compare starting wages and hourly pay across years.",
      "Estimate how much purchasing power an hourly rate gained or lost.",
    ],
    faq: [
      {
        question: "How do I calculate minimum wage inflation?",
        answer:
          "Enter the hourly wage, choose the year it applied, and select the comparison year. Fiat Watch converts it with CPI-U.",
      },
      {
        question: "Does this compare federal or state minimum wages?",
        answer:
          "It compares the dollar amount you enter. You can use federal, state, local, or employer-specific hourly wages.",
      },
      {
        question: "Can I convert hourly pay to annual pay here?",
        answer:
          "This calculator compares the hourly dollar amount itself. To compare annual pay, enter the annual salary on the main calculator.",
      },
    ],
  },
]

export const calculatorBySlug = (slug: string) => CALCULATORS.find((c) => c.slug === slug) ?? null

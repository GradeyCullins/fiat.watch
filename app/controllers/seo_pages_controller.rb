class SeoPagesController < ApplicationController
  PAGES = {
    "salary" => {
      path: "/salary-inflation-calculator",
      title: "Salary Inflation Calculator With CPI Data | Fiat Watch",
      heading: "Salary inflation calculator",
      description: "Compare a salary from one year to another using official BLS CPI data. See what old paychecks, raises, and job offers are worth in today's dollars.",
      intro: "A raise can look bigger on paper than it feels in real life. Use Fiat Watch to compare salaries across years and see whether compensation kept up with inflation.",
      examples: [ "$45,000 in 2000", "$80,000 in 2015", "$100,000 in 1990" ],
      use_cases: [
        "Compare an old offer letter with a current salary.",
        "Check whether a raise or promotion beat inflation.",
        "Translate annual pay or hourly wages into another year's dollars."
      ],
      faq: [
        {
          question: "How do I calculate salary inflation?",
          answer: "Enter the salary amount, the year it was paid, and the comparison year. Fiat Watch converts the amount using the CPI-U ratio between those years."
        },
        {
          question: "Can this show whether my raise beat inflation?",
          answer: "Yes. Compare your old salary to the year of your new salary, then compare the result with your actual pay."
        },
        {
          question: "Does this work for hourly wages?",
          answer: "Yes. Enter the hourly rate as the amount and compare it across years the same way you would compare an annual salary."
        }
      ]
    },
    "rent" => {
      path: "/rent-inflation-calculator",
      title: "Rent Inflation Calculator With CPI Data | Fiat Watch",
      heading: "Rent inflation calculator",
      description: "Compare rent prices across years with official BLS CPI data. Convert old monthly rent into today's purchasing power.",
      intro: "Rent is one of the clearest ways inflation shows up in everyday budgets. Compare an old lease, apartment listing, or housing cost against another year.",
      examples: [ "$750 in 1998", "$1,200 in 2010", "$350 in 1985" ],
      use_cases: [
        "Convert an old monthly rent into today's dollars.",
        "Compare apartment listings or lease renewals across years.",
        "Put past housing costs in context before comparing budgets."
      ],
      faq: [
        {
          question: "How do I compare rent prices across years?",
          answer: "Enter the monthly rent amount, the lease year, and the year you want to compare against. The calculator adjusts the rent with CPI-U."
        },
        {
          question: "Is this the same as local rent inflation?",
          answer: "No. CPI-U is a national consumer price measure, so it is best for broad purchasing-power comparisons rather than city-specific rent indexes."
        },
        {
          question: "Can I use this for mortgage or housing costs?",
          answer: "You can use it to compare a dollar amount across years, but it does not model interest rates, taxes, insurance, or local home prices."
        }
      ]
    },
    "groceries" => {
      path: "/grocery-inflation-calculator",
      title: "Grocery Inflation Calculator With CPI Data | Fiat Watch",
      heading: "Grocery inflation calculator",
      description: "Compare grocery spending across years with official BLS CPI data. Estimate what past food budgets mean in today's dollars.",
      intro: "Grocery budgets make inflation tangible. Convert an old weekly or monthly grocery bill into another year's dollars using the same CPI engine as the main calculator.",
      examples: [ "$50 in 1995", "$125 in 2008", "$300 in 2020" ],
      cost_items: [ "eggs", "bread", "milk", "ground-beef" ],
      use_cases: [
        "Compare weekly or monthly grocery spending across years.",
        "Translate old food budgets into today's dollars.",
        "Put historical food costs in context with current household spending."
      ],
      faq: [
        {
          question: "How do I calculate grocery inflation?",
          answer: "Enter a grocery bill or food budget, choose the original year, and pick the comparison year. Fiat Watch adjusts the amount with CPI-U."
        },
        {
          question: "Does this use a food-only CPI series?",
          answer: "No. This page uses the same all-items CPI-U engine as the main calculator for broad purchasing-power comparisons."
        },
        {
          question: "Can I compare specific grocery items?",
          answer: "For some items, Fiat Watch also has BLS average-price pages for gas, eggs, bread, milk, and ground beef."
        }
      ]
    },
    "gas" => {
      path: "/gas-inflation-calculator",
      title: "Gas Inflation Calculator With CPI Data | Fiat Watch",
      heading: "Gas inflation calculator",
      description: "Compare gas prices across years with official BLS CPI data. Convert old fuel costs into today's dollars.",
      intro: "Gas prices are one of the easiest ways to feel inflation. Convert an old fill-up, gallon price, or fuel budget into another year's dollars.",
      examples: [ "$1.25 in 1980", "$1.51 in 2000", "$2.17 in 2020" ],
      cost_items: [ "gas" ],
      use_cases: [
        "Compare a historical gas price per gallon with today's dollars.",
        "Convert an old fill-up or monthly fuel budget across years.",
        "Separate general inflation from the sticker shock of gasoline prices."
      ],
      faq: [
        {
          question: "How do I calculate gas price inflation?",
          answer: "Enter the gas price or fuel spend, choose the original year, and pick the target year. The result shows the CPI-U adjusted value."
        },
        {
          question: "Is this a gasoline-only inflation index?",
          answer: "No. This calculator uses all-items CPI-U. For actual BLS average gas prices, use Fiat Watch's historical gas cost pages."
        },
        {
          question: "Can I compare a full tank instead of a gallon price?",
          answer: "Yes. Enter the total fill-up cost as the amount and compare it between years."
        }
      ]
    },
    "car_prices" => {
      path: "/car-price-inflation-calculator",
      title: "Car Price Inflation Calculator With CPI Data | Fiat Watch",
      heading: "Car price inflation calculator",
      description: "Compare car prices across years with official BLS CPI data. Convert old vehicle prices into today's dollars.",
      intro: "Sticker prices can be hard to compare across decades. Convert an old car price, loan amount, or down payment into another year's purchasing power.",
      examples: [ "$8,000 in 1985", "$18,000 in 2000", "$35,000 in 2020" ],
      use_cases: [
        "Convert an old vehicle sticker price into today's dollars.",
        "Compare car down payments, loan amounts, or repair bills across years.",
        "Put classic car ads or old purchase prices into inflation-adjusted context."
      ],
      faq: [
        {
          question: "How do I compare car prices across years?",
          answer: "Enter the vehicle price, the purchase year, and the comparison year. Fiat Watch adjusts the amount using CPI-U."
        },
        {
          question: "Does this account for new-car features or financing?",
          answer: "No. It compares purchasing power only and does not adjust for quality changes, interest rates, taxes, incentives, or dealer fees."
        },
        {
          question: "Can I use it for used cars?",
          answer: "Yes. Any dollar amount can be compared across years, including used-car prices and private-sale listings."
        }
      ]
    },
    "college_tuition" => {
      path: "/college-tuition-inflation-calculator",
      title: "College Tuition Inflation Calculator With CPI Data | Fiat Watch",
      heading: "College tuition inflation calculator",
      description: "Compare college tuition and education costs across years with official BLS CPI data.",
      intro: "Tuition numbers move fast, and old prices can sound unreal. Convert tuition, fees, or student budgets into another year's dollars.",
      examples: [ "$2,500 in 1980", "$10,000 in 2000", "$25,000 in 2015" ],
      use_cases: [
        "Convert old tuition bills into today's dollars.",
        "Compare student budgets, fees, or semester costs across years.",
        "Put historical college prices in context before comparing school costs."
      ],
      faq: [
        {
          question: "How do I calculate tuition inflation?",
          answer: "Enter a tuition amount, choose the year it was charged, and pick the comparison year. The calculator adjusts the amount with CPI-U."
        },
        {
          question: "Is this a college-specific price index?",
          answer: "No. It uses all-items CPI-U for general purchasing power, not a dedicated education or tuition index."
        },
        {
          question: "Can I include fees, room, and board?",
          answer: "Yes. Enter the total dollar amount you want to compare, whether that is tuition only or a broader student budget."
        }
      ]
    },
    "minimum_wage" => {
      path: "/minimum-wage-inflation-calculator",
      title: "Minimum Wage Inflation Calculator With CPI Data | Fiat Watch",
      heading: "Minimum wage inflation calculator",
      description: "See what an old hourly wage is worth today using official BLS CPI data.",
      intro: "Hourly pay only tells part of the story. Convert an old minimum wage, starting wage, or hourly rate into today's purchasing power.",
      examples: [ "$3.35 in 1985", "$5.15 in 2000", "$7.25 in 2010" ],
      use_cases: [
        "Convert an old minimum wage into today's dollars.",
        "Compare starting wages and hourly pay across years.",
        "Estimate how much purchasing power an hourly rate gained or lost."
      ],
      faq: [
        {
          question: "How do I calculate minimum wage inflation?",
          answer: "Enter the hourly wage, choose the year it applied, and select the comparison year. Fiat Watch converts it with CPI-U."
        },
        {
          question: "Does this compare federal or state minimum wages?",
          answer: "It compares the dollar amount you enter. You can use federal, state, local, or employer-specific hourly wages."
        },
        {
          question: "Can I convert hourly pay to annual pay here?",
          answer: "This calculator compares the hourly dollar amount itself. To compare annual pay, enter the annual salary amount on the main calculator."
        }
      ]
    }
  }.freeze

  def show
    @page = PAGES.fetch(params[:page])
    @historical_price_items = @page.fetch(:cost_items, []).map { |slug| AveragePriceCatalog.find(slug) }
    @page_title = @page.fetch(:title)
    @meta_description = @page.fetch(:description)
    @canonical_path = @page.fetch(:path)
  end
end

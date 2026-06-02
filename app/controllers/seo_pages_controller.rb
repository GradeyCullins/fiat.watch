class SeoPagesController < ApplicationController
  PAGES = {
    "salary" => {
      path: "/salary-inflation-calculator",
      title: "Salary Inflation Calculator With CPI Data | Fiat Watch",
      heading: "Salary inflation calculator",
      description: "Compare a salary from one year to another using official BLS CPI data. See what old paychecks, raises, and job offers are worth in today's dollars.",
      intro: "A raise can look bigger on paper than it feels in real life. Use Fiat Watch to compare salaries across years and see whether compensation kept up with inflation.",
      examples: [ "$45,000 in 2000", "$80,000 in 2015", "$100,000 in 1990" ]
    },
    "rent" => {
      path: "/rent-inflation-calculator",
      title: "Rent Inflation Calculator With CPI Data | Fiat Watch",
      heading: "Rent inflation calculator",
      description: "Compare rent prices across years with official BLS CPI data. Convert old monthly rent into today's purchasing power.",
      intro: "Rent is one of the clearest ways inflation shows up in everyday budgets. Compare an old lease, apartment listing, or housing cost against another year.",
      examples: [ "$750 in 1998", "$1,200 in 2010", "$350 in 1985" ]
    },
    "groceries" => {
      path: "/grocery-inflation-calculator",
      title: "Grocery Inflation Calculator With CPI Data | Fiat Watch",
      heading: "Grocery inflation calculator",
      description: "Compare grocery spending across years with official BLS CPI data. Estimate what past food budgets mean in today's dollars.",
      intro: "Grocery budgets make inflation tangible. Convert an old weekly or monthly grocery bill into another year's dollars using the same CPI engine as the main calculator.",
      examples: [ "$50 in 1995", "$125 in 2008", "$300 in 2020" ]
    },
    "gas" => {
      path: "/gas-inflation-calculator",
      title: "Gas Inflation Calculator With CPI Data | Fiat Watch",
      heading: "Gas inflation calculator",
      description: "Compare gas prices across years with official BLS CPI data. Convert old fuel costs into today's dollars.",
      intro: "Gas prices are one of the easiest ways to feel inflation. Convert an old fill-up, gallon price, or fuel budget into another year's dollars.",
      examples: [ "$1.25 in 1980", "$1.51 in 2000", "$2.17 in 2020" ]
    },
    "car_prices" => {
      path: "/car-price-inflation-calculator",
      title: "Car Price Inflation Calculator With CPI Data | Fiat Watch",
      heading: "Car price inflation calculator",
      description: "Compare car prices across years with official BLS CPI data. Convert old vehicle prices into today's dollars.",
      intro: "Sticker prices can be hard to compare across decades. Convert an old car price, loan amount, or down payment into another year's purchasing power.",
      examples: [ "$8,000 in 1985", "$18,000 in 2000", "$35,000 in 2020" ]
    },
    "college_tuition" => {
      path: "/college-tuition-inflation-calculator",
      title: "College Tuition Inflation Calculator With CPI Data | Fiat Watch",
      heading: "College tuition inflation calculator",
      description: "Compare college tuition and education costs across years with official BLS CPI data.",
      intro: "Tuition numbers move fast, and old prices can sound unreal. Convert tuition, fees, or student budgets into another year's dollars.",
      examples: [ "$2,500 in 1980", "$10,000 in 2000", "$25,000 in 2015" ]
    },
    "minimum_wage" => {
      path: "/minimum-wage-inflation-calculator",
      title: "Minimum Wage Inflation Calculator With CPI Data | Fiat Watch",
      heading: "Minimum wage inflation calculator",
      description: "See what an old hourly wage is worth today using official BLS CPI data.",
      intro: "Hourly pay only tells part of the story. Convert an old minimum wage, starting wage, or hourly rate into today's purchasing power.",
      examples: [ "$3.35 in 1985", "$5.15 in 2000", "$7.25 in 2010" ]
    }
  }.freeze

  def show
    @page = PAGES.fetch(params[:page])
    @page_title = @page.fetch(:title)
    @meta_description = @page.fetch(:description)
    @canonical_path = @page.fetch(:path)
  end
end

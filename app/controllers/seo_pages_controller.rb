class SeoPagesController < ApplicationController
  PAGES = {
    "salary" => {
      path: "/salary-inflation-calculator",
      title: "Salary Inflation Calculator | Cooked Fiat",
      heading: "Salary inflation calculator",
      description: "Compare a salary from one year to another using official BLS CPI data. See what old paychecks, raises, and job offers are worth in today's dollars.",
      intro: "A raise can look bigger on paper than it feels in real life. Use Cooked Fiat to compare salaries across years and see whether compensation kept up with inflation.",
      examples: [ "$45,000 in 2000", "$80,000 in 2015", "$100,000 in 1990" ]
    },
    "rent" => {
      path: "/rent-inflation-calculator",
      title: "Rent Inflation Calculator | Cooked Fiat",
      heading: "Rent inflation calculator",
      description: "Compare rent prices across years with official BLS CPI data. Convert old monthly rent into today's purchasing power.",
      intro: "Rent is one of the clearest ways inflation shows up in everyday budgets. Compare an old lease, apartment listing, or housing cost against another year.",
      examples: [ "$750 in 1998", "$1,200 in 2010", "$350 in 1985" ]
    },
    "groceries" => {
      path: "/grocery-inflation-calculator",
      title: "Grocery Inflation Calculator | Cooked Fiat",
      heading: "Grocery inflation calculator",
      description: "Compare grocery spending across years with official BLS CPI data. Estimate what past food budgets mean in today's dollars.",
      intro: "Grocery budgets make inflation tangible. Convert an old weekly or monthly grocery bill into another year's dollars using the same CPI engine as the main calculator.",
      examples: [ "$50 in 1995", "$125 in 2008", "$300 in 2020" ]
    }
  }.freeze

  def show
    @page = PAGES.fetch(params[:page])
    @page_title = @page.fetch(:title)
    @meta_description = @page.fetch(:description)
    @canonical_path = @page.fetch(:path)
  end
end

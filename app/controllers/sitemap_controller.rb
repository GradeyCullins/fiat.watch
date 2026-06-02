class SitemapController < ApplicationController
  HIGHLIGHT_AMOUNTS = [ 1, 10, 100, 1_000, 10_000, 100_000, 1_000_000 ].freeze
  HIGHLIGHT_FROM_YEARS = [ 1920, 1950, 1970, 1980, 1990, 2000, 2010, 2020 ].freeze
  CALCULATOR_PAGES = [
    [ "Salary inflation calculator", :salary_inflation_calculator_path ],
    [ "Rent inflation calculator", :rent_inflation_calculator_path ],
    [ "Grocery inflation calculator", :grocery_inflation_calculator_path ],
    [ "Gas inflation calculator", :gas_inflation_calculator_path ],
    [ "Car price inflation calculator", :car_price_inflation_calculator_path ],
    [ "College tuition inflation calculator", :college_tuition_inflation_calculator_path ],
    [ "Minimum wage inflation calculator", :minimum_wage_inflation_calculator_path ]
  ].freeze

  def index
    @latest_year = CpiCalculator.latest_year
    @entries = build_entries
    render formats: :xml
  end

  def show
    @page_title = "Sitemap | Fiat Watch"
    @meta_description = "Browse Fiat Watch inflation calculators and historical cost pages."
    @canonical_path = html_sitemap_path
    @calculator_pages = CALCULATOR_PAGES.map { |label, route| [ label, public_send(route) ] }
    @cost_pages = AveragePriceCatalog.entries.group_by(&:first)
  end

  private

  def build_entries
    entries = [
      { loc: root_url, priority: 1.0 },
      { loc: salary_inflation_calculator_url, priority: 0.8 },
      { loc: rent_inflation_calculator_url, priority: 0.8 },
      { loc: grocery_inflation_calculator_url, priority: 0.8 },
      { loc: gas_inflation_calculator_url, priority: 0.8 },
      { loc: car_price_inflation_calculator_url, priority: 0.8 },
      { loc: college_tuition_inflation_calculator_url, priority: 0.8 },
      { loc: minimum_wage_inflation_calculator_url, priority: 0.8 }
    ]
    AveragePriceCatalog.entries.each do |item, year, _price|
      entries << {
        loc: cost_page_url(item.slug, year),
        priority: 0.8
      }
    end
    HIGHLIGHT_FROM_YEARS.each do |from_year|
      HIGHLIGHT_AMOUNTS.each do |amount|
        entries << {
          loc: calculation_url(amount: amount, from_year: from_year, to_year: @latest_year),
          priority: 0.7
        }
      end
    end
    entries
  end
end

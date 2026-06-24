module ApplicationHelper
  DEFAULT_PAGE_TITLE = "US Inflation Calculator With CPI Data | Fiat Watch".freeze
  DEFAULT_META_DESCRIPTION = "Calculate what any US dollar amount was really worth in any year using official Bureau of Labor Statistics CPI data.".freeze
  DEFAULT_OG_IMAGE_PATH = "/opengraph-card.png".freeze
  DEFAULT_OG_IMAGE_ALT = "Fiat Watch inflation calculator social preview card".freeze
  CALCULATOR_PAGE_LINKS = [
    [ "Salary inflation calculator", :salary_inflation_calculator_path ],
    [ "Rent inflation calculator", :rent_inflation_calculator_path ],
    [ "Grocery inflation calculator", :grocery_inflation_calculator_path ],
    [ "Gas inflation calculator", :gas_inflation_calculator_path ],
    [ "Car price inflation calculator", :car_price_inflation_calculator_path ],
    [ "College tuition inflation calculator", :college_tuition_inflation_calculator_path ],
    [ "Minimum wage inflation calculator", :minimum_wage_inflation_calculator_path ]
  ].freeze

  def page_title
    @page_title.presence || DEFAULT_PAGE_TITLE
  end

  def meta_description
    @meta_description.presence || DEFAULT_META_DESCRIPTION
  end

  def canonical_url
    request.base_url + (@canonical_path.presence || request.path)
  end

  def og_image_url
    request.base_url + DEFAULT_OG_IMAGE_PATH
  end

  def og_image_alt
    DEFAULT_OG_IMAGE_ALT
  end

  def calculator_page_links
    CALCULATOR_PAGE_LINKS.map { |label, route| [ label, public_send(route) ] }
  end
end

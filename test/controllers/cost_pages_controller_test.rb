require "test_helper"

class CostPagesControllerTest < ActionDispatch::IntegrationTest
  test "gas cost page renders historical price and adjusted value" do
    get cost_page_path("gas", 1980)

    assert_response :success
    assert_select "title", "How Much Did Gas Cost in 1980? | Fiat Watch"
    assert_select "meta[name=?][content*=?]", "description", "Gas cost $1.25 per gallon in 1980"
    assert_select "link[rel=?][href$=?]", "canonical", cost_page_path("gas", 1980)
    assert_select "h1", "How much did gas cost in 1980?"
    assert_select "p", /Gas averaged \$1\.25 per gallon in 1980/
    assert_select "a[href*=?]", calculation_path
    assert_select "a[href=?]", cost_item_path("gas"), text: "Historical gas prices"
    assert_select "a[href=?]", cost_page_path("gas", 1981), text: "Gas prices in 1981"
    assert_select "a[href=?]", cost_page_path("eggs", 1980)
    assert_select "a[href=?]", cost_page_path("bread", 1980)
    assert_select "a[href=?]", gas_inflation_calculator_path, text: "Gas inflation calculator"
    assert_select "p", /APU000074714/
  end

  test "ground beef page uses configured slug and source data" do
    get cost_page_path("ground-beef", 2020)

    assert_response :success
    assert_select "title", "How Much Did Ground Beef Cost in 2020? | Fiat Watch"
    assert_select "h1", "How much did ground beef cost in 2020?"
    assert_select "p", /Ground beef averaged \$4\.12 per pound in 2020/
    assert_select "p", /APU0000703112/
  end

  test "cost item hub links to all available year pages" do
    get cost_item_path("gas")

    assert_response :success
    assert_select "title", "Historical Gas Prices by Year | Fiat Watch"
    assert_select "link[rel=?][href$=?]", "canonical", cost_item_path("gas")
    assert_select "h1", "Historical gas prices by year"
    assert_select "a[href=?]", cost_page_path("gas", 1980), text: /Gas in 1980/
    assert_select "a[href=?]", cost_page_path("gas", 2025), text: /Gas in 2025/
    assert_select "a[href=?]", cost_item_path("eggs"), text: "Historical egg prices"
    assert_select "a[href=?]", gas_inflation_calculator_path, text: "Gas inflation calculator"
  end

  test "unknown cost item hub returns not found" do
    get cost_item_path("coffee")

    assert_response :not_found
  end

  test "unknown cost page returns not found" do
    get cost_page_path("milk", 1980)

    assert_response :not_found
  end

  test "gas month page renders historical price and adjusted value" do
    get cost_month_page_path("gas", 2015, "03")

    assert_response :success
    assert_select "title", "How Much Did Gas Cost in March 2015? | Fiat Watch"
    assert_select "link[rel=?][href$=?]", "canonical", cost_month_page_path("gas", 2015, "03")
    assert_select "h1", "How much did gas cost in March 2015?"
    assert_select "p", /Gas averaged \$2\.48 per gallon in March 2015/
    assert_select "a[href=?]", cost_page_path("gas", 2015), text: "Gas prices in 2015"
    assert_select "a[href=?]", cost_item_path("gas"), text: "Historical gas prices"
    assert_select "a[href=?]", cost_month_page_path("gas", 2015, "02"), text: "Gas prices in February 2015"
    assert_select "a[href=?]", cost_month_page_path("gas", 2015, "04"), text: "Gas prices in April 2015"
    assert_select "a[href=?]", cost_month_page_path("eggs", 2015, "03")
    assert_select "a[href=?]", gas_inflation_calculator_path, text: "Gas inflation calculator"
  end

  test "gas year page links to its monthly price pages" do
    get cost_page_path("gas", 2015)

    assert_response :success
    assert_select "a[href=?]", cost_month_page_path("gas", 2015, "01"), text: /January 2015/
    assert_select "a[href=?]", cost_month_page_path("gas", 2015, "12"), text: /December 2015/
  end

  test "unknown cost month page returns not found" do
    get cost_month_page_path("gas", 2015, "13")

    assert_response :not_found
  end

  test "cost month page for a year outside item coverage returns not found" do
    get cost_month_page_path("milk", 1980, "01")

    assert_response :not_found
  end
end

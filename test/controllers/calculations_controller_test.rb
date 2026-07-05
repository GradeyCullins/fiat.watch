require "test_helper"

class CalculationsControllerTest < ActionDispatch::IntegrationTest
  test "root page renders shortened social metadata" do
    get root_path

    assert_response :success
    assert_select "title", "US Inflation Calculator With CPI Data | Fiat Watch"
    assert_select "meta[property=?][content=?]", "og:title", "US Inflation Calculator With CPI Data | Fiat Watch"
    assert_select "meta[property=?][content$=?]", "og:url", "/"
    assert_select "meta[property=?][content$=?]", "og:image", "/opengraph-card.png"
    assert_select "meta[name=?][content$=?]", "twitter:image", "/opengraph-card.png"
    assert_select "h1", /US inflation\s+calculator/
    [
      salary_inflation_calculator_path,
      rent_inflation_calculator_path,
      grocery_inflation_calculator_path,
      gas_inflation_calculator_path,
      car_price_inflation_calculator_path,
      college_tuition_inflation_calculator_path,
      minimum_wage_inflation_calculator_path
    ].each do |path|
      assert_select "a[href=?]", path
    end
    [
      cost_item_path("gas"),
      cost_item_path("eggs"),
      cost_item_path("bread"),
      cost_item_path("milk"),
      cost_item_path("ground-beef")
    ].each do |path|
      assert_select "a[href=?]", path
    end
  end

  test "successful calculation renders analytics event data and sponsor slot" do
    get calculation_path, params: { amount: "100", from_year: "2000", to_year: CpiCalculator.latest_year }

    assert_response :success
    assert_select "meta[property=?][content=?]", "og:title", "CPI Inflation Calculator: 2000 to #{CpiCalculator.latest_year} | Fiat Watch"
    assert_select "meta[property=?][content*=?]", "og:description", "same purchasing power"
    assert_select "[data-analytics-event-name-value=?]", "calculation_completed"
    assert_select "[data-analytics-params-value*=?]", '"amount":100.0'
    assert_select "[data-analytics-params-value*=?]", '"from_year":2000'
    assert_select "[data-analytics-params-value*=?]", '"to_year":' + CpiCalculator.latest_year.to_s
    assert_select "aside[aria-label=?]", "Advertising" do
      assert_select "p", text: "Your ad here"
      assert_select "a[href^=?]", "mailto:ads@fiat.watch"
    end
  end

  test "invalid calculation does not render success analytics or sponsor slot" do
    get calculation_path, params: { amount: "-1", from_year: "2000", to_year: CpiCalculator.latest_year }

    assert_response :success
    assert_select "[role=?]", "alert"
    assert_select "[data-analytics-event-name-value=?]", "calculation_completed", count: 0
    assert_select "aside[aria-label=?]", "Advertising", count: 0
  end
end

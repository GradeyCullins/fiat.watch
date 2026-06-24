require "test_helper"

class SeoPagesControllerTest < ActionDispatch::IntegrationTest
  test "salary inflation page renders unique metadata and calculator cta" do
    get salary_inflation_calculator_path

    assert_response :success
    assert_select "title", "Salary Inflation Calculator With CPI Data | Fiat Watch"
    assert_select "meta[name=?][content*=?]", "description", "Compare a salary"
    assert_select "link[rel=?][href$=?]", "canonical", salary_inflation_calculator_path
    assert_select "meta[property=?][content=?]", "og:title", "Salary Inflation Calculator With CPI Data | Fiat Watch"
    assert_select "meta[property=?][content*=?]", "og:description", "Compare a salary"
    assert_select "meta[property=?][content$=?]", "og:image", "/opengraph-card.png"
    assert_select "meta[property=?][content=?]", "og:image:width", "1200"
    assert_select "meta[name=?][content$=?]", "twitter:image", "/opengraph-card.png"
    assert_select "h1", "Salary inflation calculator"
    assert_select "a[href=?]", root_path(anchor: "calc-heading")
    assert_select "h2", "When to use this calculator"
    assert_select "li", "Check whether a raise or promotion beat inflation."
    assert_select "h2", "Frequently asked questions"
    assert_select "dt", "How do I calculate salary inflation?"
    assert_select "a[href=?]", rent_inflation_calculator_path
  end

  test "rent inflation page renders unique content" do
    get rent_inflation_calculator_path

    assert_response :success
    assert_select "title", "Rent Inflation Calculator With CPI Data | Fiat Watch"
    assert_select "h1", "Rent inflation calculator"
    assert_select "dt", "How do I compare rent prices across years?"
  end

  test "grocery inflation page renders unique content" do
    get grocery_inflation_calculator_path

    assert_response :success
    assert_select "title", "Grocery Inflation Calculator With CPI Data | Fiat Watch"
    assert_select "h1", "Grocery inflation calculator"
    assert_select "dt", "How do I calculate grocery inflation?"
  end

  test "new calculator intent pages render expanded content" do
    get gas_inflation_calculator_path

    assert_response :success
    assert_select "title", "Gas Inflation Calculator With CPI Data | Fiat Watch"
    assert_select "h1", "Gas inflation calculator"
    assert_select "a[href=?]", root_path(anchor: "calc-heading")
    assert_select "dt", "How do I calculate gas price inflation?"

    get car_price_inflation_calculator_path
    assert_response :success
    assert_select "h1", "Car price inflation calculator"
    assert_select "dt", "How do I compare car prices across years?"

    get college_tuition_inflation_calculator_path
    assert_response :success
    assert_select "h1", "College tuition inflation calculator"
    assert_select "dt", "How do I calculate tuition inflation?"

    get minimum_wage_inflation_calculator_path
    assert_response :success
    assert_select "h1", "Minimum wage inflation calculator"
    assert_select "dt", "How do I calculate minimum wage inflation?"
  end
end

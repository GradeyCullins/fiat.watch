require "test_helper"

class SitemapControllerTest < ActionDispatch::IntegrationTest
  test "sitemap includes monetization seo pages" do
    get sitemap_path

    assert_response :success
    assert_includes response.body, salary_inflation_calculator_url
    assert_includes response.body, rent_inflation_calculator_url
    assert_includes response.body, grocery_inflation_calculator_url
    assert_includes response.body, gas_inflation_calculator_url
    assert_includes response.body, car_price_inflation_calculator_url
    assert_includes response.body, college_tuition_inflation_calculator_url
    assert_includes response.body, minimum_wage_inflation_calculator_url
    assert_includes response.body, cost_page_url("gas", 1980)
    assert_includes response.body, cost_page_url("ground-beef", 2020)
  end

  test "html sitemap lists calculator and cost pages" do
    get html_sitemap_path

    assert_response :success
    assert_select "title", "Sitemap | Fiat Watch"
    assert_select "h1", "Fiat Watch sitemap"
    assert_select "a[href=?]", root_path, text: "US inflation calculator"
    assert_select "a[href=?]", gas_inflation_calculator_path, text: "Gas inflation calculator"
    assert_select "a[href=?]", cost_page_path("gas", 1980), text: "1980"
    assert_select "a[href=?]", cost_page_path("ground-beef", 2020), text: "2020"
    assert_select "a[href=?]", sitemap_path, text: "sitemap.xml"
  end
end

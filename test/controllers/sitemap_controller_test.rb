require "test_helper"

class SitemapControllerTest < ActionDispatch::IntegrationTest
  test "sitemap includes monetization seo pages" do
    get sitemap_path(format: :xml)

    assert_response :success
    assert_includes response.body, salary_inflation_calculator_url
    assert_includes response.body, rent_inflation_calculator_url
    assert_includes response.body, grocery_inflation_calculator_url
  end
end

require "test_helper"

class CostPagesControllerTest < ActionDispatch::IntegrationTest
  test "gas cost page renders historical price and adjusted value" do
    get cost_page_path("gas", 1980)

    assert_response :success
    assert_select "title", "How Much Did Gas Cost in 1980? | Cooked Fiat"
    assert_select "meta[name=?][content*=?]", "description", "Gas cost $1.25 per gallon in 1980"
    assert_select "link[rel=?][href$=?]", "canonical", cost_page_path("gas", 1980)
    assert_select "h1", "How much did gas cost in 1980?"
    assert_select "p", /Gas averaged \$1\.25 per gallon in 1980/
    assert_select "a[href*=?]", calculation_path
    assert_select "p", /APU000074714/
  end

  test "ground beef page uses configured slug and source data" do
    get cost_page_path("ground-beef", 2020)

    assert_response :success
    assert_select "title", "How Much Did Ground Beef Cost in 2020? | Cooked Fiat"
    assert_select "h1", "How much did ground beef cost in 2020?"
    assert_select "p", /Ground beef averaged \$4\.12 per pound in 2020/
    assert_select "p", /APU0000703112/
  end

  test "unknown cost page returns not found" do
    get cost_page_path("milk", 1980)

    assert_response :not_found
  end
end

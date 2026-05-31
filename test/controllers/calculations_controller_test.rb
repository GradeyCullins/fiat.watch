require "test_helper"

class CalculationsControllerTest < ActionDispatch::IntegrationTest
  test "successful calculation renders analytics event data and sponsor slot" do
    get calculation_path, params: { amount: "100", from_year: "2000", to_year: CpiCalculator.latest_year }

    assert_response :success
    assert_select "[data-analytics-event-name-value=?]", "calculation_completed"
    assert_select "[data-analytics-params-value*=?]", '"amount":100.0'
    assert_select "[data-analytics-params-value*=?]", '"from_year":2000'
    assert_select "[data-analytics-params-value*=?]", '"to_year":' + CpiCalculator.latest_year.to_s
    assert_select "aside[aria-label=?]", "Advertising" do
      assert_select "p", text: "Your ad here"
      assert_select "a[href^=?]", "mailto:ads@cookedfiat.com"
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

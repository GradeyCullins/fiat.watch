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
    assert_select "section[aria-labelledby=?]", "news-feed-heading" do
      assert_select "h2", text: "The money wire"
      assert_select "p", text: "The wire is warming up."
    end
  end

  test "root page renders the newest news articles" do
    older = create_news_article(
      headline: "Older inflation report",
      url: "https://example.com/older",
      published_at: 2.days.ago,
      topics: [ "inflation" ]
    )
    newer = create_news_article(
      headline: "Dollar moves after central bank decision",
      url: "https://example.com/newer",
      published_at: 1.hour.ago,
      topics: [ "us_dollar", "monetary_policy" ]
    )

    get root_path

    assert_response :success
    assert_select "section[aria-labelledby=?]", "news-feed-heading" do
      assert_select "li", count: 2
      assert_select "li:first-child a[href=?][target=?][rel*=?]", newer.canonical_url, "_blank", "noopener"
      assert_select "li:first-child h3", text: newer.headline
      assert_select "li:last-child h3", text: older.headline
      assert_select "time[datetime=?]", newer.published_at.iso8601
      assert_select "span", text: "Us dollar"
    end
  end

  test "root page limits the news feed to nine articles" do
    10.times do |index|
      create_news_article(
        headline: "Wire item #{index}",
        url: "https://example.com/wire-#{index}",
        published_at: index.hours.ago,
        topics: [ "forex" ]
      )
    end

    get root_path

    assert_select "section[aria-labelledby=?]", "news-feed-heading" do
      assert_select "li", count: 9
      assert_select "h3", text: "Wire item 0"
      assert_select "h3", text: "Wire item 9", count: 0
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

  private

  def create_news_article(headline:, url:, published_at:, topics:)
    NewsArticle.create!(
      provider: "test_wire",
      provider_identifier: url,
      canonical_url: url,
      headline: headline,
      publisher: "Test Wire",
      summary: "A concise market update.",
      language: "en",
      topics: topics,
      published_at: published_at,
      fetched_at: Time.current
    )
  end
end

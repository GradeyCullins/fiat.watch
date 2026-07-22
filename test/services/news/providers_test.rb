require "test_helper"

class NewsProvidersTest < ActiveSupport::TestCase
  FakeResponse = News::HttpClient::Response
  NOOP_SLEEPER = Object.new.tap { |object| object.define_singleton_method(:sleep) { |_| } }

  class FakeHttpClient
    def initialize(body:, content_type: "application/rss+xml", status: 200)
      @response = FakeResponse.new(
        status: status,
        headers: { "content-type" => content_type },
        body: body,
        duration_ms: 12,
        url: "https://provider.example/feed?api_key=secret"
      )
    end

    def get(*)
      @response
    end
  end

  PROVIDERS = {
    "bls.rss" => News::Providers::BlsFeed,
    "federal_reserve.rss" => News::Providers::FederalReserveFeed,
    "ecb.rss" => News::Providers::EcbFeed
  }.freeze

  test "RSS providers parse sanitized live-shaped fixtures" do
    PROVIDERS.each do |fixture, provider|
      result = provider.call(http_client: fake_client(fixture))

      assert result.success?, "#{provider} failed: #{result.error&.message}"
      assert_equal 1, result.value.size
      assert result.value.first.published_at
      assert_equal "https://provider.example/feed", result.metadata[:endpoint]
    end
  end

  test "GDELT parses JSON and normalizes tracking parameters" do
    result = News::Providers::GdeltFeed.call(
      http_client: fake_client("gdelt.json", content_type: "application/json")
    )

    assert result.success?
    article = result.value.first
    assert_equal "https://example.com/markets/dollar-outlook", article.canonical_url
    assert_includes article.topics, "inflation"
    assert_includes article.topics, "us_dollar"
  end

  test "provider maps upstream errors into failures" do
    result = News::Providers::BlsFeed.call(
      http_client: FakeHttpClient.new(body: "no", status: 503),
      sleeper: NOOP_SLEEPER
    )

    assert result.failure?
    assert_equal :provider_unavailable, result.error.code
  end

  test "provider rejects malformed payloads" do
    result = News::Providers::BlsFeed.call(http_client: FakeHttpClient.new(body: "not xml"))

    assert result.failure?
    assert_equal :invalid_payload, result.error.code
  end

  private

  def fake_client(name, content_type: "application/rss+xml")
    body = file_fixture("news_sources/#{name}").read
    FakeHttpClient.new(body: body, content_type: content_type)
  end
end

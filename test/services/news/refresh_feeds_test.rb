require "test_helper"

class NewsRefreshFeedsTest < ActiveSupport::TestCase
  class SuccessfulProvider < ApplicationService
    def initialize(http_client:)
    end

    def call
      candidate = News::ArticleCandidate.new(
        provider: "test", provider_identifier: "item-1", canonical_url: "https://example.com/item",
        headline: "Dollar inflation report", summary: nil, publisher: "Example", author: nil,
        language: "en", topics: %w[inflation us_dollar], published_at: Time.utc(2026, 7, 10)
      )
      ServiceResult.success([ candidate ], metadata: {
        provider: "test", endpoint: "https://example.com/feed", status: 200,
        content_type: "application/json", duration_ms: 5, item_count: 1
      })
    end
  end

  class FailedProvider < ApplicationService
    def initialize(http_client:)
    end

    def call
      ServiceResult.failure(code: :timeout, message: "timed out")
    end
  end

  test "refresh persists idempotently" do
    2.times do
      result = News::RefreshFeeds.call(sources: { "test" => SuccessfulProvider })
      assert result.success?
    end

    assert_equal 1, NewsArticle.where(provider: "test").count
  end

  test "one failed source does not prevent another source from running" do
    result = News::RefreshFeeds.call(
      sources: { "working" => SuccessfulProvider, "failed" => FailedProvider },
      persist: false
    )

    assert result.failure?
    assert_equal :source_failures, result.error.code
    assert result.metadata[:results]["working"].success?
    assert result.metadata[:results]["failed"].failure?
  end

  test "verification report limits samples and contains source evidence" do
    provider_result = SuccessfulProvider.call(http_client: nil)

    Dir.mktmpdir do |directory|
      result = News::VerificationReport.call(results: { "test" => provider_result }, artifact_dir: directory)
      report = JSON.parse(File.read(result.value[:json_path]))

      assert report["success"]
      assert_equal 200, report.dig("sources", 0, "http_status")
      assert_equal 1, report.dig("sources", 0, "samples").size
      refute_includes File.read(result.value[:json_path]), "api_key"
    end
  end
end

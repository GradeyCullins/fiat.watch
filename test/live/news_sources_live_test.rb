require "test_helper"

class NewsSourcesLiveTest < ActiveSupport::TestCase
  test "required news sources are reachable and return valid items" do
    skip "Set LIVE_FEED_TESTS=1 to contact external news providers" unless ENV["LIVE_FEED_TESTS"] == "1"

    result = News::RefreshFeeds.call(persist: false)
    results = result.success? ? result.value : result.metadata[:results]

    results.each do |name, source_result|
      assert source_result.success?, "#{name}: #{source_result.error&.message}"
      assert source_result.value.any?, "#{name}: no normalized articles"
    end
  end
end

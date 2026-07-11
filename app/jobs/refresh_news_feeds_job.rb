class RefreshNewsFeedsJob < ApplicationJob
  class RefreshError < StandardError; end

  queue_as :default
  retry_on RefreshError, wait: :polynomially_longer, attempts: 3

  def perform
    result = News::RefreshFeeds.call
    raise RefreshError, result.error.message if result.failure?
  end
end

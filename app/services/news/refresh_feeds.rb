module News
  class RefreshFeeds < ApplicationService
    def initialize(sources: SourceRegistry.enabled, http_client: HttpClient.new, persist: true)
      @sources = sources
      @http_client = http_client
      @persist = persist
    end

    def call
      results = @sources.transform_values do |provider_class|
        result = if @persist
          FetchSource.call(provider_class: provider_class, http_client: @http_client)
        else
          provider_class.call(http_client: @http_client)
        end
        log_result(result)
        result
      end

      failed = results.select { |_, result| result.failure? }
      if failed.any?
        failure(
          code: :source_failures,
          message: "#{failed.size} news source(s) failed",
          details: failed.transform_values { |result| result.error.to_h },
          metadata: { results: results }
        )
      else
        success(results, metadata: { source_count: results.size })
      end
    end

    private

    def log_result(result)
      payload = result.success? ? result.metadata : { error: result.error.to_h }
      Rails.logger.info({ event: "news_source_refresh", success: result.success?, **payload }.to_json)
    end
  end
end

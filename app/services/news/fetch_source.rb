module News
  class FetchSource < ApplicationService
    def initialize(provider_class:, http_client: HttpClient.new, now: Time.current)
      @provider_class = provider_class
      @http_client = http_client
      @now = now
    end

    def call
      provider_result = @provider_class.call(http_client: @http_client)
      return provider_result if provider_result.failure?

      counts = persist(provider_result.value)
      success(
        provider_result.value,
        metadata: provider_result.metadata.merge(counts).merge(fetched_at: @now.utc.iso8601)
      )
    rescue ActiveRecord::ActiveRecordError => error
      failure(code: :persistence_error, message: error.message)
    end

    private

    def persist(candidates)
      inserted = 0
      updated = 0

      candidates.each do |candidate|
        article = find_article(candidate)
        article.new_record? ? inserted += 1 : updated += 1
        article.assign_attributes(candidate.to_h.merge(fetched_at: @now))
        article.save!
      end

      { inserted_count: inserted, updated_count: updated }
    end

    def find_article(candidate)
      NewsArticle.find_by(canonical_url: candidate.canonical_url) ||
        if candidate.provider_identifier
          NewsArticle.find_or_initialize_by(provider: candidate.provider, provider_identifier: candidate.provider_identifier)
        else
          NewsArticle.find_or_initialize_by(canonical_url: candidate.canonical_url)
        end
    end
  end
end

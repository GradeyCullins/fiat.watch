module News
  module Providers
    class Base < ApplicationService
      class ProviderError < StandardError
        attr_reader :code, :details

        def initialize(code, message, details: nil)
          @code = code
          @details = details
          super(message)
        end
      end

      attr_reader :http_client

      def initialize(http_client: HttpClient.new, sleeper: Kernel)
        @http_client = http_client
        @sleeper = sleeper
      end

      def call
        response = fetch_with_retries

        articles = parse(response.body)
        success(articles, metadata: response_metadata(response, articles.size))
      rescue ProviderError => error
        failure(code: error.code, message: error.message, details: error.details)
      rescue Net::OpenTimeout, Net::ReadTimeout, Timeout::Error => error
        failure(code: :timeout, message: error.message)
      rescue SocketError, Errno::ECONNREFUSED, Errno::ECONNRESET => error
        failure(code: :connection_error, message: error.message)
      rescue RSS::Error, JSON::ParserError, ArgumentError => error
        failure(code: :invalid_payload, message: error.message)
      end

      def provider_name
        self.class.name.demodulize.delete_suffix("Feed").underscore
      end

      private

      def fetch_with_retries
        attempts = 0
        begin
          attempts += 1
          response = http_client.get(endpoint)
          raise_http_error(response) unless response.status.between?(200, 299)
          response
        rescue Net::OpenTimeout, Net::ReadTimeout, SocketError, Errno::ECONNREFUSED, Errno::ECONNRESET, ProviderError => error
          retryable = !error.is_a?(ProviderError) || %i[rate_limited provider_unavailable].include?(error.code)
          raise unless retryable && attempts < 3

          @sleeper.sleep(attempts)
          retry
        end
      end

      def response_metadata(response, item_count)
        {
          provider: provider_name,
          endpoint: sanitized_endpoint(response.url),
          status: response.status,
          content_type: response.headers["content-type"],
          duration_ms: response.duration_ms,
          item_count: item_count
        }
      end

      def sanitized_endpoint(url)
        uri = URI.parse(url)
        uri.query = nil
        uri.to_s
      end

      def raise_http_error(response)
        code = case response.status
        when 401, 403 then :authentication_error
        when 429 then :rate_limited
        when 500..599 then :provider_unavailable
        else :http_error
        end
        raise ProviderError.new(code, "Provider returned HTTP #{response.status}", details: { status: response.status })
      end

      def candidate(identifier:, url:, headline:, summary:, publisher:, author:, language:, published_at:)
        clean_headline = headline.to_s.strip
        clean_url = UrlNormalizer.call(url)
        raise ProviderError.new(:invalid_item, "Article is missing a headline or URL") if clean_headline.empty? || clean_url.empty?

        ArticleCandidate.new(
          provider: provider_name,
          provider_identifier: identifier.presence,
          canonical_url: clean_url,
          headline: clean_headline,
          summary: summary.to_s.strip.presence,
          publisher: publisher.to_s.strip.presence,
          author: author.to_s.strip.presence,
          language: language.to_s.strip.presence,
          topics: TopicClassifier.call(clean_headline, summary),
          published_at: published_at
        )
      end
    end
  end
end

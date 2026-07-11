require "rss"

module News
  module Providers
    class RssFeed < Base
      private

      def parse(body)
        feed = RSS::Parser.parse(body, false)
        raise ProviderError.new(:invalid_payload, "Feed has no items") unless feed.respond_to?(:items)

        feed.items.filter_map { |item| parse_item(item, feed) }
      end

      def parse_item(item, feed)
        url = item.respond_to?(:link) ? item.link&.to_s : nil
        title = item.respond_to?(:title) ? item.title&.to_s : nil
        return if url.blank? || title.blank?

        published_at = extract_time(item)
        return unless published_at

        candidate(
          identifier: extract_identifier(item),
          url: url,
          headline: title,
          summary: extract_summary(item),
          publisher: feed.respond_to?(:channel) ? feed.channel&.title&.to_s : feed.title&.to_s,
          author: item.respond_to?(:author) ? item.author&.to_s : nil,
          language: extract_language(feed),
          published_at: published_at
        )
      end

      def extract_identifier(item)
        if item.respond_to?(:guid) && item.guid
          item.guid.content.to_s
        elsif item.respond_to?(:id) && item.id
          item.id.content.to_s
        end
      end

      def extract_summary(item)
        value = if item.respond_to?(:description) && item.description
          item.description
        elsif item.respond_to?(:summary) && item.summary
          item.summary
        end
        ActionView::Base.full_sanitizer.sanitize(value.to_s).squish.presence
      end

      def extract_time(item)
        value = if item.respond_to?(:pubDate) && item.pubDate
          item.pubDate
        elsif item.respond_to?(:published) && item.published
          item.published.content
        elsif item.respond_to?(:updated) && item.updated
          item.updated.content
        end
        value&.to_time
      rescue ArgumentError
        nil
      end

      def extract_language(feed)
        feed.respond_to?(:channel) ? feed.channel&.language&.to_s : feed.lang&.to_s
      end
    end
  end
end

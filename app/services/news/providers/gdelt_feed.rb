require "json"

module News
  module Providers
    class GdeltFeed < Base
      ENDPOINT = "https://api.gdeltproject.org/api/v2/doc/doc"
      QUERY = '(inflation OR "consumer prices" OR forex OR "foreign exchange" OR "US dollar" OR DXY OR "monetary policy")'

      private

      def endpoint
        query = URI.encode_www_form(query: QUERY, mode: "artlist", maxrecords: 50, format: "json", sort: "datedesc")
        "#{ENDPOINT}?#{query}"
      end

      def parse(body)
        JSON.parse(body).fetch("articles", []).filter_map do |article|
          published_at = Time.strptime(article.fetch("seendate"), "%Y%m%dT%H%M%SZ")
          candidate(
            identifier: article["url"],
            url: article["url"],
            headline: article["title"],
            summary: nil,
            publisher: article["domain"],
            author: nil,
            language: article["language"],
            published_at: published_at
          )
        rescue KeyError, ArgumentError
          nil
        end
      end
    end
  end
end

module News
  module Providers
    class EcbFeed < RssFeed
      ENDPOINT = "https://www.ecb.europa.eu/rss/press.html"

      private

      def endpoint
        ENDPOINT
      end
    end
  end
end

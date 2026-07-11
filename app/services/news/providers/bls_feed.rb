module News
  module Providers
    class BlsFeed < RssFeed
      ENDPOINT = "https://www.bls.gov/feed/bls_latest.rss"

      private

      def endpoint
        ENDPOINT
      end
    end
  end
end

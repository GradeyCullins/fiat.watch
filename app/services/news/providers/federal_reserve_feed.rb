module News
  module Providers
    class FederalReserveFeed < RssFeed
      ENDPOINT = "https://www.federalreserve.gov/feeds/press_all.xml"

      private

      def endpoint
        ENDPOINT
      end
    end
  end
end

module News
  class SourceRegistry
    PROVIDERS = {
      "bls" => Providers::BlsFeed,
      "federal_reserve" => Providers::FederalReserveFeed,
      "ecb" => Providers::EcbFeed,
      "gdelt" => Providers::GdeltFeed
    }.freeze

    def self.enabled
      configured = Rails.application.config.x.news.enabled_providers
      PROVIDERS.slice(*configured)
    end
  end
end

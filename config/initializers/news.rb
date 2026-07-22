Rails.application.config.x.news.enabled_providers = ENV.fetch(
  "NEWS_PROVIDERS",
  "bls,federal_reserve,ecb,gdelt"
).split(",").map(&:strip)

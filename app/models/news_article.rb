class NewsArticle < ApplicationRecord
  serialize :topics, coder: JSON

  validates :provider, :canonical_url, :headline, :published_at, :fetched_at, presence: true
  validates :canonical_url, uniqueness: true
  validates :provider_identifier, uniqueness: { scope: :provider }, allow_nil: true

  scope :recent_first, -> { order(published_at: :desc) }
  scope :for_provider, ->(provider) { where(provider: provider) }
  scope :with_topic, ->(topic) { where("topics LIKE ?", "%\"#{sanitize_sql_like(topic)}\"%") }
end

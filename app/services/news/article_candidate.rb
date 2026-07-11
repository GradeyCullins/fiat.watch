module News
  ArticleCandidate = Data.define(
    :provider,
    :provider_identifier,
    :canonical_url,
    :headline,
    :summary,
    :publisher,
    :author,
    :language,
    :topics,
    :published_at
  )
end

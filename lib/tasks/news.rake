namespace :news do
  desc "Verify live news sources and write sanitized connectivity artifacts"
  task verify_sources: :environment do
    unless ENV["LIVE_FEED_TESTS"] == "1"
      abort "Set LIVE_FEED_TESTS=1 to acknowledge that this command contacts external providers"
    end

    refresh = News::RefreshFeeds.call(persist: false)
    results = refresh.success? ? refresh.value : refresh.metadata.fetch(:results)
    artifact_dir = ENV.fetch("ARTIFACT_DIR", Rails.root.join("tmp", "news_source_verification").to_s)
    artifact = News::VerificationReport.call(results: results, artifact_dir: artifact_dir)
    abort artifact.error.message if artifact.failure?

    puts File.read(artifact.value.fetch(:summary_path))
    puts "JSON artifact: #{artifact.value.fetch(:json_path)}"
    abort "One or more required news sources failed verification" unless refresh.success?
  end
end

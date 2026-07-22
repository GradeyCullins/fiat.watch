require "fileutils"
require "json"

module News
  class VerificationReport < ApplicationService
    SAMPLE_LIMIT = 3

    def initialize(results:, artifact_dir:, verified_at: Time.current)
      @results = results
      @artifact_dir = Pathname(artifact_dir)
      @verified_at = verified_at.utc
    end

    def call
      FileUtils.mkdir_p(@artifact_dir)
      basename = "news-sources-#{@verified_at.strftime('%Y%m%dT%H%M%SZ')}"
      json_path = @artifact_dir.join("#{basename}.json")
      text_path = @artifact_dir.join("#{basename}.txt")
      report = build_report

      File.write(json_path, JSON.pretty_generate(report))
      File.write(text_path, build_summary(report))
      success({ json_path: json_path.to_s, summary_path: text_path.to_s, report: report })
    rescue SystemCallError => error
      failure(code: :artifact_write_error, message: error.message)
    end

    private

    def build_report
      {
        schema_version: 1,
        verified_at: @verified_at.iso8601,
        success: @results.values.all?(&:success?),
        sources: @results.map { |name, result| source_report(name, result) }
      }
    end

    def source_report(name, result)
      if result.success?
        {
          source: name,
          success: true,
          endpoint: result.metadata[:endpoint],
          http_status: result.metadata[:status],
          content_type: result.metadata[:content_type],
          duration_ms: result.metadata[:duration_ms],
          received_count: result.metadata[:item_count],
          normalized_count: result.value.size,
          schema_valid: result.value.all? { |item| valid_item?(item) },
          samples: result.value.first(SAMPLE_LIMIT).map { |item| sample(item) }
        }
      else
        {
          source: name,
          success: false,
          error: result.error.to_h
        }
      end
    end

    def valid_item?(item)
      item.headline.present? && item.canonical_url.present? && item.published_at.present?
    end

    def sample(item)
      {
        published_at: item.published_at.utc.iso8601,
        headline: item.headline,
        publisher: item.publisher,
        url: item.canonical_url
      }
    end

    def build_summary(report)
      lines = [
        "Fiat Watch news source verification",
        "Verified: #{report[:verified_at]}",
        "Overall: #{report[:success] ? 'PASS' : 'FAIL'}",
        ""
      ]
      report[:sources].each do |source|
        if source[:success]
          lines << format(
            "%s: PASS (HTTP %s, %s items, %sms)",
            source[:source], source[:http_status], source[:normalized_count], source[:duration_ms]
          )
        else
          lines << "#{source[:source]}: FAIL (#{source.dig(:error, :code)}: #{source.dig(:error, :message)})"
        end
      end
      "#{lines.join("\n")}\n"
    end
  end
end

require "net/http"
require "uri"

module News
  class HttpClient
    Response = Data.define(:status, :headers, :body, :duration_ms, :url)
    USER_AGENT = "FiatWatch-NewsAggregator/1.0 (+https://fiat.watch)"
    REDIRECT_LIMIT = 3

    def get(url, headers: {}, open_timeout: 5, read_timeout: 10, redirect_limit: REDIRECT_LIMIT)
      started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)
      response, final_url = request(url, headers:, open_timeout:, read_timeout:, redirect_limit:)
      duration = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at) * 1_000).round

      Response.new(
        status: response.code.to_i,
        headers: response.each_header.to_h,
        body: response.body.to_s,
        duration_ms: duration,
        url: final_url
      )
    end

    private

    def request(url, headers:, open_timeout:, read_timeout:, redirect_limit:)
      uri = URI.parse(url)
      request = Net::HTTP::Get.new(uri)
      request["User-Agent"] = USER_AGENT
      request["Accept"] = "application/rss+xml, application/atom+xml, application/json, text/xml;q=0.9, */*;q=0.1"
      headers.each { |key, value| request[key] = value }

      response = Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == "https", open_timeout:, read_timeout:) do |http|
        http.request(request)
      end

      if response.is_a?(Net::HTTPRedirection) && redirect_limit.positive?
        destination = URI.join(url, response.fetch("location")).to_s
        return request(destination, headers:, open_timeout:, read_timeout:, redirect_limit: redirect_limit - 1)
      end

      [ response, url ]
    end
  end
end

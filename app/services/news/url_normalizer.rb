require "uri"

module News
  class UrlNormalizer
    TRACKING_PARAMETERS = %w[
      fbclid gclid mc_cid mc_eid ref source utm_campaign utm_content utm_medium utm_source utm_term
    ].freeze

    def self.call(url)
      uri = URI.parse(url.to_s.strip)
      return url.to_s.strip unless uri.is_a?(URI::HTTP)

      uri.fragment = nil
      parameters = URI.decode_www_form(uri.query.to_s)
      parameters.reject! { |key, _| TRACKING_PARAMETERS.include?(key.downcase) || key.downcase.start_with?("utm_") }
      uri.query = parameters.any? ? URI.encode_www_form(parameters.sort) : nil
      uri.path = uri.path.sub(%r{/+\z}, "") if uri.path != "/"
      uri.to_s
    rescue URI::InvalidURIError
      url.to_s.strip
    end
  end
end

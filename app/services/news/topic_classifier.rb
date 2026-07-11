module News
  class TopicClassifier
    RULES = {
      "inflation" => /\b(inflation|consumer prices?|cpi|cost of living)\b/i,
      "us_dollar" => /\b(us dollar|u\.s\. dollar|dollar index|dxy|greenback|usd)\b/i,
      "forex" => /\b(forex|foreign exchange|exchange rates?|currency|currencies|fx market)\b/i,
      "monetary_policy" => /\b(central bank|federal reserve|ecb|monetary policy|interest rates?|rate cut|rate hike)\b/i,
      "fiat" => /\b(fiat|legal tender|money supply)\b/i
    }.freeze

    def self.call(*text)
      haystack = text.compact.join(" ")
      RULES.filter_map { |topic, pattern| topic if haystack.match?(pattern) }
    end
  end
end

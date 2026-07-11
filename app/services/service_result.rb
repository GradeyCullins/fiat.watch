class ServiceResult
  Error = Data.define(:code, :message, :details)

  attr_reader :value, :error, :metadata

  def self.success(value = nil, metadata: {})
    new(value: value, metadata: metadata)
  end

  def self.failure(code:, message:, details: nil, metadata: {})
    new(error: Error.new(code: code.to_sym, message: message, details: details), metadata: metadata)
  end

  def initialize(value: nil, error: nil, metadata: {})
    raise ArgumentError, "a result cannot contain both a value and an error" if !value.nil? && error

    @value = value
    @error = error
    @metadata = metadata.freeze
    freeze
  end

  def success?
    error.nil?
  end

  def failure?
    !success?
  end
end

class ApplicationService
  def self.call(...)
    new(...).call
  end

  private

  def success(value = nil, metadata: {})
    ServiceResult.success(value, metadata: metadata)
  end

  def failure(code:, message:, details: nil, metadata: {})
    ServiceResult.failure(code: code, message: message, details: details, metadata: metadata)
  end
end

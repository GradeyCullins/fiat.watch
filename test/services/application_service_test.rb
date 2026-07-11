require "test_helper"

class ApplicationServiceTest < ActiveSupport::TestCase
  class GreetingService < ApplicationService
    def initialize(name:)
      @name = name
    end

    def call
      success("Hello #{@name}", metadata: { length: @name.length })
    end
  end

  test "call returns a uniform successful result" do
    result = GreetingService.call(name: "Fiat")

    assert result.success?
    refute result.failure?
    assert_equal "Hello Fiat", result.value
    assert_equal({ length: 4 }, result.metadata)
  end

  test "failure contains a structured error" do
    result = ServiceResult.failure(code: :unavailable, message: "Try later", details: { retry: true })

    assert result.failure?
    assert_equal :unavailable, result.error.code
    assert_equal({ retry: true }, result.error.details)
  end

  test "existing services implement call without removing helpers" do
    cpi = CpiCalculator.call(amount: 100, from_year: 2000, to_year: 2020)
    annual = AveragePriceCatalog.call(slug: AveragePriceCatalog.all.first.slug, year: AveragePriceCatalog.all.first.years.keys.first)

    assert cpi.success?
    assert_kind_of CpiCalculator::Result, cpi.value
    assert annual.success?
    assert_equal 2, annual.value.size
  end
end

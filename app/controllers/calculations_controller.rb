class CalculationsController < ApplicationController
  before_action :set_year_options
  before_action :set_ticker_items

  def index
    @amount = params[:amount].presence
    @from_year = params[:from_year].presence&.to_i || default_from_year
    @to_year = params[:to_year].presence&.to_i || CpiCalculator.latest_year
    @result = compute_result if @amount.present?
    set_seo_for_index
  end

  def show
    @amount = params[:amount].presence
    @from_year = params[:from_year].presence&.to_i || default_from_year
    @to_year = params[:to_year].presence&.to_i || CpiCalculator.latest_year
    @result = compute_result
    set_seo_for_index
    respond_to do |format|
      format.html { render "calculations/index" }
      format.turbo_stream
    end
  end

  private

  def compute_result
    CpiCalculator.convert(
      amount: @amount,
      from_year: @from_year,
      to_year: @to_year
    )
  rescue CpiCalculator::Error => e
    @error = e.message
    nil
  end

  def set_year_options
    @year_options = CpiCalculator.years.reverse
  end

  def set_ticker_items
    latest_year = CpiCalculator.latest_year

    @ticker_items = [
      ticker_item(label: "Thirty-year check", amount: 100, from_year: default_from_year, to_year: latest_year),
      ticker_item(label: "A 1913 dollar", amount: 1, from_year: CpiCalculator.earliest_year, to_year: latest_year),
      ticker_item(label: "Postwar prices", amount: 20, from_year: 1950, to_year: latest_year),
      ticker_item(label: "Seventies money", amount: 50, from_year: 1976, to_year: latest_year),
      ticker_item(label: "Great recession", amount: 500, from_year: 2008, to_year: latest_year),
      ticker_item(label: "Pre-pandemic", amount: 100, from_year: 2019, to_year: latest_year)
    ]
  end

  def ticker_item(label:, amount:, from_year:, to_year:)
    result = CpiCalculator.convert(amount: amount, from_year: from_year, to_year: to_year)

    {
      label: label,
      from_text: "#{result.amount_formatted} in #{result.from_year}",
      to_text: "#{result.converted_formatted} in #{result.to_year}"
    }
  end

  def default_from_year
    candidate = CpiCalculator.latest_year - 30
    CpiCalculator.years.include?(candidate) ? candidate : CpiCalculator.earliest_year
  end

  def set_seo_for_index
    if @result
      @page_title = "CPI Inflation Calculator: #{@result.from_year} to #{@result.to_year} | Fiat Watch"
      @meta_description = "#{@result.amount_formatted} in #{@result.from_year} has the same purchasing power as #{@result.converted_formatted} in #{@result.to_year}. #{@result.cumulative_inflation_text} CPI-based inflation calculator."
    else
      @page_title = "US Inflation Calculator With CPI Data | Fiat Watch"
      @meta_description = "Find out what your money was really worth. Compare the purchasing power of any US dollar amount between #{CpiCalculator.earliest_year} and #{CpiCalculator.latest_year} using official BLS CPI data."
    end
    @canonical_path = canonical_path_for_current_request
  end

  def canonical_path_for_current_request
    if @amount.present?
      "/calculation?" + {
        amount: @amount,
        from_year: @from_year,
        to_year: @to_year
      }.to_query
    else
      "/"
    end
  end
end

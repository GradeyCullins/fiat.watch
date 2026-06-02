require "bigdecimal"

class CostPagesController < ApplicationController
  def show
    match = AveragePriceCatalog.find_price(slug: params[:item], year: params[:year])
    raise ActionController::RoutingError, "Not Found" unless match

    @item, @year_price = match
    @year = params[:year].to_i
    @latest_year = CpiCalculator.latest_year
    @inflation_result = CpiCalculator.convert(amount: @year_price, from_year: @year, to_year: @latest_year)
    @page_title = "How Much Did #{@item.question_name.titleize} Cost in #{@year}? | Cooked Fiat"
    @meta_description = "#{@item.question_name.capitalize} cost #{format_usd(@year_price)} #{@item.unit} in #{@year}, based on BLS average price data. See the inflation-adjusted value in #{@latest_year} dollars."
    @canonical_path = cost_page_path(@item.slug, @year)
  end

  private

  def format_usd(value)
    whole, frac = format("%.2f", BigDecimal(value.to_s).round(2)).split(".")
    "$#{whole.reverse.scan(/\d{1,3}/).join(",").reverse}.#{frac}"
  end
end

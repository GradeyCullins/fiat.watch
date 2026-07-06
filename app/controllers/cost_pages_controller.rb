require "bigdecimal"

class CostPagesController < ApplicationController
  PRICE_SUBJECTS = {
    "gas" => "gas",
    "eggs" => "egg",
    "bread" => "bread",
    "milk" => "milk",
    "ground-beef" => "ground beef"
  }.freeze

  def index
    @item = find_item(params[:item])
    @latest_year = CpiCalculator.latest_year
    @price_rows = @item.entries.reverse.map do |year, price|
      {
        year: year,
        price: price,
        adjusted_price: CpiCalculator.convert(amount: price, from_year: year, to_year: @latest_year).converted_formatted
      }
    end
    @calculator_link = calculator_link_for(@item)
    @related_items = AveragePriceCatalog.all.reject { |item| item.slug == @item.slug }
    @historical_heading = "Historical #{price_subject(@item)} prices by year"
    @page_title = "Historical #{price_subject(@item).titleize} Prices by Year | Fiat Watch"
    @meta_description = "Browse BLS average #{price_subject(@item)} prices by year. See historical #{@item.question_name} costs and inflation-adjusted values in #{@latest_year} dollars."
    @canonical_path = cost_item_path(@item.slug)
  end

  def show
    match = AveragePriceCatalog.find_price(slug: params[:item], year: params[:year])
    raise ActionController::RoutingError, "Not Found" unless match

    @item, @year_price = match
    @year = params[:year].to_i
    @latest_year = CpiCalculator.latest_year
    @inflation_result = CpiCalculator.convert(amount: @year_price, from_year: @year, to_year: @latest_year)
    @previous_entry, @next_entry = neighboring_entries(@item, @year)
    @related_price_rows = related_price_rows(@item, @year)
    @month_rows = month_rows_for_year(@item, @year)
    @calculator_link = calculator_link_for(@item)
    @page_title = "How Much Did #{@item.question_name.titleize} Cost in #{@year}? | Fiat Watch"
    @meta_description = "#{@item.question_name.capitalize} cost #{format_usd(@year_price)} #{@item.unit} in #{@year}, based on BLS average price data. See the inflation-adjusted value in #{@latest_year} dollars."
    @canonical_path = cost_page_path(@item.slug, @year)
  end

  def month
    match = AveragePriceMonthlyCatalog.find_price(slug: params[:item], year: params[:year], month: params[:month])
    raise ActionController::RoutingError, "Not Found" unless match

    @item, @month_price = match
    @year = params[:year].to_i
    @month = params[:month].to_i
    @month_name = Date::MONTHNAMES.fetch(@month)
    @latest_year = CpiCalculator.latest_year
    @inflation_result = CpiCalculator.convert(amount: @month_price, from_year: @year, to_year: @latest_year)
    @previous_entry, @next_entry = neighboring_month_entries(@item, @year, @month)
    @related_month_price_rows = related_month_price_rows(@item, @year, @month)
    @calculator_link = calculator_link_for(@item)
    @page_title = "How Much Did #{@item.question_name.titleize} Cost in #{@month_name} #{@year}? | Fiat Watch"
    @meta_description = "#{@item.question_name.capitalize} cost #{format_usd(@month_price)} #{@item.unit} in #{@month_name} #{@year}, based on BLS average price data. See the inflation-adjusted value in #{@latest_year} dollars."
    @canonical_path = cost_month_page_path(@item.slug, @year, params[:month])
  end

  private

  def find_item(slug)
    AveragePriceCatalog.find(slug)
  rescue KeyError
    raise ActionController::RoutingError, "Not Found"
  end

  def format_usd(value)
    whole, frac = format("%.2f", BigDecimal(value.to_s).round(2)).split(".")
    "$#{whole.reverse.scan(/\d{1,3}/).join(",").reverse}.#{frac}"
  end

  def price_subject(item)
    PRICE_SUBJECTS.fetch(item.slug)
  end

  def neighboring_entries(item, year)
    entries = item.entries
    index = entries.index { |entry_year, _price| entry_year == year }

    [
      previous_entry(entries, index),
      index ? entries[index + 1] : nil
    ]
  end

  def previous_entry(entries, index)
    return unless index&.positive?

    entries[index - 1]
  end

  def related_price_rows(item, year)
    AveragePriceCatalog.all.filter_map do |related_item|
      next if related_item.slug == item.slug

      price = related_item.years[year]
      next unless price

      { item: related_item, price: price }
    end
  end

  def month_rows_for_year(item, year)
    monthly_item = AveragePriceMonthlyCatalog.find(item.slug)
    monthly_item.months_for(year).map do |month|
      {
        month: month,
        month_name: Date::MONTHNAMES.fetch(month),
        price: monthly_item.price_for(year, month)
      }
    end
  rescue KeyError
    []
  end

  def neighboring_month_entries(item, year, month)
    entries = item.entries
    index = entries.index { |entry_year, entry_month, _price| entry_year == year && entry_month == month }

    [
      previous_entry(entries, index),
      index ? entries[index + 1] : nil
    ]
  end

  def related_month_price_rows(item, year, month)
    AveragePriceMonthlyCatalog.all.filter_map do |related_item|
      next if related_item.slug == item.slug

      price = related_item.months.dig(year, month)
      next unless price

      { item: related_item, price: price }
    end
  end

  def calculator_link_for(item)
    if item.slug == "gas"
      [ "Gas inflation calculator", gas_inflation_calculator_path ]
    else
      [ "Grocery inflation calculator", grocery_inflation_calculator_path ]
    end
  end
end

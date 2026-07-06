require "net/http"
require "json"
require "uri"
require "date"

module AveragePriceImporter
  ITEM_META = {
    "gas" => {
      name: "gas", item_name: "gasoline", question_name: "gas", unit: "per gallon",
      series_id: "APU000074714", series_name: "Gasoline, unleaded regular, per gallon/3.785 liters"
    },
    "eggs" => {
      name: "eggs", item_name: "eggs", question_name: "eggs", unit: "per dozen",
      series_id: "APU0000708111", series_name: "Eggs, grade A, large, per doz."
    },
    "bread" => {
      name: "bread", item_name: "white bread", question_name: "bread", unit: "per pound",
      series_id: "APU0000702111", series_name: "Bread, white, pan, per lb. (453.6 gm)"
    },
    "milk" => {
      name: "milk", item_name: "whole milk", question_name: "milk", unit: "per gallon",
      series_id: "APU0000709112", series_name: "Milk, fresh, whole, fortified, per gal. (3.8 lit)"
    },
    "ground-beef" => {
      name: "ground beef", item_name: "ground beef", question_name: "ground beef", unit: "per pound",
      series_id: "APU0000703112", series_name: "Ground beef, 100% beef, per lb. (453.6 gm)"
    }
  }.freeze

  module_function

  def each_year_window(start_year, end_year, api_key)
    window_size = api_key.present? ? 20 : 10
    year = start_year
    while year <= end_year
      window_end = [ year + window_size - 1, end_year ].min
      yield year, window_end
      year = window_end + 1
    end
  end

  def annual_values_from_monthly(rows)
    by_year = Hash.new { |h, k| h[k] = [] }
    rows.each do |row|
      next unless row["period"].to_s.match?(/\AM\d{2}\z/)

      value = numeric_value(row["value"])
      next unless value

      by_year[row["year"].to_s.to_i] << value
    end

    by_year.transform_values { |values| [ (values.sum / values.size).round(3), values.size ] }
  end

  def monthly_values_from(rows)
    by_year = Hash.new { |h, k| h[k] = {} }
    rows.each do |row|
      next unless row["period"].to_s.match?(/\AM(0[1-9]|1[0-2])\z/)

      value = numeric_value(row["value"])
      next unless value

      by_year[row["year"].to_s.to_i][row["period"][1..2].to_i] = value
    end
    by_year
  end

  def numeric_value(value)
    Float(value)
  rescue ArgumentError, TypeError
    nil
  end

  def fetch_series(series_ids, start_year, end_year, api_key)
    uri = URI("https://api.bls.gov/publicAPI/v2/timeseries/data/")
    body = {
      "seriesid" => series_ids,
      "startyear" => start_year.to_s,
      "endyear" => end_year.to_s
    }
    body["registrationkey"] = api_key if api_key

    req = Net::HTTP::Post.new(uri, "Content-Type" => "application/json")
    req.body = body.to_json
    res = Net::HTTP.start(uri.host, uri.port, use_ssl: true, read_timeout: 15) { |h| h.request(req) }
    JSON.parse(res.body)
  end

  def merge_and_write(computed_years)
    path = Rails.root.join("db", "average_price_data.json")
    existing = JSON.parse(File.read(path))
    existing_items = existing.fetch("items", {})

    items = ITEM_META.each_with_object({}) do |(slug, meta), h|
      existing_years = existing_items.dig(slug, "years") || {}
      merged_years = existing_years.transform_keys(&:to_i).merge(computed_years.fetch(slug))

      h[slug] = {
        "name" => meta.fetch(:name),
        "item_name" => meta.fetch(:item_name),
        "question_name" => meta.fetch(:question_name),
        "unit" => meta.fetch(:unit),
        "series_id" => meta.fetch(:series_id),
        "series_name" => meta.fetch(:series_name),
        "years" => merged_years.sort.to_h
      }
    end

    payload = {
      "source" => existing.fetch("source", "U.S. Bureau of Labor Statistics Average Price Data"),
      "source_url" => existing.fetch("source_url", "https://www.bls.gov/cpi/factsheets/average-prices.htm"),
      "mirror" => "BLS public API (annual mean of published monthly values)",
      "last_updated" => Date.today.to_s,
      "items" => items
    }

    File.write(path, JSON.pretty_generate(payload) + "\n")
    items.transform_values { |v| v.fetch("years") }
  end

  def merge_and_write_monthly(computed_months)
    path = Rails.root.join("db", "average_price_monthly_data.json")
    existing = File.exist?(path) ? JSON.parse(File.read(path)) : {}
    existing_items = existing.fetch("items", {})

    items = ITEM_META.each_with_object({}) do |(slug, meta), h|
      existing_months = (existing_items.dig(slug, "months") || {}).each_with_object({}) do |(year, month_hash), acc|
        acc[year.to_i] = month_hash.transform_keys(&:to_i)
      end

      merged = existing_months.merge(computed_months.fetch(slug, {})) do |_year, old_months, new_months|
        old_months.merge(new_months)
      end

      months_json = merged.sort.to_h.transform_values { |month_hash| month_hash.sort.to_h.transform_keys { |m| m.to_s.rjust(2, "0") } }

      h[slug] = {
        "name" => meta.fetch(:name),
        "item_name" => meta.fetch(:item_name),
        "question_name" => meta.fetch(:question_name),
        "unit" => meta.fetch(:unit),
        "series_id" => meta.fetch(:series_id),
        "series_name" => meta.fetch(:series_name),
        "months" => months_json.transform_keys(&:to_s)
      }
    end

    payload = {
      "source" => "U.S. Bureau of Labor Statistics Average Price Data",
      "source_url" => "https://www.bls.gov/cpi/factsheets/average-prices.htm",
      "mirror" => "BLS public API (raw published monthly values, no averaging)",
      "last_updated" => Date.today.to_s,
      "items" => items
    }

    File.write(path, JSON.pretty_generate(payload) + "\n")
    items
  end
end

namespace :average_price do
  desc "Backfill/refresh BLS average price annual data (gas, eggs, bread, milk, ground beef) for every year."
  task refresh: :environment do
    importer = AveragePriceImporter
    api_key = ENV["BLS_API_KEY"] # optional; raises the per-request year window and daily quota
    start_year = (ENV["AVERAGE_PRICE_START_YEAR"] || 1976).to_i
    end_year = Date.today.year

    puts "Fetching #{importer::ITEM_META.size} BLS average-price series from #{start_year}-#{end_year}…"

    computed_years = importer::ITEM_META.keys.index_with { {} }
    computed_months = importer::ITEM_META.keys.index_with { {} }
    partial_years = importer::ITEM_META.keys.index_with { [] }
    series_by_id = importer::ITEM_META.each_with_object({}) { |(slug, meta), h| h[meta.fetch(:series_id)] = slug }

    importer.each_year_window(start_year, end_year, api_key) do |window_start, window_end|
      puts "  window #{window_start}-#{window_end}"
      json = importer.fetch_series(importer::ITEM_META.values.map { |m| m.fetch(:series_id) }, window_start, window_end, api_key)

      if json["status"] != "REQUEST_SUCCEEDED"
        abort "BLS API error: #{json["status"]} — #{Array(json["message"]).join("; ")}"
      end

      Array(json.dig("Results", "series")).each do |series|
        slug = series_by_id.fetch(series.fetch("seriesID"))
        rows = series.fetch("data")

        importer.annual_values_from_monthly(rows).each do |year, (average, valid_months)|
          computed_years[slug][year] = average
          partial_years[slug] << year if valid_months < 12
        end

        importer.monthly_values_from(rows).each do |year, months|
          computed_months[slug][year] ||= {}
          computed_months[slug][year].merge!(months)
        end
      end

      sleep 1
    end

    merged = importer.merge_and_write(computed_years)
    merged_months = importer.merge_and_write_monthly(computed_months)

    merged.each do |slug, years|
      years_sorted = years.keys.sort
      month_count = merged_months.fetch(slug).fetch("months").values.sum(&:size)
      puts "#{slug}: #{years.size} years (#{years_sorted.first}-#{years_sorted.last}), #{month_count} months"
    end

    partial_years.each do |slug, years|
      next if years.empty?
      puts "  note: #{slug} has partial-year data (fewer than 12 published months) for #{years.sort.uniq.join(', ')}"
    end
  end

  desc "Show the year range currently bundled per average-price item."
  task status: :environment do
    require_relative Rails.root.join("app/services/average_price_catalog")
    AveragePriceCatalog.all.each do |item|
      years = item.years.keys.sort
      puts "#{item.slug}: #{years.size} years (#{years.first}-#{years.last})"
    end
  end
end

require "json"

class AveragePriceCatalog < ApplicationService
  DATA_PATH = Rails.root.join("db", "average_price_data.json")

  Item = Data.define(:slug, :name, :item_name, :question_name, :unit, :series_id, :series_name, :years) do
    def price_for(year)
      years.fetch(year.to_i)
    end

    def entries
      years.keys.sort.map { |year| [ year, years.fetch(year) ] }
    end
  end

  class << self
    def source_name
      data.fetch("source")
    end

    def source_url
      data.fetch("source_url")
    end

    def mirror_name
      data.fetch("mirror")
    end

    def data
      @data ||= JSON.parse(File.read(DATA_PATH))
    end

    def find(slug)
      item_data = items.fetch(slug)
      Item.new(
        slug: slug,
        name: item_data.fetch("name"),
        item_name: item_data.fetch("item_name"),
        question_name: item_data.fetch("question_name"),
        unit: item_data.fetch("unit"),
        series_id: item_data.fetch("series_id"),
        series_name: item_data.fetch("series_name"),
        years: item_data.fetch("years").transform_keys(&:to_i)
      )
    end

    def all
      items.keys.map { |slug| find(slug) }
    end

    def find_price(slug:, year:)
      item = find(slug)
      price = item.price_for(year)
      [ item, price ]
    rescue KeyError
      nil
    end

    def entries
      items.keys.flat_map do |slug|
        item = find(slug)
        item.entries.map { |year, price| [ item, year, price ] }
      end
    end

    private

    def items
      data.fetch("items")
    end
  end

  def initialize(slug:, year:)
    @slug = slug
    @year = year
  end

  def call
    match = self.class.find_price(slug: @slug, year: @year)
    match ? success(match) : failure(code: :price_not_found, message: "No annual price found")
  end
end

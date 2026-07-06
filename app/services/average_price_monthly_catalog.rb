require "json"

class AveragePriceMonthlyCatalog
  DATA_PATH = Rails.root.join("db", "average_price_monthly_data.json")

  Item = Data.define(:slug, :name, :item_name, :question_name, :unit, :series_id, :series_name, :months) do
    def price_for(year, month)
      months.fetch(year.to_i).fetch(month.to_i)
    end

    def months_for(year)
      months.fetch(year.to_i, {}).keys.sort
    end

    def entries
      months.keys.sort.flat_map do |year|
        months.fetch(year).keys.sort.map { |month| [ year, month, months.fetch(year).fetch(month) ] }
      end
    end
  end

  class << self
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
        months: item_data.fetch("months").each_with_object({}) { |(year, month_hash), acc|
          acc[year.to_i] = month_hash.transform_keys(&:to_i)
        }
      )
    end

    def all
      items.keys.map { |slug| find(slug) }
    end

    def find_price(slug:, year:, month:)
      item = find(slug)
      price = item.price_for(year, month)
      [ item, price ]
    rescue KeyError
      nil
    end

    private

    def items
      data.fetch("items")
    end
  end
end

class CreateNewsArticles < ActiveRecord::Migration[8.1]
  def change
    create_table :news_articles do |t|
      t.string :provider, null: false
      t.string :provider_identifier
      t.string :canonical_url, null: false
      t.string :headline, null: false
      t.text :summary
      t.string :publisher
      t.string :author
      t.string :language
      t.text :topics, null: false, default: "[]"
      t.datetime :published_at, null: false
      t.datetime :fetched_at, null: false
      t.timestamps
    end

    add_index :news_articles, [ :provider, :provider_identifier ], unique: true,
      where: "provider_identifier IS NOT NULL", name: "index_news_articles_on_provider_identifier"
    add_index :news_articles, :canonical_url, unique: true
    add_index :news_articles, :published_at
    add_index :news_articles, :provider
  end
end

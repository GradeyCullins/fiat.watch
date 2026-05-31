Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  get "sitemap.xml" => "sitemap#index", as: :sitemap, defaults: { format: "xml" }

  get "salary-inflation-calculator" => "seo_pages#show", as: :salary_inflation_calculator, defaults: { page: "salary" }
  get "rent-inflation-calculator" => "seo_pages#show", as: :rent_inflation_calculator, defaults: { page: "rent" }
  get "grocery-inflation-calculator" => "seo_pages#show", as: :grocery_inflation_calculator, defaults: { page: "groceries" }

  resource :calculation, only: [ :show ], controller: "calculations"

  root "calculations#index"
end

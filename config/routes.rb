Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  get "sitemap" => "sitemap#show", as: :html_sitemap, format: false
  get "sitemap.xml" => "sitemap#index", as: :sitemap, defaults: { format: "xml" }

  get "salary-inflation-calculator" => "seo_pages#show", as: :salary_inflation_calculator, defaults: { page: "salary" }
  get "rent-inflation-calculator" => "seo_pages#show", as: :rent_inflation_calculator, defaults: { page: "rent" }
  get "grocery-inflation-calculator" => "seo_pages#show", as: :grocery_inflation_calculator, defaults: { page: "groceries" }
  get "gas-inflation-calculator" => "seo_pages#show", as: :gas_inflation_calculator, defaults: { page: "gas" }
  get "car-price-inflation-calculator" => "seo_pages#show", as: :car_price_inflation_calculator, defaults: { page: "car_prices" }
  get "college-tuition-inflation-calculator" => "seo_pages#show", as: :college_tuition_inflation_calculator, defaults: { page: "college_tuition" }
  get "minimum-wage-inflation-calculator" => "seo_pages#show", as: :minimum_wage_inflation_calculator, defaults: { page: "minimum_wage" }
  get "costs/:item/:year" => "cost_pages#show", as: :cost_page, constraints: { year: /\d{4}/ }

  resource :calculation, only: [ :show ], controller: "calculations"

  root "calculations#index"
end

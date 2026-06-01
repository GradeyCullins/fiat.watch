# Repository Guidelines

## Project Structure & Module Organization
This is a Rails 8 app. Core server code lives in `app/`: controllers in `app/controllers`, views in `app/views`, shared logic in `app/services`, and Stimulus code in `app/javascript/controllers`. Configuration is under `config/`, data and schema files are in `db/`, and public static assets live in `public/`. Tests use Minitest and currently sit in `test/`, with controller tests such as `test/controllers/calculations_controller_test.rb`. Project-specific tasks belong in `lib/tasks/`.

## Build, Test, and Development Commands
Use the project binstubs so versions stay aligned.

- `bin/setup`: install gems, prepare the database, clear logs/tmp, and start the app.
- `bin/dev`: run the local Rails server.
- `bin/rails test`: run the Minitest suite.
- `bin/ci`: run the full local CI flow: setup, RuboCop, security checks, tests, and seed validation.
- `bin/rubocop`: run Ruby style checks.
- `bin/brakeman --quiet --no-pager --exit-on-warn --exit-on-error`: run static security analysis.
- `bin/bundler-audit`: check gems for known vulnerabilities.

## Coding Style & Naming Conventions
Follow standard Rails conventions and the inherited `rubocop-rails-omakase` rules from `.rubocop.yml`. Use 2-space indentation in Ruby files. Keep class names CamelCase, filenames snake_case, and controller/view names aligned with routes and actions. Put non-trivial business logic in service objects such as `app/services/cpi_calculator.rb`, not in views.

## Testing Guidelines
Write tests with Minitest. Name test files `*_test.rb` and mirror the application structure where practical. Prefer focused controller or service tests for behavior changes, and add regression coverage for bug fixes. Before opening a PR, run `bin/rails test`; for broader validation, run `bin/ci`.

## Commit & Pull Request Guidelines
Recent history favors short, imperative commit subjects like `Add SEO landing pages and analytics tracking`. Keep commits narrowly scoped and descriptive; avoid vague messages like `second`. PRs should explain the user-visible change, note any config or analytics impact, link related issues, and include screenshots for view changes. Confirm `bin/ci` passes before requesting review.

## Security & Configuration Tips
Do not commit secrets. Keep local overrides in `.env.local`, and treat `config/credentials.yml.enc` changes as intentional and reviewable. If you touch analytics or importmap dependencies, rerun the security checks in `bin/ci`.

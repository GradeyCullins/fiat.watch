# Cooked Fiat

Cooked Fiat is a Rails inflation calculator powered by U.S. BLS CPI-U data.

## Analytics

Google Analytics 4 is loaded with `G-YPBX9G87YD`. Successful calculator results
emit a `calculation_completed` event with these parameters:

- `amount`
- `from_year`
- `to_year`
- `year_span`
- `direction`

Register those as GA4 custom definitions if you want to use them in standard
reports. Sponsor placements also emit `sponsor_slot_view` and
`sponsor_contact_click` with a `placement` parameter.

## Development

Run the test suite with:

```bash
bin/rails test
```

# Between Paychecks

An irregular-income dashboard using one transaction dataset for period totals, a balanced D3 Sankey, spending history, category detail, and a searchable ledger. All financial arithmetic uses validated integer cents.

[Open the dashboard](https://graysonjackson.github.io/personal-finance-visualizer/)

```sh
npm ci
npm run build
npm test
npm run preview
```

Vite builds `out/` for `/personal-finance-visualizer/`. The Pages workflow publishes that artifact.

## CSV

The importer supports quoted CSV, column mapping, review, and cancellation. Files are limited to 5 MB and 5,000 rows. Use USD amounts with at most two decimal places. A type column can distinguish income, expenses, refunds, and transfers; absent a type, signs distinguish income/expense. Internal amounts store a positive cent magnitude alongside the explicit type. Transfers are excluded from flow totals. Refunds are shown as inflows and reduce net spending. Net flow is not a bank balance or a forecast.

Parsing/validation errors preserve the current dataset. Imported text is escaped for display. The example CSV is downloadable from the interface. Transactions remain in memory unless Save Session is explicitly selected; Clear Saved removes only this application's storage key. Hosted page and font requests still occur, but the application does not upload CSV contents.

Tests cover the actual parser, transaction store, chart data, sorting, precision boundaries, refunds/transfers, and malicious-text escaping. Browser tests remain necessary for user journeys and layout.

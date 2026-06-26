**Purpose**: Future features and improvements prioritized by value  
**Last Updated**: 2026-06-18

# Feature Backlog

## Next Sprint (High Priority)

### Fix digital payment failure stock reversal

- **Description**: When Midtrans payment `failed` or `expired`, restore product stock and mark transaction appropriately.
- **User Value**: Prevents inventory drift from abandoned digital checkouts.
- **Effort**: Medium
- **Dependencies**: Midtrans callback hardening (see `docs/todo.md`)
- **Files Affected**: `TransactionController.php`, possibly a queued job

### Dashboard charts (permissions exist, UI missing)

- **Description**: Implement `dashboard.revenue_chart` and `dashboard.best_selling` widgets on dashboard.
- **User Value**: Visual sales trends for store owners.
- **Effort**: Medium
- **Dependencies**: None
- **Files Affected**: `DashboardController.php`, `Pages/Account/Dashboard/Index.jsx`

### Report export

- **Description**: CSV/PDF export for sales, profit, stock reports (`reports.export` permission seeded but unused).
- **User Value**: Accounting and offline analysis.
- **Effort**: Medium
- **Files Affected**: `*ReportController.php`, new export classes

## Upcoming Features (Medium Priority)

### Permission management UI

- **Description**: Admin UI for `permissions.index` (permission exists in seeder, no route/page).
- **Effort**: Small–Medium
- **Value**: Fine-grained role tuning without database edits

### Cashier shift report

- **Description**: Dedicated shift close report (`cashier_shifts.report` permission).
- **Effort**: Small
- **Value**: End-of-day reconciliation printout

### Product stock adjustment permission

- **Description**: Wire `products.stock_adjustment` permission to a dedicated action (currently only via stock movements).
- **Effort**: Small
- **Value**: Faster stock corrections from product list

### Transaction print

- **Description**: Receipt printing using store settings (`transactions.print`, receipt paper size 58/80mm).
- **Effort**: Medium
- **Value**: Core POS requirement for physical stores

### Automated test suite

- **Description**: Feature tests for checkout, void, return approval, purchase stock-in.
- **Effort**: Large
- **Value**: Regression safety for money/stock flows

## Ideas & Future Considerations (Low Priority)

### Multi-store / branch support

- **Concept**: Separate inventory and reporting per branch.
- **Potential Value**: Chain retail expansion
- **Complexity**: High — touches most tables and scoping

### Barcode scanner hardware integration

- **Concept**: USB scanner input on POS create page (may already work via barcode field focus).
- **Potential Value**: Faster checkout
- **Complexity**: Low–Medium

### Loyalty / customer points

- **Concept**: Points on `customers` linked to transactions.
- **Potential Value**: Retention
- **Complexity**: Medium

## Technical Improvements

### Performance & Code Quality

- Extract shared stock mutation logic into a service — Impact: Medium (reduces duplication across controllers)
- Add Form Request classes for validation — Impact: Low (consistency)
- Fix Midtrans callback to use `completed` status consistently — Impact: High (see todo P0)

### Infrastructure

- Document MySQL production setup (`.env.example` currently defaults SQLite)
- Add `php artisan storage:link` to setup docs for product/settings images
- Queue failed digital payment cleanup if callback is unreliable

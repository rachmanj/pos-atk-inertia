**Purpose**: AI's persistent knowledge base for project context and learnings  
**Last Updated**: 2026-07-21 (POS/laporan remaining gaps)

---

## Project Memory Entries

### POS-001 Project identity (2026-06-18) ✅ COMPLETE

**Challenge/Decision**: What is this repo?  
**Solution**: Indonesian retail POS ("POS Kasir") — Laravel 12 + Inertia/React monolith with inventory, purchasing, shifts, Midtrans payments.  
**Key Learning**: Read `docs/architecture.md` first; all business routes live under `/account/*` with Spatie permissions.

### POS-002 Local dev & credentials (2026-06-18) ✅ COMPLETE

**Challenge/Decision**: How to run and log in locally?  
**Solution**: `composer dev` (serve + queue + pail + vite). Seed: `php artisan migrate --seed`. Users: username `admin` / email `admin@gmail.com` or username `kasir` / email `kasir@gmail.com`, password `password`. App URL: `http://127.0.0.1:8000` (not 3000).  
**Key Learning**: Do not store real Midtrans keys in docs; use env names `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `MIDTRANS_IS_PRODUCTION`.

### POS-003 POS gate: cashier shift (2026-06-18) ✅ COMPLETE

**Challenge/Decision**: Why can't cashier open POS?  
**Solution**: `User::activeCashierShift()` must be `open` — redirect to `account.cashier-shifts.create`.  
**Key Learning**: Check shift before debugging cart/transaction errors.

### POS-004 Admin vs cashier data scope (2026-06-18) ✅ COMPLETE

**Challenge/Decision**: Why does cashier see fewer records?  
**Solution**: `User::isAdminUser()` (`config('roles.admin')`) — non-admins filtered by `cashier_id` / `user_id` in controllers.  
**Key Learning**: Test with both seeded accounts when verifying reports and transaction history.

### POS-005 Midtrans callback (2026-06-18) ✅ COMPLETE

**Challenge/Decision**: Digital payment profit/status wrong?  
**Solution**: `TransactionController::callback()` sets `status=completed` and writes `total_revenue`/`total_cost`/`profit_amount` using detail COGS (WAC or PPOB cost).

### POS-006 Stock always moves at checkout (2026-06-18) ✅ COMPLETE

**Challenge/Decision**: When does stock decrement for digital sales?  
**Solution**: At `TransactionController@store`, before Snap token — not on callback.  
**Key Learning**: Expired/failed digital payments may need manual stock reversal (backlog item).

### POS-007 Shared Inertia props (2026-06-18) ✅ COMPLETE

**Challenge/Decision**: Where do frontend permissions come from?  
**Solution**: `HandleInertiaRequests::share()` → `auth.permissions` from `User::getPermissionArray()`. Frontend: `Utils/Permissions.jsx`.  
**Key Learning**: Permission names must match exactly between seeder, routes, and JSX checks.

### POS-008 Money is integer IDR (2026-06-18) ✅ COMPLETE

**Challenge/Decision**: Formatting and validation for prices?  
**Solution**: All monetary DB columns are integers; use `Utils/format.js` for display.  
**Key Learning**: Never use floats for rupiah in new code.

### POS-009 Duplicate logout route (2026-06-18) ✅ COMPLETE

**Challenge/Decision**: Harmless duplication in routes?  
**Solution**: Removed duplicate `POST /logout` in `routes/web.php` (was registered twice).  
**Key Learning**: Fixed during POS hardening 2026-06-20.

### POS-010 Database inspection (2026-06-18) ✅ COMPLETE

**Challenge/Decision**: How to query DB per project rules?  
**Solution**: Prefer MySQL MCP for read-only inspection when MySQL is configured; use Artisan for migrations/seed. Default `.env.example` uses SQLite.  
**Key Learning**: `.cursorrules` says MySQL MCP — project may use SQLite locally; check `DB_CONNECTION` in `.env`.

### POS-011 Multi-UOM, WAC & PPOB (2026-06-18) ✅ COMPLETE

**Challenge/Decision**: How do multi-unit sales, inventory cost, and PPOB work?  
**Solution**: `units` + `product_units` (conversion_factor, sell_price per UOM). Stock always in base units. WAC on `products.avg_cost` updated in `PurchaseController`. PPOB products (`product_type=ppob`) skip stock; POS modal captures optional `customer_ref`, required `ppob_cost` + `admin_fee` (default from `settings.ppob_admin_fee`). PPOB saldo via `ppob_accounts` + `ppob_balance_logs` (`PpobBalanceService`).  
**Key Learning**: Cart unique constraint removed — PPOB lines always create new rows; physical lines merge by product+unit. Run `php artisan migrate` then seed `SettingsSeeder` + `UnitSeeder` on existing DBs. Key files: `ProductController`, `CartController`, `TransactionController`, `PurchaseController`, `PpobBalanceService`, `resources/js/Pages/Account/Transactions/Create.jsx`.

### POS-012 PPOB catalog without buy/sell price (2026-06-18) ✅ COMPLETE

**Challenge/Decision**: Why does creating a PPOB product fail with "buy price field is required"?  
**Solution**: PPOB catalog entries are name/barcode/category only — `ProductController` treats `buy_price`/`sell_price` as nullable for `product_type=ppob` (defaults 0); `Products/Create.jsx` and `Edit.jsx` hide price fields and submit 0. Real cost is `ppob_cost` at POS; profit is `admin_fee × qty`.  
**Key Learning**: Do not require catalog prices for PPOB; image is also optional. Default `unit` for new PPOB products is `lembar`.

### POS-013 Physical product pricing via UOM table (2026-06-18) ✅ COMPLETE

**Challenge/Decision**: Are top-level Harga Beli/Jual still needed after multi-UOM + WAC?  
**Solution**: Removed product-level **Harga Jual** from Create/Edit — prices live in `product_units`; `ProductController` syncs `products.sell_price` from default sell UOM. **Harga Beli Awal** only on create (seeds `avg_cost`); edit shows WAC + last buy read-only. Stock report uses `avg_cost` × stock; purchase validation compares against UOM sell price.  
**Key Learning**: `products.sell_price` is a denormalized fallback; source of truth for retail price is `product_units.sell_price`.

### POS-014 POS hardening (2026-06-20) ✅ COMPLETE

**Challenge/Decision**: Production readiness for checkout/payments?  
**Solution**: Added structured logging in `TransactionController` (checkout errors, Snap failures, Midtrans callbacks). Extracted `CheckoutService` for checkout/void. Added 16 PHPUnit tests (`CheckoutTest`, `MidtransCallbackTest`, `VoidTransactionTest`, `PpobBalanceServiceTest`). FormRequests: `StoreTransactionRequest`, `StoreCartRequest`, `UpdateCartRequest`. Login throttle `5/min`. Removed duplicate logout route. `.env.example` MySQL-first + `MIDTRANS_*` vars.  
**Key Learning**: Run `php artisan test` before deploy; tests use SQLite `:memory:` while local dev should use MySQL for concurrent cashier locking.

### POS-015 Product Excel import (2026-06-26) ✅ COMPLETE

**Challenge/Decision**: How to bulk-load inventory without manual product create?  
**Solution**: `ProductImportController` + `ProductsImport` (Maatwebsite Excel) on Products index. Create-only by barcode; single base UOM per row auto-mapped to `product_units`. Template at `GET /account/products/import/template`; upload at `POST /account/products/import`. Uses `products.create` permission.  
**Key Learning**: Category auto-created by name; unit abbreviation must pre-exist in `units`. Opening stock creates `stock_movements` with note "Stok awal import." Duplicate barcodes in file or DB are skipped with row-level error summary in flash.

### POS-016 Service products with BOM (2026-06-26) ✅ COMPLETE

**Challenge/Decision**: How to sell laminating/print/fotocopy that consume paper/film while keeping inventory and COGS accurate?  
**Solution**: New `product_type=service` with `product_components` recipe table. Services sold at fixed catalog price; checkout deducts physical component stock and computes COGS from component `avg_cost`. Void reverses all `stock_movements` for the transaction (not detail-by-detail). Stock report scoped to `physical()` only.  
**Key Learning**: Components must be `physical` products. Service keeps one base/default-sell `product_unit` for cart compatibility. Key files: `CheckoutService`, `ProductController`, `CartController`, `ProductComponentBuilder.jsx`, migration `create_product_components_table`.

### POS-017 PPOB balance shared across concurrent shifts (2026-07-14) ✅ COMPLETE

**Challenge/Decision**: Two cashiers with different Kas drawers but the same PPOB account, open at the same time — how to reconcile PPOB balance per shift?  
**Solution**: You can't — it's one shared pool, not physically separable like cash drawers. `ppob_opening_balance` is now auto-captured from `PpobAccount.current_balance` (no cashier input); `ppob_closing_balance` manual input removed from shift close. Per-shift `ppob_expected_balance` still shown but is informational only (sums `ppob_balance_logs` by `cashier_shift_id`, correctly isolates each shift's own sales/top-ups even under concurrency). Physical balance verification against the provider app now happens only at `/account/ppob-balance-logs` (Top Up / Adjustment), which already locks the account row (`lockForUpdate()`) so concurrent sales never lose an update.  
**Key Learning**: Don't try to make PPOB "expected vs actual" per-shift like Kas — that only makes sense for physically separate drawers. See `docs/decisions.md` "PPOB balance reconciliation moved to account-level" (2026-07-14).

### POS-016 Font Awesome version conflict (2026-06-26) ✅ COMPLETE

**Challenge/Decision**: Sidebar icons (`fa-shield-alt`, `fa-store`, etc.) showed empty boxes or wrong glyphs.  
**Solution**: `app.blade.php` was loading FA 4.7 **after** FA 5.15.4, overriding the FA5 font. Removed FA4; load FA5 `all.min.css` + `v4-shims.min.css` in blade. All React icons migrated from legacy `fa fa-*` to FA5 `fas fa-*` / `far fa-*` (outline icons like file-excel, clock).  
**Key Learning**: Do not mix FA4 and FA5. Icons like `fa-store` and `fa-shield-alt` are FA5-only — they break if FA4 CSS loads last.

### POS-017 SQLite tanpa sudo (2026-07-20) ✅ COMPLETE

**Challenge/Decision**: `php artisan migrate` gagal `could not find driver` karena `php8.5-sqlite3` belum terpasang dan sudo tidak tersedia di environment agent.  
**Solution**: Paket `.so` diunduh via `apt-get download php8.5-sqlite3` ke `.php-ext/` (gitignored). Wrapper `./pos_kasir` menjalankan artisan dengan extension flags. PHPUnit: `php -d extension=pdo -d extension=$PWD/.php-ext/sqlite3.so -d extension=$PWD/.php-ext/pdo_sqlite.so vendor/bin/phpunit`. Produksi/dev permanen: `sudo apt-get install -y php8.5-sqlite3`.  
**Key Learning**: `.env` default SQLite (`database/database.sqlite`); jalankan `./pos_kasir migrate --seed` setelah clone jika extension sistem belum ada.

### POS-018 Cart optimistic UI + diskon per item (2026-07-21) ✅ COMPLETE

**Challenge/Decision**: Remaining gaps from `docs/rekomendasi-pos-laporan.md`.  
**Solution**: POS uses local cart state with rollback on Inertia error; line discount via `carts.discount`/`discount_type` → `transaction_details.discount_amount` at checkout (`Cart::lineNet()`). Export Excel added for product-sales/PPOB/expense/customers. Sales report filters/summary include `qris`/`transfer`.  
**Key Learning**: Order-level discount applies on top of sum of line nets. Deferred: split payment, EDC, PWA/offline.


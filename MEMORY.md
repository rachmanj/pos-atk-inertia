**Purpose**: AI's persistent knowledge base for project context and learnings  
**Last Updated**: 2026-06-20 (POS hardening: CheckoutService, tests, logging, MySQL default)

---

## Project Memory Entries

### POS-001 Project identity (2026-06-18) ✅ COMPLETE

**Challenge/Decision**: What is this repo?  
**Solution**: Indonesian retail POS ("POS Kasir") — Laravel 12 + Inertia/React monolith with inventory, purchasing, shifts, Midtrans payments.  
**Key Learning**: Read `docs/architecture.md` first; all business routes live under `/account/*` with Spatie permissions.

### POS-002 Local dev & credentials (2026-06-18) ✅ COMPLETE

**Challenge/Decision**: How to run and log in locally?  
**Solution**: `composer dev` (serve + queue + pail + vite). Seed: `php artisan migrate --seed`. Users: `admin@gmail.com` / `kasir@gmail.com`, password `password`. App URL: `http://127.0.0.1:8000` (not 3000).  
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


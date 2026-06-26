**Purpose**: Track current work and immediate priorities  
**Last Updated**: 2026-06-20

---

# Current Tasks

## Working On Now

_(none)_

## Up Next (This Week)

_(none — see backlog for future items)_

## Blocked/Waiting

_(none)_

## Recently Completed

- `[done] P0: POS hardening — logging, CheckoutService, feature tests, FormRequests, MySQL default [TransactionController, CheckoutService, tests/, .env.example] (completed: 2026-06-20)`
- `[done] P1: Add MIDTRANS_* vars to .env.example [config/midtrans.php] (completed: 2026-06-20)`
- `[done] P2: Remove duplicate logout route [routes/web.php] (completed: 2026-06-20)`
- `[done] P0: Physical product pricing — UOM table only, opening buy on create, WAC on edit [ProductController, Create/Edit, StockReport] (completed: 2026-06-18)`
- `[done] P0: PPOB product create — nullable catalog buy/sell price [ProductController, Products/Create.jsx, Edit.jsx] (completed: 2026-06-18)`
- `[done] P0: Multi-UOM, WAC inventory valuation, PPOB catalog + saldo ledger [units, product_units, ppob_accounts, ppob_balance_logs, POS modal] (completed: 2026-06-18)`
- `[done] P0: Fix Midtrans callback profit + status fields [TransactionController::callback()] (completed: 2026-06-18)`
- `[done] P1: Initial codebase documentation in docs/ + MEMORY.md [architecture, decisions, backlog, todo] (completed: 2026-06-18)`

## Quick Notes

- Default dev URL is `http://127.0.0.1:8000` (Laravel serve), not port 3000.
- Run tests: `php artisan test` (SQLite in-memory; 16 tests as of 2026-06-20).
- `.env.example` now defaults to MySQL (`pos_kasir`); create DB before `php artisan migrate --seed`.
- Seeded login: `admin@gmail.com` / `kasir@gmail.com`, password `password`.

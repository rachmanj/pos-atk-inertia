**Purpose**: Record technical decisions and rationale for future reference  
**Last Updated**: 2026-07-23 (Ant Design migration complete)

# Technical Decision Records

---

## Decision: Laravel + Inertia + React monolith — 2026-06-18

**Context**: Need a POS system with rich UI (product grid, cart, reports) without maintaining a separate API layer.

**Options Considered**:

1. **Laravel + Blade**: Simpler stack, weaker interactive POS UX.
2. **Laravel API + SPA (React)**: Clean separation, more boilerplate for auth and routing.
3. **Laravel + Inertia + React**: Server-driven routing with React components.

**Decision**: Laravel 12 + Inertia.js 3 + React 19.

**Rationale**: Single codebase, session auth works naturally, controllers return `Inertia::render()` with typed props. Fits CRUD-heavy admin + interactive POS.

**Implementation**: `resources/js/Pages/**`, `HandleInertiaRequests` shared props, Vite entry `resources/js/app.jsx`.

**Review Date**: 2026-12-18

---

## Decision: Spatie Permission for RBAC — 2026-06-18

**Context**: Multiple staff roles (admin vs cashier) with granular feature access.

**Options Considered**:

1. **Custom roles table + gates**: More control, more maintenance.
2. **Spatie Laravel Permission**: Battle-tested, middleware aliases.

**Decision**: Spatie with permission strings like `transactions.create`, `reports.sales`.

**Rationale**: Permissions seeded once; routes use `middleware('permission:...')`; frontend receives flat `auth.permissions` map for menu gating.

**Implementation**: `bootstrap/app.php` aliases, `PermissionsTableSeeder`, `RolesTableSeeder`, `User::getPermissionArray()`.

**Review Date**: 2026-12-18

---

## Decision: Integer IDR amounts (no decimals) — 2026-06-18

**Context**: Indonesian Rupiah has no fractional unit in retail POS.

**Decision**: All prices, totals, refunds, and expenses stored as `bigInteger` / `integer` in DB; Eloquent casts to `integer`.

**Rationale**: Avoids floating-point rounding errors; matches Midtrans integer `gross_amount`.

**Implementation**: `products.buy_price/sell_price`, `transactions.grand_total`, `profits.*`, etc.

**Review Date**: N/A (stable convention)

---

## Decision: Stock deducted at checkout, not at payment confirmation — 2026-06-18

**Context**: Digital payments via Midtrans are asynchronous.

**Decision**: Stock is decremented when the transaction is created (both cash and digital). Digital transactions start as `pending` until callback.

**Rationale**: Prevents overselling while customer completes payment; cart is cleared immediately.

**Trade-off**: Failed/expired digital payments leave stock reduced unless a reversal job is added (not implemented).

**Implementation**: `TransactionController@store` — stock movement before Snap token.

**Review Date**: 2026-09-18

---

## Decision: Cashier shift required before POS — 2026-06-18

**Context**: Need cash drawer accountability and shift-level reporting.

**Decision**: `User::activeCashierShift()` must exist to access POS; one open shift per user (`status=open`).

**Rationale**: Enables expected vs actual cash on close; dashboard shows live shift metrics.

**Implementation**: `TransactionController@create`, `CashierShiftController`, `cashier_shifts` table.

**Review Date**: 2026-12-18

---

## Decision: Polymorphic stock_movements audit log — 2026-06-18

**Context**: Stock changes originate from sales, purchases, returns, voids, adjustments, opname.

**Decision**: Central `stock_movements` table with `reference_type` + `reference_id` (Eloquent class name + id).

**Rationale**: Single audit trail for stock report; each movement records `stock_before` / `stock_after`.

**Implementation**: Written in `TransactionController`, `PurchaseController`, `ReturnTransactionController`, `StockMovementController`, etc.

**Review Date**: N/A

---

## Decision: Midtrans Snap for digital payments — 2026-06-18

**Context**: Indonesian market standard for QRIS, e-wallets, cards.

**Decision**: `midtrans/midtrans-php` Snap token on checkout; webhook at `POST /midtrans/callback` (CSRF exempt).

**Rationale**: Hosted payment UI reduces PCI scope; signature verification on callback.

**Implementation**: `config/midtrans.php`, `TransactionController::createMidtransSnapToken()`, `callback()`.

**Review Date**: 2026-09-18 (after production payment testing)

---

## Decision: Bootstrap + Tailwind coexistence — 2026-06-18

**Context**: Admin template uses Bootstrap sidebar/layout; Tailwind added via Vite plugin.

**Decision**: React-Bootstrap components + Bootstrap CSS classes in layouts; Tailwind available in `app.css`.

**Rationale**: Existing SB Admin-style layout (`Account.jsx`, `Sidebar.jsx`); incremental styling without full rewrite.

**Status**: **Superseded** by Ant Design migration (2026-07-23). See decision below.

**Review Date**: 2026-12-18

---

## Decision: Ant Design as primary UI framework — 2026-07-23

**Context**: Bootstrap 5 + React-Bootstrap + Font Awesome + SweetAlert2 + SB Admin 2 CSS created a fragmented stack. Need consistent enterprise UI for POS and admin modules.

**Options Considered**:

1. **Keep Bootstrap, polish incrementally**: Low migration cost, inconsistent component APIs.
2. **Ant Design phased migration**: Higher upfront effort, unified Table/Form/Modal/Layout.

**Decision**: Ant Design 6.x + `@ant-design/icons` via `ConfigProvider` and `zenTheme` in `resources/js/app.jsx`. Tailwind retained for POS grid and login page utilities only.

**Rationale**: Single component library; `Modal.confirm` + `notification` replace SweetAlert2; layout shell uses `Layout.Sider` + `Menu`. Phased migration (5 phases) completed without big-bang POS rewrite — POS split into `resources/js/Components/Pos/*` first.

**Implementation**: Removed `bootstrap`, `react-bootstrap`, `sweetalert2` from `package.json`; removed Font Awesome and SB Admin 2 CDN from `resources/views/app.blade.php`. Plan: `docs/migration-antd.md`.

**Review Date**: 2027-01-23

---

## Decision: Multi-UOM with base-unit stock — 2026-06-18

**Context**: Retail sells same SKU in pcs, box, lusin, etc. with different prices.

**Decision**: Master `units` table + `product_units` per product (`conversion_factor`, `sell_price`, one `is_base_unit`, one `is_default_sell`). `products.stock` always in base units.

**Rationale**: Single stock number; purchases and sales convert qty via `conversion_factor` on line items.

**Implementation**: `PurchaseController`, `CartController`, `TransactionController`, `ProductUnitBuilder.jsx`, migrations `2026_06_18_*`.

**Review Date**: 2026-12-18

---

## Decision: Weighted average cost (WAC) for COGS — 2026-06-18

**Context**: Need consistent cost of goods for profit reports without full FIFO lot tracking.

**Decision**: `products.avg_cost` updated on each purchase: `(stock_before × avg_cost + qty_base × cost_base) / stock_after`. Sale COGS uses `avg_cost` per base unit on physical lines.

**Rationale**: Simpler than FIFO layers; matches small-retail expectations. `buy_price` remains last purchase price for display.

**Implementation**: `PurchaseController@store`, `TransactionController@store` (physical details).

**Review Date**: 2026-09-18

---

## Decision: PPOB pricing at POS, not in catalog — 2026-06-18

**Context**: PPOB items (token listrik, pulsa, tagihan) have variable provider cost; cashier reads cost from external PPOB app at sale time.

**Decision**:

1. **Catalog**: `product_type=ppob` — no required `buy_price`/`sell_price` (default 0); optional image.
2. **POS**: Required `ppob_cost` + `admin_fee` per line; optional `customer_ref`.
3. **Profit**: `admin_fee × qty` (toko margin); default fee from `settings.ppob_admin_fee`.
4. **Saldo**: `PpobBalanceService` debits `ppob_cost × qty` from active `ppob_accounts` on checkout.

**Rationale**: Provider cost changes frequently; catalog is a product label only.

**Implementation**: `ProductController` (nullable prices for ppob), `CartController`, `TransactionController`, `Products/Create.jsx`, `Transactions/Create.jsx` PPOB modal.

**Review Date**: 2026-12-18

---

## Decision: Physical sell prices in product_units only — 2026-06-18

**Context**: Multi-UOM added per-UOM sell prices; top-level `products.sell_price` duplicated the default UOM and confused admins.

**Decision**: Admin UI edits sell prices only in `product_units`. `ProductController` syncs `products.sell_price` from the default sell UOM row. Opening `buy_price` on create seeds WAC; after purchases, `avg_cost` is read-only on edit.

**Rationale**: Single source of truth per UOM; legacy column kept for fallback queries and product list denormalization.

**Implementation**: `ProductController`, `Products/Create.jsx`, `Edit.jsx`, `StockReportController` (valuation via `avg_cost`).

**Review Date**: 2026-12-18

---

## Decision: CheckoutService for POS domain logic — 2026-06-20

**Context**: `TransactionController@store` and `@void` contained ~230 lines of stock, profit, and PPOB logic; no automated tests existed.

**Decision**: Extract checkout and void into `App\Services\CheckoutService`; controller handles HTTP, validation, Midtrans Snap, and logging.

**Rationale**: Testable domain layer (mirrors `PpobBalanceService`); controller stays thin; `DomainException` for business rule failures.

**Implementation**: `CheckoutService::checkout()`, `CheckoutService::void()`, injected into `TransactionController`. Feature tests in `tests/Feature/CheckoutTest.php`, `VoidTransactionTest.php`.

**Review Date**: 2026-12-20

---

## Decision: MySQL as default local/production DB — 2026-06-20

**Context**: `.env.example` defaulted to SQLite; concurrent cashiers + `lockForUpdate()` on checkout serialize poorly on SQLite.

**Decision**: `.env.example` defaults to MySQL (`pos_kasir` database). PHPUnit continues using SQLite `:memory:` via `phpunit.xml`.

**Rationale**: Production-like concurrency for multi-cashier POS; aligns with `.cursorrules` MySQL MCP preference.

**Implementation**: `.env.example` `DB_CONNECTION=mysql`; `phpunit.xml` unchanged.

**Review Date**: N/A

---

## Decision: FormRequest classes for checkout/cart validation — 2026-06-20

**Context**: Validation rules were inlined in controllers across 23 actions.

**Decision**: Introduce `StoreTransactionRequest`, `StoreCartRequest`, `UpdateCartRequest` for money-path endpoints first.

**Rationale**: Centralizes rules; PPOB conditional validation in `StoreCartRequest::withValidator()`; easier to extend messages.

**Implementation**: `TransactionController@store`, `CartController@store`/`update`.

**Review Date**: 2026-09-20 (extend to remaining controllers as touched)

---

## Decision: Service products with Bill of Materials (BOM) — 2026-06-26

**Context**: Store sells services (laminating, print, fotocopy) that consume raw materials (paper, laminating film). Existing types were `physical` (own stock) and `ppob` (dynamic price, no stock).

**Options Considered**:

1. **Manual material lines at POS**: Cashier adds paper/film separately — no code change, poor UX, easy to forget.
2. **PPOB-style dynamic pricing**: Wrong model; services have fixed prices, not provider cost entry.
3. **Service SKU + BOM recipe**: Sell one service product; auto-deduct components on checkout.

**Decision**: Option 3 — `product_type=service` + `product_components` table.

**Rationale**: Reuses existing `stock_movements`, WAC, and profit reporting. Raw materials stay normal physical products for purchasing/opname. COGS = sum(component WAC × recipe qty). Void restores from `stock_movements` audit trail (robust if recipe changes later).

**Implementation**: `ProductComponent` model, `CheckoutService` service branch, `ProductController` recipe sync, `ProductComponentBuilder.jsx`, POS grid shows component availability hints.

**Review Date**: 2026-12-26

---

## Decision: PPOB balance reconciliation moved to account-level, not per-shift — 2026-07-14

**Context**: One `ppob_accounts` row (one provider app/wallet) can be used by multiple cashiers with different, concurrently open `cashier_shifts`. Unlike Kas (physically separate cash drawers per cashier), the PPOB balance is one shared pool. The prior UI asked each cashier to type an "actual" PPOB balance at shift open/close and compared it against a per-shift "expected" total computed only from that shift's own logs — producing a false discrepancy whenever another concurrently open shift also transacted PPOB in the meantime.

**Options Considered**:

1. **Time-window based expected balance**: Sum all `ppob_balance_logs` for the account within the shift's open/close window instead of filtering by `cashier_shift_id`. Rejected — overlapping shifts would double count the same movements and still can't be verified against one physical count taken at two different times by two different people.
2. **Lock the PPOB account to one active shift at a time**: Rejected — too restrictive for stores that intentionally run multiple concurrent cashiers on the same PPOB app.
3. **Account-level reconciliation (chosen)**: Keep per-shift PPOB numbers as informational-only (this shift's own top-ups/sales via `cashier_shift_id`), stop asking cashiers to enter/verify an "actual" balance per shift, and do physical balance verification as an account-wide activity via the existing Top Up / Adjustment flow on `/account/ppob-balance-logs`.

**Decision**: Option 3. `ppob_opening_balance` is auto-captured from `PpobAccount.current_balance` at shift open (no manual input). `ppob_closing_balance` is no longer collected on shift close. `ppob_expected_balance` remains as "this shift's contribution" for shift-level reporting only. Sales/top-up movements still stay race-safe via `lockForUpdate()` in `CheckoutService` and `PpobBalanceLogController` (already in place).

**Rationale**: Reconciling a shared resource per-shift is not physically meaningful when it's touched concurrently by other shifts; the account-level ledger (`ppob_balance_logs`) already gives an accurate running balance and audit trail regardless of which/how many shifts are open.

**Implementation**: `CashierShiftController@store/close` (auto-capture, drop closing input), `CashierShifts/Create.jsx` + `Show.jsx` (remove manual PPOB balance inputs, add explanatory copy), `Ppob/BalanceLogs/Index.jsx` (surface current system balance per account as the reconciliation entry point).

**Review Date**: 2027-01-14

---

## Decision: "Tinta & Nota" — SEMANTIC palette harmonization + login page identity — 2026-08-25

**Context**: The "Tinta & Nota" theme (`docs/design-vasia-pos-redesign.md`) shipped to POS/Dashboard in commit `b0405ab`, but two things were left on the old stock palette: `SEMANTIC` colors (`success`/`warning`/`error`/`info`) were still generic Tailwind-stock hex (`#22c55e`/`#f59e0b`/`#ef4444`/`#3b82f6`), and the login page still used the pre-redesign slate→teal gradient.

**Options Considered (SEMANTIC)**: Keep stock colors (rejected — visually clashes with the muted ink palette); make warning share a hue family with `ACCENT.highlighter` (`#FF6A2E`, rejected — warning tags would be confused with the "Bayar" CTA); invent unrelated new hues (rejected — would add brand hues beyond the "1 primary + 1 accent" gate).

**Decision**: `SEMANTIC` now derives from the same ink family as `BRAND.primary`: `success = #2F6F4E` (deep ink/forest green), `warning = #8F5F22` (muted deep amber/mustard — hue ~34°, clearly separated from the ~17° stabilo orange and darker/less saturated so it never reads as the pay button), `error = #8B2E3B` (deep wine-red ink), `info = #2A3B8F` (identical to `BRAND.primary`, per spec's primary option). All four checked ≥4.5:1 contrast against both `#FFFFFF` and `#EFEDE3` for normal text. Hardcoded duplicate literals of the old stock hexes (`zenTheme.js` AntD tokens, a few inline button/text styles in `Transactions/Show.jsx`, `PosPaymentSummary.jsx`, `Ppob/BalanceLogs/Index.jsx`, `Products/Edit.jsx`, `Products/Index.jsx`, and `app.css` `.pos-product-empty`/`.pos-cart-delete`) were updated to match — components that already import `SEMANTIC` from `colors.js` needed no changes.

**Decision (Login page)**: Background = dark ink-blue gradient (`#10143A → #1F2C6E → #2A3B8F`), representing the cover of an Indonesian school notebook ("sampul buku tulis") rather than the in-app "kertas kerja" background (`#EFEDE3`), so the login screen reads as the "toko's front cover" and the post-login app reads as "kertas kerja di dalamnya" — two distinct but related surfaces of the same ink/paper metaphor. Form card stays white/kanvas per the WCAG-AA card requirement. The lone "Masuk" CTA uses solid `#FF6A2E` (stabilo), consistent with the rule that stabilo orange is reserved for the primary action (mirrors `.pos-pay-button`). One signature accent (`.pos-login-torn`, a small torn-nota strip) sits under the brand header — the only place the torn-receipt signature appears on this page. Fixed a pre-existing dead-CSS bug in the process: `.pos-login-input i` / `.pos-login-card-icon i` / `.pos-login-button i` selectors never matched anything post-AntD-icon-migration (icons render as `<span class="anticon">`, not `<i>`); added `.anticon` selectors alongside so icon tinting actually applies.

**Rejected alternative**: Light kertas-buram background for login. Would have been visually identical to the in-app background, losing the "storefront/cover vs. workspace" distinction and making the login screen feel like an unfinished/blank internal page rather than a deliberate entry point.

**Implementation**: `resources/js/theme/colors.js` (`SEMANTIC`), `resources/js/theme/zenTheme.js` (now imports `SEMANTIC` instead of duplicating hexes), `resources/css/app.css` (`.pos-login-*` block, `.pos-product-empty`, `.pos-cart-delete`), `resources/js/Pages/Auth/Login.jsx` (added `.pos-login-torn` accent div only — form structure untouched), plus the inline-hex call sites listed above.

**Review Date**: 2027-02-25

**Review Date**: 2026-10-14

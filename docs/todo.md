**Purpose**: Track current work and immediate priorities  
**Last Updated**: 2026-07-23

---

# Current Tasks

## Working On Now

### Integrasi Telegram Bot (PPOB)

**Status**: Rencana teknis selesai — menunggu keputusan open questions  
**Plan**: `docs/plan-telegram-integration.md`  
**Goal**: Kasir kirim perintah teks (contoh: `beli meterai 100 lembar di Kantor Pos sebesar 1jt`) → parse → transaksi PPOB via `CheckoutService` → balasan konfirmasi.  
**Blockers / keputusan dulu**: total vs harga per unit (#1), konfirmasi sebelum commit (#3), refactor `checkoutFromLines` vs hold-cart (#7).

---

### Quick menu search / navigation (command palette)

**Status**: Planning complete — ready to implement  
**Goal**: Fast, keyboard-first navigation to sidebar menu items from any authenticated page — like VS Code `Ctrl+P`. Type a few letters, find the menu item, press Enter to navigate. **Menu-only — no product search.**

---

#### Options evaluated

| Approach | Fit | Discoverability | Complexity | Notes |
|----------|------|-----------------|------------|-------|
| **1. Ctrl+K command palette (chosen)** | High — hands stay on keyboard | Medium — needs hint | Low | Pure client-side, no API; matches VS Code muscle memory |
| **2. Search box in navbar/sidebar** | High — always visible, mouse-friendly | High | Low | Persistent UI real estate; filters in-place |
| **3. Both** | High | Highest | Medium | Palette for keyboard users + optional navbar search icon for discoverability |

---

#### Chosen approach: Ctrl+K command palette (option 1)

**Rationale**

1. **VS Code muscle memory**: Ctrl+P / Ctrl+K is the standard "quick open" pattern most developers already know. Zero learning curve for technical users; easy to teach cashiers ("Ctrl+K, type what you want, Enter").
2. **No backend needed**: The sidebar has only ~21 menu items across 8 groups — all permission-gated client-side. No API endpoint to build, no network latency, no debounce complexity.
3. **Does not fight existing patterns**: Keep `Shared/Search.jsx` for page-level product/user/category filtering. Keep POS search bar for product grid. This is purely navigation — no data search at all.
4. **Layout**: Mount the palette once in `Account.jsx`. Navbar trigger is a small button/icon (`🔍` or `⌘K`) between sidebar toggle and user dropdown. Zero persistent chrome when closed.
5. **Stack**: Bootstrap modal + Tailwind overlay. Same SB Admin shell; no new library. Indonesian labels.

**What it searches** (the actual sidebar menu items from `resources/js/Components/Sidebar.jsx`):

| Group | Menu Label (ID) | Permission | Route |
|-------|----------------|------------|-------|
| — | Dashboard | `dashboard.index` | `/account/dashboard` |
| Pengaturan Sistem | Role | `roles.index` | `/account/roles` |
| Pengaturan Sistem | User | `users.index` | `/account/users` |
| Pengaturan Sistem | Store Settings | `settings.index` | `/account/settings` |
| Master Data | Category | `categories.index` | `/account/categories` |
| Master Data | Suppliers | `suppliers.index` | `/account/suppliers` |
| Master Data | Customers | `customers.index` | `/account/customers` |
| Master Data | Produk | `products.index` | `/account/products` |
| Master Data | Satuan | `units.index` | `/account/units` |
| PPOB | Akun PPOB | `ppob-accounts.index` | `/account/ppob-accounts` |
| PPOB | Riwayat Saldo | `ppob-balance-logs.index` | `/account/ppob-balance-logs` |
| Inventory | Mutasi Stok | `stock_movements.index` | `/account/stock-movements` |
| Inventory | Stock Opname | `stock_opnames.index` | `/account/stock-opnames` |
| Transaksi Supplier | Pembelian Supplier | `purchases.index` | `/account/purchases` |
| Transaksi Supplier | Retur Supplier | `supplier_returns.index` | `/account/supplier-returns` |
| Penjualan | Shift Kasir | `cashier_shifts.index` | `/account/cashier-shifts` |
| Penjualan | POS Kasir | `transactions.create` | `/account/transactions/create` |
| Penjualan | Riwayat Transaksi | `transactions.index` | `/account/transactions` |
| Penjualan | Retur Customer | `returns.index` | `/account/returns` |
| Penjualan | Pengeluaran | `expenses.index` | `/account/expenses` |
| Laporan | Laporan Penjualan | `reports.sales` | `/account/reports/sales` |
| Laporan | Laporan Laba | `profits.index` | `/account/reports/profit` |
| Laporan | Laporan Stok | `reports.stock` | `/account/reports/stock` |

**Search behavior**: Match against menu label AND group name. Example: typing `"lapo"` → shows "Laporan Penjualan", "Laporan Laba", "Laporan Stok". Typing `"penj"` → shows "Penjualan" group header + "Laporan Penjualan", "Pembelian Supplier" (partial match on `penj` in `penjualan`). Typing `"pos"` → "POS Kasir".

**Out of scope (deliberately excluded)**

- Product search (use `Shared/Search.jsx` on Products page or POS grid search)
- Transaction, purchase, expense data search
- Fuzzy ranking libraries (Fuse.js / Algolia) — simple `toLowerCase().includes()` is sufficient for 21 items
- Replacing any existing search component

---

#### Implementation design (100% client-side, no API)

**Data source**: Extract menu definitions into a shared static config:

```js
// resources/js/Utils/navMenu.js
export const NAV_MENUS = [
  { id: 'dashboard',     label: 'Dashboard',           group: null,                   permission: 'dashboard.index',          href: '/account/dashboard' },
  { id: 'roles',         label: 'Role',                group: 'Pengaturan Sistem',    permission: 'roles.index',              href: '/account/roles' },
  { id: 'users',         label: 'User',                group: 'Pengaturan Sistem',    permission: 'users.index',              href: '/account/users' },
  { id: 'settings',      label: 'Store Settings',      group: 'Pengaturan Sistem',    permission: 'settings.index',           href: '/account/settings' },
  { id: 'categories',    label: 'Category',            group: 'Master Data',          permission: 'categories.index',         href: '/account/categories' },
  { id: 'suppliers',     label: 'Suppliers',           group: 'Master Data',          permission: 'suppliers.index',          href: '/account/suppliers' },
  { id: 'customers',     label: 'Customers',           group: 'Master Data',          permission: 'customers.index',          href: '/account/customers' },
  { id: 'products',      label: 'Produk',              group: 'Master Data',          permission: 'products.index',           href: '/account/products' },
  { id: 'units',         label: 'Satuan',              group: 'Master Data',          permission: 'units.index',              href: '/account/units' },
  { id: 'ppob-accounts', label: 'Akun PPOB',           group: 'PPOB',                 permission: 'ppob-accounts.index',      href: '/account/ppob-accounts' },
  { id: 'ppob-logs',     label: 'Riwayat Saldo',       group: 'PPOB',                 permission: 'ppob-balance-logs.index',  href: '/account/ppob-balance-logs' },
  { id: 'stock-mv',      label: 'Mutasi Stok',         group: 'Inventory',            permission: 'stock_movements.index',    href: '/account/stock-movements' },
  { id: 'stock-opname',  label: 'Stock Opname',        group: 'Inventory',            permission: 'stock_opnames.index',      href: '/account/stock-opnames' },
  { id: 'purchases',     label: 'Pembelian Supplier',  group: 'Transaksi Supplier',   permission: 'purchases.index',          href: '/account/purchases' },
  { id: 'supplier-ret',  label: 'Retur Supplier',      group: 'Transaksi Supplier',   permission: 'supplier_returns.index',   href: '/account/supplier-returns' },
  { id: 'shifts',        label: 'Shift Kasir',         group: 'Penjualan',            permission: 'cashier_shifts.index',     href: '/account/cashier-shifts' },
  { id: 'pos',           label: 'POS Kasir',           group: 'Penjualan',            permission: 'transactions.create',      href: '/account/transactions/create' },
  { id: 'transactions',  label: 'Riwayat Transaksi',   group: 'Penjualan',            permission: 'transactions.index',       href: '/account/transactions' },
  { id: 'returns',       label: 'Retur Customer',      group: 'Penjualan',            permission: 'returns.index',            href: '/account/returns' },
  { id: 'expenses',      label: 'Pengeluaran',         group: 'Penjualan',            permission: 'expenses.index',           href: '/account/expenses' },
  { id: 'report-sales',  label: 'Laporan Penjualan',   group: 'Laporan',              permission: 'reports.sales',            href: '/account/reports/sales' },
  { id: 'report-profit', label: 'Laporan Laba',        group: 'Laporan',              permission: 'profits.index',            href: '/account/reports/profit' },
  { id: 'report-stock',  label: 'Laporan Stok',        group: 'Laporan',              permission: 'reports.stock',            href: '/account/reports/stock' },
];
```

**Filtering logic** (pure client-side, instant — no debounce needed):

```js
const query = input.toLowerCase().trim();
const visible = NAV_MENUS.filter(m => {
  if (!hasAnyPermission([m.permission], permissions)) return false;
  if (!query) return true;
  return m.label.toLowerCase().includes(query)
      || (m.group && m.group.toLowerCase().includes(query));
});
```

**Components**:

| Piece | Path | Role |
|-------|------|------|
| Menu catalog | `resources/js/Utils/navMenu.js` (new) | Single source of truth for menu definitions — reused by both palette and (optionally later) `Sidebar.jsx` |
| Palette | `resources/js/Components/MenuSearch/MenuSearchPalette.jsx` (new) | Overlay modal with text input + filtered result list. Focus trap, Esc close. Mounted in `Account.jsx`. |
| Navbar trigger | `resources/js/Layouts/Account.jsx` (modify) | Small button/icon in navbar center: `⌘K` badge or magnifying glass icon. Click opens palette. |
| Styles | `resources/css/app.css` (modify if needed) | Minimal overlay/backdrop CSS. Prefer Bootstrap `modal` + `list-group` patterns. |

**Do NOT modify**:
- `Sidebar.jsx` (v1 — extract navMenu separately; future refactor to consume `navMenu.js` can be a follow-up)
- `Shared/Search.jsx`
- Any page-level search or POS search bar
- No backend routes, controllers, or API endpoints

---

#### Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` / `Cmd+K` | Toggle / open palette (preventDefault so browser address bar doesn't steal it) |
| `Esc` | Close palette; restore focus to trigger button |
| `ArrowDown` / `ArrowUp` | Move highlight through results |
| `Enter` | Navigate to highlighted menu's `href` via `router.visit()` |
| Type while open | Filter results instantly (no debounce — 21 items is trivially fast) |

**Discoverability**:
- Navbar trigger button shows `⌘K` or `Ctrl+K` badge (detect Mac via `navigator.platform`)
- Placeholder text: `Cari menu…` (Indonesian)
- Optional: empty state shows all permitted menus grouped

**Conflict handling**:
- Don't open palette if a Bootstrap modal or SweetAlert2 dialog is already open
- Don't open if focus is in a `<input>`, `<textarea>`, or `[contenteditable]` (prevents interfering with POS barcode scanner or form fields)
- On mobile, same palette opens via navbar button tap

---

#### Files to create / modify

**Create**:
- `resources/js/Utils/navMenu.js` — static menu definitions (21 items, 8 groups)
- `resources/js/Components/MenuSearch/MenuSearchPalette.jsx` — overlay + input + result list

**Modify**:
- `resources/js/Layouts/Account.jsx` — add navbar trigger button + mount `<MenuSearchPalette />`

**Leave alone** (no changes):
- `Sidebar.jsx`
- `Shared/Search.jsx`
- `routes/web.php`
- All backend controllers

**Documentation updates after ship**:
- `docs/decisions.md` — decision record for menu command palette
- `MEMORY.md` — shortcut + "Ctrl+K opens menu search, no product search"
- `docs/architecture.md` — short note under Frontend Patterns

---

#### Implementation steps (suggested order)

1. Create `navMenu.js` with all 23 menu entries matching `Sidebar.jsx` labels, hrefs, permissions.
2. Build `MenuSearchPalette.jsx` — overlay modal, text input, filtered list with group headers, keyboard nav, Enter → `router.visit(href)`.
3. Add navbar trigger button to `Account.jsx` between sidebar toggle and user dropdown. Wire Ctrl+K listener.
4. Test as `admin` (all menus) and `kasir` (restricted menus) — verify permission filtering.
5. Mobile smoke test — tap trigger, type, tap menu, navigate.
6. Update docs (decisions, MEMORY, architecture).

---

#### Edge cases

| Case | Behavior |
|------|----------|
| Empty query | Show all permitted menus grouped (like a compact sidebar) |
| No matching menus | Show "Tidak ada menu yang cocok" empty state |
| User has zero permissions | Palette opens but shows only Dashboard (always permitted) |
| Rapid Ctrl+K toggle | Debounce toggle (150ms) to avoid flash |
| Menu clicked with mouse | Works same as Enter — `router.visit(href)` |
| Current page matches menu | Still show it; selecting does nothing (or highlight as "current") |
| Concurrent Swal/modal open | Ignore Ctrl+K; guard with `document.querySelector('.swal2-container, .modal.show')` |
| Mobile / touch | No keyboard shortcut (Ctrl+K unavailable); navbar button is the only trigger |
| Duplicate labels | None exist in current sidebar; if added later, disambiguate with group prefix |

---

#### Acceptance criteria

- From any `/account/*` page, Ctrl/Cmd+K opens a centered overlay with a search input.
- Typing `"lapo"` shows all Laporan items; `"pos"` shows POS Kasir; `"peng"` shows Pengaturan Sistem group items + Pengeluaran.
- Arrow keys navigate results; Enter visits the route via Inertia `router.visit()`.
- Esc closes palette and returns focus to the trigger button.
- Only permitted menus appear (kasir sees fewer items than admin).
- `Shared/Search.jsx` and POS search bar are completely unaffected.
- UI labels are Indonesian; no English placeholder text.
- Works for both seeded `admin` and `kasir` users.

---

## Up Next (This Week)

### Migrasi UI Bootstrap → Ant Design

**Status**: Rencana teknis selesai — menunggu keputusan prioritas & branch demo  
**Plan**: `docs/migration-antd.md`  
**Goal**: Ganti UI dari Bootstrap 5 + React-Bootstrap + Font Awesome ke Ant Design 5.x + `@ant-design/icons`, sambil mempertahankan Tailwind CSS untuk utility khusus (POS grid, login page).  
**Scope**: 67 file JSX (`resources/js/Pages/Account/*`, `Components/`, `Shared/`, `Layouts/`, `Pages/Auth/Login.jsx`).  
**Effort estimate**: 13-19 hari (1 developer senior).  
**Risiko utama**: POS Kasir (`Transactions/Create.jsx`, 1350 baris) — perlu dipecah dulu ke sub-komponen.  
**Rekomendasi start**: Fase 1 = layout shell (`Account.jsx`, `Sidebar.jsx`) + Dashboard demo untuk validasi Inertia + AntD compatibility.

## Blocked/Waiting

_(none)_

## Recently Completed

- `[done] Remaining POS/laporan gaps — optimistic cart, per-item discount, export new reports, Sales qris/transfer + drill-down, Profit DatePreset [Create.jsx, CheckoutService, Exports/*, SalesReportController] (completed: 2026-07-21)`
- `[done] Auth: login with username or email; self-service change password from navbar dropdown [LoginController, PasswordController, Account.jsx] (completed: 2026-06-27)`
- `[done] Product Excel import — create-only bulk import from Products index [ProductImportController, ProductsImport, Products/Index.jsx] (completed: 2026-06-26)`
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
- Seeded login: `admin` / `admin@gmail.com` or `kasir` / `kasir@gmail.com`, password `password`.
- Menu search plan (Ctrl+K command palette) lives under **Working On Now**; implementation not started (planning only, 2026-07-14). No product search — menus only.

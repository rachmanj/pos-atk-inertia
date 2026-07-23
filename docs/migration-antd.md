# Rencana Migrasi UI: Bootstrap → Ant Design

**Dokumen ini**: Rencana teknis migrasi UI POS Kasir dari Bootstrap 5 + React-Bootstrap ke Ant Design (antd).  
**Target stack**: Laravel 12 + Inertia.js 3 + React 19 + Ant Design 6.x + Tailwind CSS 4 (utility).  
**Tanggal analisis**: 2026-07-23.  
**Status migrasi**: **Selesai** (Phase 5 polish & cleanup, 2026-07-23).  
**Analisis berdasarkan file aktual di codebase**.

---

## 1. Inventory UI Saat Ini

### 1.1 Komponen Bootstrap yang Digunakan

UI saat ini adalah gabungan:

- **Bootstrap 5 CSS** via CDN di `resources/views/app.blade.php` (baris 8, 28).
- **React-Bootstrap** hanya dipakai di 2 file: `resources/js/Layouts/Account.jsx` (`NavDropdown`) dan `resources/js/Pages/Account/Products/Index.jsx` (`Modal`, `Button`).
- **SB Admin 2 layout** via `public/assets/css/styles.css` (sidebar, navbar, wrapper).
- **Tailwind CSS 4** via Vite di `resources/css/app.css` (baris 1).
- **Font Awesome 5** via CDN di `resources/views/app.blade.php` (baris 9-10).
- **SweetAlert2** via npm di `package.json` (baris 25).

Tabel penggunaan Bootstrap class secara luas (berdasarkan grep di `resources/js/**/*.jsx`):

| Komponen Bootstrap / Class | Jumlah File Menggunakan | Lokasi Utama | Catatan |
|----------------------------|----------------------|--------------|---------|
| `card` / `card-header` / `card-body` | ~50+ file | Hampir semua halaman di `Pages/Account/*` | Wrapper panel utama; semua pakai `border-0 shadow-sm rounded-3` |
| `table` / `table-bordered` / `table-responsive` | ~50+ file | Semua halaman list/index/report | Data table dengan thead dark |
| `btn` / `btn-*` / `btn-sm` | ~50+ file | Semua halaman | Tombol aksi, submit, filter |
| `form-control` / `form-select` / `form-check` | ~40+ file | Semua form create/edit/settings | Input validasi dengan `is-invalid` |
| `alert` / `alert-*` | ~10+ file | Dashboard, POS, Purchases, Settings | Flash message & warning block |
| `badge` / `badge-*` | ~20+ file | Products, Users, Transactions, Reports | Status badge & role tag |
| `modal` / `modal-*` (raw class) | 3 file | `Transactions/Create.jsx`, custom modals | POS modal PPOB, Unit, Quick Customer |
| `NavDropdown` (React-Bootstrap) | 1 file | `Layouts/Account.jsx` | User dropdown di navbar |
| `Modal` + `Button` (React-Bootstrap) | 1 file | `Products/Index.jsx` | Import produk Excel |
| `pagination` / `page-item` | 2 file | `Shared/Pagination.jsx`, `Transactions/Create.jsx` | Pagination Laravel + POS grid |
| `input-group` / `input-group-text` | ~10+ file | Search, POS, Settings | Input dengan icon suffix/prefix |
| `row` / `col-*` / `d-flex` / `gap-*` | ~60+ file | Semua halaman | Grid & flex utility |
| SweetAlert2 (`Swal.fire`) | ~15+ file | Products, Transactions, POS, Purchases, Create forms | Konfirmasi hapus, success, error |
| Font Awesome (`fas fa-*`, `far fa-*`) | ~60+ file | Semua halaman | Icon di tombol, sidebar, heading |

### 1.2 Halaman & Kompleksitas

Total file JSX: **67 file** (57 di `Pages/Account/`, 4 di `Components/`, 4 di `Shared/`, 1 di `Layouts/`, 1 di `Pages/Auth/`).

| Halaman / Modul | Jumlah File | Kompleksitas Migrasi | Alasan |
|-----------------|-------------|----------------------|--------|
| **Layout shell** | 2 | Medium | `Account.jsx` + `Sidebar.jsx` + `MenuSearchPalette.jsx` perlu full rewrite ke `Layout.Sider` + `Menu` + `Header` |
| **Shared components** | 4 | Low-Medium | `Pagination.jsx`, `Search.jsx`, `Delete.jsx`, `DatePreset.jsx` — kecil & reusable |
| **Dashboard** | 1 | Low | Stat cards + tables sederhana di `Dashboard/Index.jsx` (371 baris) |
| **Master data simple** (Categories, Units, Suppliers, Customers, PPOB Accounts) | ~15 | Low | CRUD list + form standar |
| **Master data medium** (Products, Users, Roles) | ~10 | Medium | Multi-tab form, image upload, badges, modal import, permission |
| **POS Kasir** | 1 | **High** | `Transactions/Create.jsx` (1350 baris) — product grid, cart, payment, modals, customer search |
| **Transactions** | 2 | Medium-High | Index filter + Show detail + status badges |
| **Purchases / Supplier Returns / Stock** | ~8 | Medium | Dynamic item tables, perhitungan, select produk |
| **Customer Returns** | 3 | Medium | Restock checkbox, refund calculation |
| **Cashier Shifts** | 3 | Medium | Shift open/close + summary |
| **Reports** (Sales, Profit, Stock, ProductSales, PPOB, Expense, CustomerReport) | 7 | Medium | Filter + summary cards + table + chart (Recharts) |
| **Settings** | 1 | Low | Form konfigurasi toko |
| **Login** | 1 | Low | Custom CSS sendiri, tidak pakai Bootstrap class |

---

## 2. AntD Component Mapping

| Bootstrap | AntD Equivalent | Catatan |
|-----------|-----------------|---------|
| `Navbar` + `Sidebar` | `Layout.Sider` + `Layout.Header` + `Menu` | Struktur baru; permission gate di `items` |
| `NavDropdown` | `Dropdown` + `Space` | User menu di navbar (`Account.jsx`) |
| `card` | `Card` | Hampir 1:1; ganti `card-header` dengan `Card` title/extra |
| `table` / `table-bordered` | `Table` | `columns` + `dataSource`; pagination otomatis atau pakai `Pagination` terpisah |
| `thead-dark` / `table-dark` | `Table` dengan `theme` token atau `columns` custom header | Gunakan `columns.title` + `theme` |
| `btn` / `btn-*` | `Button` | `type="primary"`, `type="dashed"`, `danger`, `ghost` |
| `form-control` / `form-select` | `Input`, `InputNumber`, `Select`, `DatePicker`, `Upload` | Validation via `Form.Item` + `rules` |
| `input-group` | `Input` dengan `prefix`/`suffix` atau `Input.Group` | Search icon pakai `prefix={<SearchOutlined />}` |
| `alert` | `Alert` | 1:1, tapi bisa juga `message.info/success` |
| `badge` | `Tag` / `Badge` | `Tag` lebih fleksibel untuk status |
| `pagination` | `Pagination` | Format Laravel links perlu konversi ke `current`/`pageSize`/`total` |
| `modal` | `Modal` / `Modal.confirm` | Ganti semua raw modal & SweetAlert confirm |
| `form-check` (checkbox) | `Checkbox` / `Radio` | Termasuk radio group di `ProductUnitBuilder` |
| `list-group` | `List` | Sidebar menu sebelumnya, customer dropdown |
| `d-flex` / `gap-*` / `row` / `col-*` | `Row` + `Col` + `Flex` dari AntD, atau tetap Tailwind | AntD `Row/Col` punya gutter |
| `dropdown` / `list-group-item-action` | `Select` / `AutoComplete` | Customer search di POS → `AutoComplete` |
| `btn-group` (toggle) | `Radio.Group` dengan `optionType="button"` | Payment method, receipt size |
| `spinner` / `fas fa-spinner fa-spin` | `Spin` | Loading state |
| SweetAlert2 | `Modal.confirm`, `Modal.success`, `notification` | Semua konfirmasi & flash |
| Font Awesome | `@ant-design/icons` | Ganti seluruh icon |
| `nav-tabs` | `Tabs` | Jika ada tab (jarang di codebase saat ini) |
| `progress` | `Progress` | Barcode print progress jika diperlukan |
| `tooltip` | `Tooltip` | Optional untuk tombol icon tanpa label |

---

## 3. Strategi Migrasi

### 3.1 Pendekatan

**Rekomendasi: Phased (bertahap)**, bukan big bang.

Justifikasi:

- POS Kasir adalah sistem produksi; big bang berisiko merusak workflow kasir.
- AntD Layout, Form, Table memiliki API berbeda dengan Bootstrap; perlu validasi awal.
- Tailwind masih bisa dipakai sebagai safety net selama transisi.
- Setiap fase bisa di-merge setelah testing di 1-2 role (admin + kasir).

File-per-file vs komponen-per-komponen:

- **Komponen-per-komponen lebih baik**: shared components (`Pagination`, `Search`, `Delete`, `DatePreset`) dan layout shell dikerjakan dulu. Setelah stabil, baru halaman per halaman.
- Halaman kompleks seperti POS dipecah menjadi sub-komponen sebelum migrasi.

### 3.2 Layout Restructure

File utama yang direstruktur:

- `resources/js/Layouts/Account.jsx` → `Layout` antd (`Layout.Sider`, `Layout.Header`, `Layout.Content`).
- `resources/js/Components/Sidebar.jsx` → `Menu` dengan `items` array. Permission gate di-level item (`children: hasPermission(...) ? [...] : []` atau filter di luar).
- `resources/js/Components/MenuSearchPalette.jsx` → tetap standalone, styling diganti ke AntD `Input` + `Dropdown`/`Modal` jika diinginkan.
- `resources/views/app.blade.php` → hapus CDN Bootstrap CSS & JS, hapus Font Awesome CDN.

Struktur baru yang diusulkan:

```jsx
// Layout baru
<ConfigProvider theme={zenTheme}>
  <Layout style={{ minHeight: '100vh' }}>
    <Sider collapsible collapsedWidth={64} width={240}>
      <div className="sidebar-brand">{storeName}</div>
      <Menu theme="dark" mode="inline" items={filteredMenuItems} />
    </Sider>
    <Layout>
      <Header style={{ background: '#fff', padding: 0 16 }}>
        <Flex justify="space-between" align="center">
          <MenuSearchPalette />
          <Dropdown menu={{ items: userMenuItems }}>
            <Space>{userName} <DownOutlined /></Space>
          </Dropdown>
        </Flex>
      </Header>
      <Content style={{ margin: 16, padding: 16, background: '#fff' }}>
        {children}
      </Content>
    </Layout>
  </Layout>
</ConfigProvider>
```

Catatan: SB Admin 2 custom CSS (`public/assets/css/styles.css`) hanya relevan untuk layout lama. Setelah migrasi layout, file tersebut bisa dihapus/ditinggalkan.

### 3.3 Urutan Migrasi (Prioritas)

1. **Layout & shell**
   - `resources/js/Layouts/Account.jsx`
   - `resources/js/Components/Sidebar.jsx`
   - `resources/views/app.blade.php` (hapus CDN Bootstrap)

2. **Shared components**
   - `resources/js/Shared/Pagination.jsx`
   - `resources/js/Shared/Search.jsx`
   - `resources/js/Shared/Delete.jsx` (ganti SweetAlert2 dengan `Modal.confirm`)
   - `resources/js/Shared/DatePreset.jsx` (ganti ke `DatePicker.RangePicker` + presets)

3. **Halaman simple (demo)**
   - `resources/js/Pages/Account/Dashboard/Index.jsx`
   - `resources/js/Pages/Account/Settings/Index.jsx`
   - `resources/js/Pages/Account/Categories/*`

4. **Halaman medium**
   - `resources/js/Pages/Account/Products/*` (termasuk modal import)
   - `resources/js/Pages/Account/Users/*`
   - `resources/js/Pages/Account/Roles/*`
   - `resources/js/Pages/Account/Reports/*`

5. **Halaman kompleks**
   - `resources/js/Pages/Account/Transactions/Create.jsx` (POS) — pecah dulu ke sub-komponen
   - `resources/js/Pages/Account/Transactions/Index.jsx`
   - `resources/js/Pages/Account/Purchases/Create.jsx`
   - `resources/js/Pages/Account/Returns/Create.jsx`
   - `resources/js/Pages/Account/StockOpnames/Create.jsx`
   - `resources/js/Pages/Account/CashierShifts/Create.jsx`

6. **Polish & cleanup**
   - Hapus `bootstrap` & `react-bootstrap` dari `package.json`
   - Hapus Font Awesome CDN
   - Audit custom CSS di `resources/css/app.css` dan `public/assets/css/styles.css`
   - Responsive testing di tablet (1024px) dan mobile (768px)

---

## 4. Dependency Changes

### 4.1 Package.json

File: `package.json` (saat ini baris 18-26).

**Hapus:**

```json
"bootstrap": "^5.3.8",
"react-bootstrap": "^2.10.10"
```

**Tambah:**

```json
"antd": "^5.x",
"@ant-design/icons": "^5.x"
```

**Keep:**

- `tailwindcss` (utility styling khusus, POS grid, login page)
- `sweetalert2` (opsional; bisa ditinggalkan sementara, lalu diganti secara bertahap)
- `recharts` (chart di laporan)
- `@inertiajs/react`, `react`, `react-dom`

**Review:**

- Font Awesome CDN di `app.blade.php` → hapus setelah semua icon diganti ke `@ant-design/icons`.

### 4.2 Import Changes

File `resources/js/app.jsx` (baris 1) saat ini hanya import `app.css`. Tidak perlu import CSS antd di sini karena AntD 5.x menggunakan CSS-in-JS (runtime) secara default. Namun jika ingin menonaktifkan FOUC, bisa tambahkan `StyleProvider` dari `@ant-design/cssinjs`.

Perubahan per file umum:

```js
// Hapus
import { NavDropdown } from "react-bootstrap";
import { Modal, Button } from "react-bootstrap";

// Tambah
import { Button, Card, Table, Form, Input, Select, Modal, Layout, Menu, Dropdown, Space, Tag, Alert, Pagination, Spin, DatePicker, Radio, Checkbox, AutoComplete, List, notification, ConfigProvider } from "antd";
import { DownOutlined, SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SaveOutlined, ReloadOutlined, PrinterOutlined, FilterOutlined, CloseOutlined, BarsOutlined, DashboardOutlined, SettingOutlined, TeamOutlined, TagsOutlined, TruckOutlined, IdcardOutlined, AppstoreOutlined, BalanceScaleOutlined, WalletOutlined, UnorderedListOutlined, SwapOutlined, FileDoneOutlined, ShoppingCartOutlined, UndoOutlined, ClockCircleOutlined, ReconciliationOutlined, MoneyCollectOutlined, LineChartOutlined, StarOutlined, MobileOutlined, CoinOutlined, ReceiptOutlined, BarChartOutlined } from "@ant-design/icons";
```

---

## 5. Styling Strategy

### 5.1 Theme Customization

AntD 5 menggunakan `ConfigProvider` dengan `theme` token. Contoh setup tema di `resources/js/app.jsx` atau layout wrapper baru:

```jsx
import { ConfigProvider } from "antd";

const zenTheme = {
  token: {
    colorPrimary: "#0d9488",       // teal seperti login page & tombol success saat ini
    colorSuccess: "#22c55e",
    colorWarning: "#f59e0b",
    colorError: "#ef4444",
    colorInfo: "#3b82f6",
    borderRadius: 8,
    fontFamily: "'Instrument Sans', 'Quicksand', sans-serif",
  },
  components: {
    Layout: {
      siderBg: "#1e293b",        // dark sidebar seperti SB Admin 2
      triggerBg: "#1e293b",
    },
    Menu: {
      darkItemBg: "#1e293b",
      darkItemSelectedBg: "#0f172a",
    },
    Card: {
      borderRadiusLG: 12,
    },
    Table: {
      headerBg: "#f8fafc",
      headerColor: "#0f172a",
    },
  },
};
```

Warna brand yang digunakan saat ini:

- Login gradient: `#0f172a` → `#1e293b` → `#115e59`
- Tombol success: `#14b8a6` / `#0d9488`
- Background body: `#f5ece9` (di `styles.css`) — pertimbangkan untuk diubah ke `#f8fafc` agar lebih modern.

### 5.2 Tailwind + AntD Coexistence

**Tailwind tetap dipertahankan** sebagai utility layer untuk:

- Layout POS custom yang tidak tersedia di AntD (product grid, cart row, checkout panel).
- Login page custom styling (`resources/css/app.css` baris 18-242).
- Spasi, flex, gap, object-fit, overflow khusus.

**Konflik yang mungkin terjadi:**

- AntD juga memiliki class global seperti `ant-btn`, `ant-card`, `ant-row`. Tailwind utility tidak akan menimpa kecuali ada class yang sama namanya (sangat jarang).
- Jika terjadi konflik, gunakan Tailwind dengan prefix (contoh `tw:flex`) atau scope CSS custom di class sendiri.

Rekomendasi: tidak perlu prefix Tailwind saat ini. Gunakan Tailwind hanya untuk styling yang tidak tersedia di AntD token.

### 5.3 Custom CSS

CSS yang perlu dipertahankan/dibuat ulang:

| File | Custom CSS | Keputusan |
|------|------------|-----------|
| `resources/css/app.css` (baris 18-242) | Login page styling | **Pertahankan**. Login tidak pakai Bootstrap. |
| `public/assets/css/styles.css` | SB Admin 2 sidebar, navbar, wrapper, modal blur | **Hapus setelah layout AntD jalan**. |
| Inline styles di POS (`Transactions/Create.jsx`) | `pos-cashier-page`, `pos-product-grid`, `pos-cart-row`, dll | **Pertahankan class custom** atau pindah ke Tailwind + sedikit CSS. |

Custom CSS baru yang mungkin diperlukan:

- Styling POS product grid (tile layout) — tetap via CSS custom/Tailwind.
- Scrollbar sidebar — AntD `Menu` tidak menyediakan styling scrollbar.
- Print barcode page — tidak terpengaruh migrasi.

---

## 6. Komponen Kustom yang Perlu Dibuat Ulang

| Komponen Saat Ini | Diganti Dengan | File Baru / Lokasi | Catatan |
|-------------------|----------------|--------------------|---------|
| `Sidebar.jsx` (raw list-group) | `Menu` items dari `NAV_MENUS` | `resources/js/Components/Sidebar.jsx` (rewrite) | Permission gate dengan `items.filter()` |
| `MenuSearchPalette.jsx` | `Input` + `Dropdown` atau `Modal` + `List` | `resources/js/Components/MenuSearch/MenuSearchPalette.jsx` | Tetap keyboard-first (Ctrl+K) |
| `Pagination.jsx` | `Pagination` + format Laravel links | `resources/js/Shared/Pagination.jsx` | Konversi `links` array ke `current`, `pageSize`, `total` |
| `Search.jsx` | `Input.Search` | `resources/js/Shared/Search.jsx` | `prefix={<SearchOutlined />}` |
| `Delete.jsx` | `Modal.confirm` + `notification` | `resources/js/Shared/Delete.jsx` | Hapus SweetAlert2 |
| `DatePreset.jsx` | `DatePicker.RangePicker` + presets | `resources/js/Shared/DatePreset.jsx` | Gunakan built-in `presets` antd |
| `ProductUnitBuilder.jsx` | `Table` + `Select` + `InputNumber` + `Radio` | `resources/js/Components/ProductUnitBuilder.jsx` | Tetap controlled, lebih rapi dengan AntD |
| `ProductComponentBuilder.jsx` | `Table` + `Select` + `InputNumber` | `resources/js/Components/ProductComponentBuilder.jsx` | Sama seperti di atas |
| POS product grid | `Card` / custom grid + `Badge` | Sub-komponen baru di `resources/js/Components/Pos/` | Terpisah dari `Transactions/Create.jsx` |
| POS cart panel | `List` + `InputNumber` + `Button` + `Space` | Sub-komponen baru di `resources/js/Components/Pos/` | Render cart row, qty stepper, hold/delete |
| POS customer search | `AutoComplete` + `Modal` quick add | Sub-komponen baru di `resources/js/Components/Pos/` | Ganti raw dropdown manual |
| POS payment summary | `Statistic` / `Descriptions` + `Radio.Group` | Sub-komponen baru di `resources/js/Components/Pos/` | Method toggle, discount, cash |
| Import product modal | `Modal` + `Upload` + `Button` | Inline di `Products/Index.jsx` atau `Products/ImportModal.jsx` | Ganti React-Bootstrap Modal |

---

## 7. Estimasi Effort

Estimasi untuk 1 developer senior frontend + smoke testing backend.

| Fase | Items | Estimasi (hari) |
|------|-------|-----------------|
| 1. Layout shell | `Account.jsx`, `Sidebar.jsx`, `app.blade.php` | 1-2 |
| 2. Shared components | `Pagination`, `Search`, `Delete`, `DatePreset` | 1 |
| 3. Simple pages | Dashboard, Settings, Categories, Units, Suppliers, Customers, PPOB Accounts | 2-3 |
| 4. Medium pages | Products, Users, Roles, Reports (7 halaman) | 3-4 |
| 5. Complex pages | POS, Transactions, Purchases, Returns, Stock, Shifts | 4-6 |
| 6. Polish & cleanup | Testing, responsive, hapus Bootstrap, hapus SweetAlert, audit CSS | 2-3 |
| **Total** | | **13-19 hari** |

Asumsi:

- 1 hari = 6-7 jam productive.
- Tidak termasuk backend changes; controller dan API tetap.
- POS dan complex forms menyumbang ~40% total effort.

---

## 8. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| Inertia.js + AntD compatibility | Medium | Test awal di halaman Dashboard. AntD dan Inertia tidak saling konflik karena keduanya React-based. Pastikan `router` tetap dipakai untuk navigasi. |
| Tailwind class bertabrakan dengan AntD | Low | Gunakan Tailwind hanya untuk utility yang tidak tersedia di AntD (POS grid, login). Tidak perlu prefix jika tidak ada class overlap. |
| Performance bundle AntD besar | Medium | AntD 5 mendukung tree-shaking. Import komponen named (`import { Button } from 'antd'` bukan `import * as Antd`). Monitor bundle via `npm run build`. |
| ProTable vs Table | Low | Mulai dengan AntD `Table` biasa. Evaluasi `@ant-design/pro-components` hanya jika perlu fitur advanced (filter server, column setting). |
| Form handling berbeda | Medium | Inertia `useForm` masih bisa dipakai. AntD `Form` bisa controlled atau uncontrolled. Pilih controlled untuk kompatibilitas dengan state Inertia. |
| Icon mapping dari Font Awesome | Low | Buat mapping icon di satu file (`resources/js/Utils/icons.jsx`) untuk konsistensi. |
| SweetAlert2 dihapus terlalu cepat | Medium | Ganti `Delete.jsx` dulu, lalu baru mengganti `Swal.fire` di halaman lain secara bertahap. |
| Responsive tablet/mobile | Medium | AntD Layout.Sider mendukung `breakpoint`. Uji pada tablet POS (biasanya 1024px). |
| SB Admin 2 CSS masih tersisa | Low | Hapus `public/assets/css/styles.css` hanya setelah layout & sidebar 100% jalan. |

---

## 9. Rekomendasi

1. **Phase 1: Layout + 1 halaman demo**. Migrasi `Account.jsx`, `Sidebar.jsx`, dan `Dashboard/Index.jsx` dulu. Ini menjadi **proof of concept** untuk validasi Inertia + AntD + Tailwind + permission gate.
2. **Gunakan AntD 5.x terbaru** dengan `ConfigProvider` theme agar brand tetap konsisten.
3. **Jangan hapus Tailwind** — gunakan sebagai utility khusus untuk POS layout dan login page.
4. **Ganti SweetAlert2 dengan AntD `Modal.confirm` + `notification`** secara bertahap, dimulai dari `Shared/Delete.jsx`.
5. **Ganti Font Awesome dengan `@ant-design/icons`**; pertimbangkan untuk menyimpan 1-2 icon kustom hanya jika AntD tidak punya equivalent.
6. **Pecah POS `Create.jsx` dulu** sebelum migrasi. File 1350 baris terlalu besar untuk diedit langsung; buat sub-komponen di `resources/js/Components/Pos/`.
7. **Pertahankan behaviour existing** seperti keyboard shortcut (F2 bayar, F3 fokus search, Esc tutup modal) saat migrasi POS.
8. **Setiap fase diuji dengan role admin dan kasir** untuk memastikan permission gate tidak rusak.

---

## 10. Next Steps

1. **Buat branch terpisah**: `feature/migrate-antd` dari `main`.
2. **Install dependencies**:
   ```bash
   npm install antd @ant-design/icons
   npm uninstall bootstrap react-bootstrap
   ```
3. **Setup `ConfigProvider`** di `resources/js/app.jsx` atau wrapper layout baru dengan tema ZenPOS.
4. **Buat halaman demo**: migrasi `Dashboard/Index.jsx` ke AntD sambil mempertahankan Tailwind utility.
5. **Validasi Inertia compatibility**: cek navigasi, flash message, dan shared props tetap berfungsi.
6. **Migrasi layout shell**: `Account.jsx`, `Sidebar.jsx`, `MenuSearchPalette.jsx`, hapus Bootstrap CDN dari `app.blade.php`.
7. **Lanjutkan bertahap** sesuai urutan §3.3.
8. **Update dokumentasi**: catat keputusan di `docs/decisions.md`, progress di `docs/todo.md`, dan gotchas di `MEMORY.md`.

---

## Appendix: File Referensi Utama

- Layout & shell: `resources/js/Layouts/Account.jsx`, `resources/js/Components/Sidebar.jsx`, `resources/js/Components/MenuSearch/MenuSearchPalette.jsx`, `resources/views/app.blade.php`
- Shared: `resources/js/Shared/Pagination.jsx`, `resources/js/Shared/Search.jsx`, `resources/js/Shared/Delete.jsx`, `resources/js/Shared/DatePreset.jsx`
- Halaman simple: `resources/js/Pages/Account/Dashboard/Index.jsx`, `resources/js/Pages/Account/Settings/Index.jsx`, `resources/js/Pages/Account/Categories/Index.jsx`
- Halaman medium: `resources/js/Pages/Account/Products/Index.jsx`, `resources/js/Pages/Account/Users/Index.jsx`, `resources/js/Pages/Account/Reports/Profit.jsx`, `resources/js/Pages/Account/Reports/Sales.jsx`
- Halaman kompleks: `resources/js/Pages/Account/Transactions/Create.jsx`, `resources/js/Pages/Account/Transactions/Index.jsx`, `resources/js/Pages/Account/Purchases/Create.jsx`, `resources/js/Pages/Account/Returns/Create.jsx`
- Helper: `resources/js/Utils/navMenu.js`, `resources/js/Utils/Permissions.jsx`, `resources/js/Utils/format.js`
- Styling: `resources/css/app.css`, `public/assets/css/styles.css`, `package.json`

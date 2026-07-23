# Rencana PWA & Mobile-Friendly — POS Kasir

**Status**: Draft rencana (belum diimplementasi)
**Tanggal**: 2026-07-23
**Stack**: Laravel 12 + Inertia.js 3 + React 19 + Ant Design 6 + Tailwind CSS 4 (Vite 7)
**Referensi**: `docs/architecture.md`, `docs/migration-antd.md` (migrasi Bootstrap → AntD baru selesai), `MEMORY.md`

---

## 0. Temuan Kritis (harus dibaca sebelum mulai)

Sebelum masuk ke rencana mobile/PWA, ditemukan **regresi styling yang sudah ada sekarang** akibat migrasi AntD (`docs/migration-antd.md`, commit *"Selesaikan Phase 5 migrasi Ant Design: cleanup legacy UI stack"*):

- `resources/views/app.blade.php` **tidak lagi memuat** Bootstrap CDN maupun `public/assets/css/styles.css` — dan `resources/css/app.css` juga tidak berisi definisi untuk class tersebut (dicek dengan grep, nol hasil).
- Tapi `resources/js/Pages/Account/Transactions/Create.jsx` dan sub-komponennya (`Components/Pos/PosProductGrid.jsx`, `PosCartPanel.jsx`, `PosPaymentSummary.jsx`) **masih memakai class Bootstrap mentah**: `row g-3`, `col-12 col-xl-8`, `d-flex`, `gap-1`, `mt-1`, `px-3`, `pb-2`, `text-end`, `text-danger`, `form-label`, `w-100`, dst — dan class custom SB Admin 2 seperti `pos-cashier-page`, `pos-product-grid`, `pos-sale-panel`, `pos-category-strip`, `pos-cart-list`, `pos-summary-box` yang definisinya **hanya ada di `public/assets/css/styles.css`** (file mati, tidak pernah di-`@vite`/`link` di manapun — sudah diverifikasi lewat grep di seluruh `resources/`).
- Dampak: **halaman POS Kasir (halaman paling kritis untuk kasir) saat ini kemungkinan tampil tanpa layout/grid/spacing sama sekali** — semua `<div>` custom collapse jadi block polos karena tidak ada CSS yang menata grid produk maupun panel keranjang.

**Rekomendasi**: ini bukan bug baru yang perlu dibuat, tapi harus di-fix sebagai **Fase 0** sebelum atau bersamaan dengan pekerjaan mobile POS di §6/§7, karena solusinya sama: pindahkan `Transactions/Create.jsx` + 3 komponen Pos di atas ke AntD `Row`/`Col`/`Flex`/`Card` murni (bukan nulis ulang CSS custom untuk class yang sudah mati). Ini sekaligus menyelesaikan mobile-adaptation POS di §2.3 dan §6 dalam satu pekerjaan — jangan dikerjakan dua kali.

*(Verifikasi cepat sebelum eksekusi: buka `/account/transactions/create` di browser/DevTools untuk konfirmasi visual sebelum mulai refactor.)*

---

## 1. Assessment UI Saat Ini di Mobile (< 768px)

Dibaca langsung dari `Layouts/Account.jsx`, `Components/Sidebar.jsx`, `Pages/Auth/Login.jsx`, `Pages/Account/Dashboard/Index.jsx`, `Pages/Account/Transactions/Create.jsx`, `resources/css/app.css`.

### 1.1 Sidebar (`Layouts/Account.jsx:57-113`)
- `Layout.Sider` dipasang **tanpa prop `breakpoint`/`onBreakpoint`** — di viewport HP (< 576px), Sider tetap render sebagai kolom fixed (`width={240}` atau `collapsedWidth={64}`), bukan overlay/drawer. Di layar 360–390px, Sider bisa memakan **60%+ lebar viewport**, menyisakan area konten sangat sempit.
- Toggle collapse hanya lewat trigger built-in AntD di pojok bawah Sider (kecil, tidak ergonomis untuk jempol) — tidak ada hamburger button di `Header`.
- Tidak ada overlay/backdrop saat sider "terbuka" di mobile karena memang bukan drawer — akan terasa seperti layout desktop yang dipaksakan ke layar kecil.

### 1.2 Header & Search (`Layouts/Account.jsx:116-157`, `resources/css/app.css:248-258`)
- `MenuSearchPalette` (`Ctrl+K` search) disembunyikan total di bawah 768px via `.menu-search-wrapper { display: none }` — **fitur search menu hilang sepenuhnya di HP tanpa pengganti** (tidak ada versi mobile/ikon search).
- `Header` pakai `Flex justify="space-between"` dengan `MenuSearchPalette` (kosong di mobile) + `Space` (theme toggle + user dropdown) — di mobile area kiri jadi kosong, tidak dipakai untuk hamburger.

### 1.3 Content spacing (`Layouts/Account.jsx:159-166`)
- `Content` punya `margin: 16` + `padding: 16` tetap di semua breakpoint → 64px lebar terpakai untuk padding di layar 360px (≈18% dari viewport). Perlu dikurangi di mobile (mis. `margin: 8, padding: 12`).

### 1.4 Tabel (cek di ~26 halaman index/report, contoh `Transactions/Index.jsx:329-335`)
- Hampir semua `<Table columns={columns} .../>` **tidak diberi `scroll={{ x: ... }}`** (di-grep di seluruh `Pages/Account`, nol hasil `scroll={{`). Kolom banyak (Transactions punya kolom No., Invoice, Customer, Total, Status, Kasir, Tanggal, Aksi, dll) akan overflow horizontal tanpa mekanisme scroll yang jelas di layar < 768px — AntD default akan menyusutkan kolom sampai tidak terbaca, bukan scroll horizontal yang smooth.
- Dashboard (`Dashboard/Index.jsx:397-407`) sudah lebih baik: `scroll={{ y: 260 }}` tapi hanya 2 kolom jadi aman.

### 1.5 POS Kasir — grid produk & keranjang (`Transactions/Create.jsx:795-873`)
- Layout pakai `<div className="row g-3"><div className="col-12 col-xl-8">...<div className="col-12 col-xl-8">` — class Bootstrap grid **tanpa Bootstrap CSS** (lihat §0). Bahkan jika di-fix CSS-nya, breakpoint `xl` (1200px) berarti **grid 2-kolom (produk 8 + cart 4) baru pecah jadi 1 kolom stacked di bawah 1200px** — jauh dari mobile-first; tablet (768-1024px) pun akan tetap stacked vertikal dengan cart di bawah grid produk (harus scroll panjang untuk checkout).
- `pos-product-grid` (definisi di `public/assets/css/styles.css:774-791`, saat ini mati) pakai `grid-template-columns: repeat(auto-fill, minmax(150px, 1fr))` — di layar 360px hanya menampung ±2 kolom, oke sebagai basis, tapi height card tetap 220px (terlalu tinggi untuk mobile, boros scroll).
- Kategori (`pos-category-strip`) sudah scroll horizontal (`overflow-x: auto`) — pattern ini bagus dan **layak dipertahankan/di-reuse** untuk konteks mobile lain.
- Cart panel (`PosCartPanel.jsx`) render vertikal biasa (bukan bottom sheet) — di mobile, panel keranjang + ringkasan pembayaran + tombol bayar akan berada jauh di bawah grid produk (harus scroll berkali-kali per transaksi) — ini masalah UX terbesar untuk kasir yang pakai HP.
- Search input `PosProductGrid.jsx:29-43` pakai `addonAfter` tombol "Cari" — cukup besar & touch-friendly, oke untuk mobile.
- Qty stepper (`PosCartPanel.jsx:99-124`) pakai `Button size="small"` (≈24px) untuk tombol `-`/`+` — **di bawah rekomendasi 44×44px touch target**.

### 1.6 Form (contoh pola umum di `Pages/Account/**/Create.jsx`, `PosPaymentSummary.jsx`)
- Form pakai campuran `Form.Item` AntD (sudah touch-friendly, `InputNumber`/`Select` AntD default height ~32px — sedikit di bawah 44px) dan sisa class Bootstrap mati (`form-label`, `row g-2`) di `PosPaymentSummary.jsx:41-125` — sama seperti §0, styling rusak.
- Tidak ada penggunaan `inputMode="numeric"`/`type="tel"` untuk field qty/harga/cash — di mobile, keyboard yang muncul adalah default (bukan numpad), memperlambat input kasir.

### 1.7 Stat cards (`Dashboard/Index.jsx:213-219`)
- Sudah pakai `<Col xs={24} sm={12} xl={6}>` — **ini contoh yang benar**, otomatis 1 kolom di HP kecil, 2 kolom di sm (≥576px), 4 kolom di xl. Jadikan pola ini acuan untuk halaman lain yang belum responsive (lihat §2.3).
- `FlexHeader` (baris 462-487) pakai `Space wrap` — judul + alert "Selamat datang" bisa wrap dengan wajar di mobile, tidak ada masalah besar.

### 1.8 Login (`Pages/Auth/Login.jsx` + `resources/css/app.css:18-243`)
- **Sudah cukup baik**: pakai `clamp()`, `grid-template-columns: 1fr 1fr` hanya di atas 900px (`app.css:39-43`), di bawahnya otomatis 1 kolom. Tidak perlu dirombak besar, hanya perlu disesuaikan warna/teks jika manifest & splash PWA butuh konsistensi visual.

### 1.9 Ringkasan Prioritas Masalah

| # | Masalah | Halaman | Severity |
|---|---------|---------|----------|
| 1 | POS Kasir tidak berCSS (class Bootstrap mati) | `Transactions/Create.jsx` + 3 komponen Pos | **Kritis (P0)** |
| 2 | Sider tidak jadi drawer di mobile, tidak ada hamburger | `Layouts/Account.jsx` | Tinggi |
| 3 | Search menu hilang total di mobile | `Layouts/Account.jsx`, `MenuSearchPalette.jsx` | Tinggi |
| 4 | Cart POS di bawah grid produk, bukan bottom sheet | `Transactions/Create.jsx` | Tinggi |
| 5 | Tabel tanpa `scroll={{x}}` di ~26 halaman | `Pages/Account/**/Index.jsx` | Menengah |
| 6 | Touch target qty stepper < 44px | `PosCartPanel.jsx` | Menengah |
| 7 | Tidak ada `inputMode` numeric di field angka | POS, form lain | Rendah-Menengah |
| 8 | Belum ada manifest/SW/meta viewport PWA | `app.blade.php` | Tinggi (blocker PWA) |

---

## 2. Mobile Layout Strategy

### 2.1 `Layout.Sider` → Drawer

Ubah `Layouts/Account.jsx` menjadi mobile-aware:

```jsx
import { Grid } from "antd";
const { useBreakpoint } = Grid;

const screens = useBreakpoint();
const isMobile = !screens.md; // < 768px

// Desktop/tablet: Sider seperti sekarang (collapsible, width 240/64)
// Mobile: Sider TIDAK dirender; ganti dengan <Drawer> yang isinya Menu yang sama,
// dibuka dari state `mobileMenuOpen`, ditutup otomatis saat Link diklik (pakai
// router.on('navigate', ...) atau onClick di useSidebarMenuItems).
```

- Tambah `MenuOutlined` hamburger `Button` di kiri `Header` (`Layouts/Account.jsx:124-129`), tampil hanya saat `isMobile`.
- `MenuSearchPalette` tetap disembunyikan di mobile (sudah ada perilakunya), tapi **tambahkan ikon search terpisah** di Header mobile yang membuka `MenuSearchPalette` dalam mode fullscreen/Modal — jangan biarkan fitur search hilang tanpa pengganti (temuan §1.2).
- Reuse `useSidebarMenuItems`/`resolveMenuSelectedKey` dari `Components/Sidebar.jsx` — logic menu tidak perlu diduplikasi, cukup dirender di dalam `<Drawer><Menu .../></Drawer>` juga.

### 2.2 Responsive Breakpoints

Ikuti token breakpoint AntD (`Grid.useBreakpoint`) supaya konsisten dengan `xs/sm/md/lg/xl` yang sudah dipakai di `Dashboard/Index.jsx`:

| Nama | Lebar | Kegunaan di app ini |
|------|-------|----------------------|
| `xs` | < 576px | HP — Drawer sidebar, cart bottom sheet, grid produk 2 kolom |
| `sm`–`md` | 576–991px | Tablet — Sider collapsed default, grid produk 3 kolom |
| `lg`+ | ≥ 992px | Desktop — layout saat ini (Sider penuh, grid 4 kolom) |

### 2.3 Component Adaptation

| Komponen | File | Desktop (lg+) | Mobile (xs) |
|----------|------|---------------|-------------|
| Sidebar | `Layouts/Account.jsx` | `Sider` collapsible, seperti sekarang | `Drawer` (overlay) + hamburger di `Header` |
| Search menu | `MenuSearchPalette.jsx` | Inline di Header (sudah ada) | Ikon di Header → buka fullscreen modal/drawer |
| Table (26 halaman) | `Pages/Account/**/Index.jsx` | Semua kolom, tanpa scroll | Tambah `scroll={{ x: 'max-content' }}` (quick win) atau ubah ke `List`/`Card` per baris untuk halaman prioritas (Transaksi, Produk) |
| Stat cards | `Dashboard/Index.jsx` | `Col xs={24} sm={12} xl={6}` (sudah benar) | Sudah otomatis 1 kolom di `xs` — tidak perlu ubah |
| POS grid produk | `PosProductGrid.jsx` | Grid AntD `Row/Col` 4-6 kolom | `Row gutter={[8,8]}` dengan `Col xs={12} sm={8} md={6}` (2 kolom di HP) |
| POS cart | `PosCartPanel.jsx` + `PosPaymentSummary.jsx` | Panel kanan tetap (`Col xl={4}`) | Bottom sheet (`Drawer placement="bottom"` atau sticky footer bar "Lihat Keranjang (Rp xxx)" yang membuka Drawer) |
| Qty stepper | `PosCartPanel.jsx:99-124` | `size="small"` OK (mouse) | Naikkan ke `size="middle"`/custom min 44×44px |

---

## 3. PWA Implementation

### 3.1 Service Worker
- **Manual `public/sw.js`**, register di entry point (`resources/js/app.jsx`) via `navigator.serviceWorker.register('/sw.js')` setelah `createInertiaApp` mount — hindari plugin Vite PWA otomatis dulu (lihat §8, rekomendasi kontrol manual).
- Strategi cache:
  - **Network First** untuk semua request Inertia/API (`/account/*`, halaman POS) — data harus real-time (stok, harga, saldo PPOB), fallback ke cache kalau offline.
  - **Cache First** untuk asset statis (`/build/*` hasil Vite, `assets/logo.png`, font).
  - **Stale-While-Revalidate** untuk request GET produk (`/account/transactions/create?...`) supaya grid produk tetap muncul saat sinyal lemot di toko.
- Offline fallback: halaman statis sederhana (`public/offline.html`) di-cache saat `install`, ditampilkan saat `fetch` gagal total dan bukan asset.
- Background sync untuk transaksi offline: **tandai sebagai v2** (kompleks — perlu queue di IndexedDB untuk payload `POST /account/transactions`, retry saat online, dan penanganan konflik stok). v1 cukup **cegah checkout saat offline** dengan pesan jelas (deteksi via `navigator.onLine` + event `online`/`offline`), daripada background sync yang riskan untuk uang/stok.

### 3.2 Web App Manifest (`public/manifest.json`)

```json
{
    "name": "POS Kasir",
    "short_name": "POS Kasir",
    "description": "Sistem kasir & inventori untuk retail Indonesia",
    "start_url": "/account/dashboard",
    "scope": "/",
    "display": "standalone",
    "background_color": "#0f172a",
    "theme_color": "#0d9488",
    "orientation": "portrait-primary",
    "icons": [
        { "src": "/assets/pwa/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
        { "src": "/assets/pwa/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
        { "src": "/assets/pwa/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
    ]
}
```

- `theme_color: #0d9488` dan `background_color` gelap **sudah cocok** dengan `colorPrimary` di `resources/js/theme/zenTheme.js:9` dan gradient login (`#0f172a` → `#115e59`, `app.css:28`) — konsisten dengan brand yang sudah ada, tidak perlu warna baru.
- Ikon: generate dari `config('branding.logo_path')` (`assets/logo.png`, dipakai juga di `Login.jsx:13`) — pastikan source logo resolusinya cukup untuk 512×512.
- `start_url: /account/dashboard` cocok karena ini landing page setelah login (`routes/web.php`).

### 3.3 Install Prompt
- `resources/js/Components/InstallPrompt.jsx`: listen `beforeinstallprompt`, `e.preventDefault()`, simpan event di state/ref, render tombol/banner kecil (AntD `FloatButton` atau `Alert` closable) "Install POS Kasir di HP ini".
- Deteksi sudah terinstal: `window.matchMedia('(display-mode: standalone)').matches` atau `navigator.standalone` (iOS) — sembunyikan prompt jika sudah true.
- Pasang komponen ini di `Layouts/Account.jsx` (dalam `Content`, sekali di root layout) supaya muncul di semua halaman setelah login, bukan di Login page.

### 3.4 Push Notification (opsional, v1.1+)
- Perlu `VAPID` keys + Laravel `laravel-notification-channels/webpush` atau native Web Push API + `App\Notifications`.
- Trigger yang relevan dengan domain: transaksi sukses (untuk owner memantau dari HP tanpa buka app), stok menipis (`summary.low_stock_count`, sudah ada logic-nya di `Dashboard/Index.jsx:125-126` — tinggal disalurkan jadi notifikasi terjadwal/event).
- **Eksplisit di luar scope v1** — butuh izin browser + backend queue, cukup didesain di sini, implementasi setelah fase mobile+PWA foundation stabil.

---

## 4. Touch & Gesture Optimization

- **Touch target 44×44px**: audit `Button size="small"` di area interaktif kasir — minimal `PosCartPanel.jsx` qty stepper (`-`/`+`, delete, hold/resume) dan `pos-category-pill` (`app.css`/`styles.css` lama, height 36px → naikkan ke 44px saat mobile via media query).
- **Swipe actions di table rows**: untuk halaman dengan aksi Edit/Hapus per baris (Products, Transactions, Customers) di mode Card-list mobile (§2.3) — swipe-to-reveal aksi, implementasi custom pakai `onTouchStart/onTouchMove/onTouchEnd` (tanpa dependency baru, cukup untuk beberapa halaman prioritas: Products, Customers, Transactions).
- **Pull-to-refresh**: paling berguna di `Transactions/Index.jsx`, `Dashboard/Index.jsx`, `StockMovements/Index.jsx` — implementasi via native browser (Chrome Android sudah punya pull-to-refresh default kalau scroll container adalah `document`, jadi pastikan layout tidak override overscroll di `body`) atau custom hook ringan jika perlu kontrol lebih (`Inertia.reload()`).
- **Haptic feedback**: `navigator.vibrate(50)` di `storeTransaction` (`Transactions/Create.jsx:643-739`) tepat setelah `data.success === true`, sebelum redirect — cek `'vibrate' in navigator` dulu (tidak semua browser dukung, terutama desktop/iOS Safari).
- **Input mode numeric**: pada `InputNumber` AntD tidak ada prop native `inputMode`, tapi bisa diteruskan lewat pola `<InputNumber {...} />` → cek apakah AntD 6 forward extra props ke `<input>`; jika tidak, ganti ke `<input type="number" inputMode="decimal">` custom untuk field: qty (`PosCartPanel.jsx:106-116`), cash (`PosPaymentSummary.jsx:96-104`), diskon (`PosPaymentSummary.jsx:69-75`), ppob cost/admin fee (`PosPpobModal.jsx`).

---

## 5. Performance Optimization

- **Inertia partial reloads**: sudah dipakai dengan baik di cart (`inertiaCartOptions` → `only: ["carts"]`, `Transactions/Create.jsx:64-78`) — pertahankan pola ini, terapkan juga di filter Table halaman lain yang saat ini full reload (audit halaman index dengan filter/search).
- **Code splitting AntD icons**: `@ant-design/icons` di-import per-ikon named (`import { DashboardOutlined } from "@ant-design/icons"`, `Sidebar.jsx:3-28`) — ini **sudah tree-shake-friendly** dengan Vite, tidak perlu perubahan; cukup pastikan tidak ada `import * as Icons` di mana pun (grep cepat sebelum rilis).
- **Image optimization**: `storeLogo`/`storeLogo` (`Layouts/Account.jsx:77-87`) dan gambar produk (`PosProductGrid.jsx:100-104`) — pastikan upload produk (`app/Imports`/upload controller) resize/compress ke ukuran wajar (mis. max 400×400 untuk tile produk) di backend, bukan hanya CSS `objectFit`.
- **Font subsetting**: `--font-sans: 'Instrument Sans'` (`app.css:10-11`) — cek apakah font di-load via Google Fonts CDN atau self-host; jika CDN, pertimbangkan subset ke karakter Latin saja untuk kurangi payload di koneksi lambat toko.
- **Vite build**: tambahkan `build.rollupOptions.output.manualChunks` untuk split `antd`/`@ant-design/icons`/`recharts` (dipakai di Reports, `package.json:24`) ke chunk terpisah dari halaman POS, supaya halaman kasir (paling sering dibuka) tidak menunggu load chunk Reports.
- **Lighthouse target**: 90+ Performance, 100 PWA — perlu audit ulang setelah §0 (fix CSS POS) dan §3 (manifest+SW) selesai, karena saat ini skor PWA otomatis 0 (tidak ada manifest/SW/HTTPS check lokal).

---

## 6. File yang Perlu Dibuat/Diubah

### File Baru

| File | Tujuan |
|------|--------|
| `public/manifest.json` | PWA manifest (§3.2) |
| `public/sw.js` | Service worker, Network First + cache statis (§3.1) |
| `public/offline.html` | Fallback saat offline total |
| `public/assets/pwa/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` | Ikon PWA, generate dari `assets/logo.png` |
| `resources/js/Hooks/useMobile.js` | Wrapper tipis di atas `Grid.useBreakpoint` AntD → return `{ isMobile, isTablet, isDesktop }` |
| `resources/js/Components/MobileDrawer.jsx` | Drawer navigasi mobile, reuse `useSidebarMenuItems`/`resolveMenuSelectedKey` dari `Sidebar.jsx` |
| `resources/js/Components/InstallPrompt.jsx` | Banner/tombol install PWA (§3.3) |
| `resources/js/Components/Pos/PosCartDrawer.jsx` | Bottom sheet cart untuk mobile (bungkus `PosCartPanel` + `PosPaymentSummary` yang sudah ada, jangan duplikasi logic) |

### File Dimodifikasi

| File | Perubahan |
|------|-----------|
| `resources/js/Layouts/Account.jsx` | `Grid.useBreakpoint`, render `Sider` vs `MobileDrawer` kondisional, hamburger + search icon di `Header`, kurangi margin/padding `Content` di mobile, pasang `<InstallPrompt />` |
| `resources/views/app.blade.php` | Tambah `<link rel="manifest" href="/manifest.json">`, `<meta name="theme-color" content="#0d9488">`, `<meta name="apple-mobile-web-app-capable" content="yes">`, register SW (bisa inline `<script>` atau via `app.jsx`) |
| `resources/js/app.jsx` | Registrasi service worker (`navigator.serviceWorker.register`) setelah mount |
| `vite.config.js` | Tambah `build.rollupOptions.output.manualChunks` (chunk splitting, §5) — **tanpa** plugin PWA otomatis (lihat §8) |
| `resources/js/Pages/Account/Transactions/Create.jsx` | Ganti `row g-3`/`col-*` Bootstrap mati → AntD `Row`/`Col`; grid 2 kolom di mobile; cart pindah ke `PosCartDrawer` |
| `resources/js/Components/Pos/PosProductGrid.jsx` | Ganti `pos-product-grid`/`pos-category-strip` custom class mati → AntD `Row gutter` + `Col xs={12} sm={8} md={6}` |
| `resources/js/Components/Pos/PosCartPanel.jsx` | Perbesar touch target qty stepper; ganti class Bootstrap mati (`d-flex`, `gap-1`, dst) → AntD `Flex`/`Space` atau Tailwind utility |
| `resources/js/Components/Pos/PosPaymentSummary.jsx` | Sama seperti di atas — `row g-2`, `form-label` → AntD `Row`/`Col`/`Form.Item`; `input type=number inputMode` untuk cash/diskon |
| `resources/css/app.css` | Tambah utility mobile-first baru (padding, touch target, safe-area `env(safe-area-inset-*)` untuk notch HP); **hapus referensi ke class yang dipindah ke AntD** setelah §0 selesai |
| `public/assets/css/styles.css` | **Hapus file** setelah §0 & migrasi POS selesai (sudah direkomendasikan mati di `docs/migration-antd.md:307`, belum pernah dieksekusi) |

---

## 7. Estimasi Effort

| Fase | Items | Hari |
|------|-------|------|
| 0. Fix regresi CSS POS (temuan §0) | Migrasi `Transactions/Create.jsx` + 3 komponen Pos ke AntD `Row/Col`, hapus dependency ke `styles.css` mati | 2-3 |
| 1. PWA Foundation | manifest, SW, offline page, install prompt, meta tag `app.blade.php` | 1-2 |
| 2. Mobile Layout | `useMobile` hook, `MobileDrawer`, hamburger + search icon Header, responsive Content spacing | 2 |
| 3. Halaman adaptasi | Table `scroll={{x}}` di 26 halaman + Card-list untuk 2-3 halaman prioritas (Transaksi, Produk) | 2-3 |
| 4. POS Mobile | Grid 2 kolom (bagian dari fase 0), `PosCartDrawer` bottom sheet, touch target, `inputMode` numeric | 1-2 (setelah fase 0) |
| 5. Polish & Lighthouse | Touch gesture (swipe/pull-to-refresh/haptic), code splitting Vite, audit Lighthouse, test real device | 2 |
| **Total** | | **10-14 hari** |

*(Fase 0 ditambahkan di luar estimasi awal user karena ditemukan sebagai blocker nyata — tanpa fase ini, POS Kasir versi mobile dibangun di atas CSS yang sudah rusak.)*

---

## 8. Rekomendasi

- **Fase 0 dulu, bukan opsional**: perbaiki regresi CSS POS Kasir sebelum/bersamaan dengan mobile layout — keduanya menyentuh file yang sama (`Transactions/Create.jsx` dan komponen Pos), mengerjakan terpisah berarti kerja dua kali.
- **Jangan pakai plugin PWA instan** (`vite-plugin-pwa` dkk) — implementasi manual `sw.js` + `manifest.json` lebih terkontrol untuk strategi Network First yang wajib untuk data real-time (stok, saldo PPOB, harga) sesuai konteks retail Indonesia yang koneksinya sering tidak stabil.
- **Pertahankan desktop UX** — semua perubahan di `Layouts/Account.jsx` harus dijaga lewat `Grid.useBreakpoint`, jangan hilangkan `Sider` untuk breakpoint `lg`+; `PosCartDrawer` hanya aktif di mobile, desktop tetap pakai `PosCartPanel` inline seperti sekarang.
- **Gunakan AntD Grid responsive props** (`xs`, `sm`, `md`, `lg`, `xl`) sebagai standar — pola ini sudah benar dipakai di `Dashboard/Index.jsx` (`Col xs={24} sm={12} xl={6}`), jadikan acuan konsisten di semua halaman lain, bukan reinvent breakpoint sendiri di CSS.
- **Reuse, jangan duplikasi**: `MobileDrawer` reuse `useSidebarMenuItems`/`resolveMenuSelectedKey` dari `Sidebar.jsx`; `PosCartDrawer` membungkus `PosCartPanel`/`PosPaymentSummary` yang sudah ada (props sama), bukan komponen keranjang baru dari nol.
- **Test di Chrome DevTools mobile emulation** (sesuai rule proyek: verifikasi di `http://localhost:3000` setelah setiap perubahan signifikan) **+ real device Android** (mayoritas kasir di Indonesia pakai Android mid-range) — terutama untuk cek performa grid produk POS dan responsivitas Drawer.
- **Update dokumentasi**: setelah setiap fase selesai, catat keputusan di `docs/decisions.md` (misal: "kenapa manual SW bukan plugin"), progress di `docs/todo.md`, dan temuan/gotcha baru (misal soal `styles.css` mati) sebagai entri baru di `MEMORY.md` mengikuti format `POS-0xx`.

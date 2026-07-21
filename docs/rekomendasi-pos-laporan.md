# Rekomendasi Improvement: POS & Laporan

> Audit by: Claude Opus · Tanggal: 2026-07-20
> Scope: fitur **POS (Point of Sale)** & **Laporan (Sales / Profit / Stock)**
> Codebase: Laravel 12 + Inertia/React + MySQL

---

## Ringkasan Eksekutif

Secara arsitektur, fondasi POS ini **sudah kuat dan production-grade**: checkout terbungkus `CheckoutService` dengan `DB::transaction` + `lockForUpdate` pada cart, produk, dan akun PPOB (anti-oversell saat concurrent), WAC/COGS dihitung konsisten per baris, void mengembalikan stok via `stock_movements`, dan retur sudah menyesuaikan record `Profit`. Skor keseluruhan: **7.5/10** — solid di data integrity, tetapi **tertinggal di UX kasir dan insight bisnis**.

Kelemahan utama ada di dua area: (1) **workflow kasir** — setiap aksi keranjang (tambah/±/hapus) adalah full round-trip Inertia tanpa optimistic UI, tidak ada auto-add saat scan barcode, tidak ada input qty langsung, dan dropdown pelanggan memuat *semua* customer; (2) **laporan** — hanya ada 3 laporan berbasis tabel tanpa grafik, tanpa export, dan **tidak ada laporan "produk terlaris" / penjualan per produk-kategori** yang justru paling dibutuhkan pemilik toko.

**Top 3 rekomendasi:** (1) Laporan **Produk Terlaris & Penjualan per Produk/Kategori** (P0) — insight paling krusial yang belum ada; (2) **Auto-add saat scan barcode + input qty langsung + optimistic cart** (P0) — menghilangkan friction terbesar kasir; (3) **Fix data toko pada struk** (P1) — struk saat ini selalu mencetak alamat/telepon placeholder karena `Setting::storeSettings()` tidak diteruskan ke halaman struk.

---

## A. Analisis POS

### A1. Temuan & Observasi

**Arsitektur & data integrity (kuat)**
- `CheckoutService::checkout()` membungkus seluruh proses dalam `DB::transaction` dengan `lockForUpdate()` pada cart, produk fisik (termasuk komponen BOM service), dan akun PPOB → aman dari oversell & lost-update saat multi-kasir. (`app/Services/CheckoutService.php`)
- COGS per baris konsisten: fisik pakai `avg_cost` (WAC), service menjumlah `avg_cost × qty_per_unit` komponen, PPOB pakai `ppob_cost`. `Profit` dibuat saat checkout (cash) atau saat callback (digital).
- Void membalik stok berdasarkan `stock_movements type=out` (bukan per-detail) → benar untuk service/BOM; retur menyesuaikan `Profit` (`ReturnTransactionController` ~line 416). Ini poin positif yang sering salah di POS lain.
- Invoice unik via `random_bytes` + cek `do/while` (`generateTransactionInvoice`). Cukup untuk struk retail (bukan faktur pajak bernomor urut).

**UX Cashier (banyak friction)**
- **Tidak ada auto-add saat scan barcode.** Di `Create.jsx`, submit search hanya `router.get` yang me-*reload* grid produk; kasir tetap harus meng-klik tile. Untuk toko yang mengandalkan barcode scanner (ketik barcode + Enter), ini 2 langkah yang seharusnya 1. (`resources/js/Pages/Account/Transactions/Create.jsx` `handleSearch`)
- **Setiap operasi keranjang = full HTTP round-trip** tanpa optimistic UI: `addToCart`, `updateCart` (± qty), `deleteCart` semuanya `router.post/put/delete` yang mem-*reload* seluruh props halaman (produk paginate + carts + customers + ppob). Saat jam ramai / koneksi lambat, terasa lag di setiap klik.
- **Qty hanya bisa +/- satu-satu.** Tidak ada input angka langsung; menjual 24 pcs = 24 klik = 24 round-trip. (`pos-qty-stepper` di `Create.jsx`)
- **Dropdown pelanggan memuat SEMUA customer** setiap load POS: `Customer::latest()->get()` (`TransactionController::create`) lalu di-render ke `<select>`. Tidak ada search/typeahead, tidak ada "tambah pelanggan cepat" dari POS. Akan berat & tidak usable begitu customer > beberapa ratus.
- **Diskon hanya nominal flat**, tidak ada diskon persen dan tidak ada diskon per item.
- **Tidak ada hold / park sale** (menahan transaksi sementara pelanggan mengambil barang lain / mengantre).
- **Tidak ada shortcut keyboard** (mis. F2 = bayar, F4 = cari) — meskipun search sudah `autoFocus`.
- **`void_reason` tidak pernah diisi.** Kolom ada di `Transaction::$fillable` tetapi `CheckoutService::void()` tidak menyetelnya dan UI (`Show.jsx handleVoid`) tidak menanyakan alasan → audit void lemah.

**Kelengkapan fitur (gap vs POS modern)**
- **Metode bayar terbatas: `cash` & `digital` (Midtrans) saja.** Tidak ada pencatatan **QRIS statis**, transfer bank manual, atau EDC/kartu — padahal banyak toko Indonesia pakai QRIS statis (tanpa fee gateway). Tidak ada **split payment**.
- **Struk salah data toko (bug).** `Show.jsx` membaca `store.address`, `store.phone`, `store.receipt_paper_size`, dan logo dari upload settings, tetapi prop `store` yang di-*share* global (`HandleInertiaRequests::share`) hanya berisi `name` + `logo_url` dari `config('branding')`. `TransactionController::show()` tidak meneruskan `Setting::storeSettings()`. Akibatnya **struk selalu mencetak alamat "Jl. Contoh No. 123" & telp placeholder**, ukuran kertas selalu default 58mm, dan logo upload tidak muncul.
- **Tidak ada PWA / mode offline.** POS mati total jika internet putus (umum di retail Indonesia).

**Performance & edge cases**
- **Digital payment: stok dipotong sebelum pembayaran dikonfirmasi** (checkout, sebelum Snap token — lihat MEMORY POS-006). Jika pembayaran `expire`/`failed`, **stok tidak dikembalikan otomatis** dan transaksi menggantung `pending` selamanya bila callback Midtrans tak pernah tiba (webhook tak terkonfigurasi / gagal). Tidak ada job rekonsiliasi status ke Midtrans. Risiko: stok berkurang tanpa penjualan sah.
- **`Profit` untuk transaksi digital hanya tercatat saat callback.** Tanpa webhook yang andal, laporan profit kehilangan transaksi digital yang sebetulnya lunas.
- Grid produk mem-*eager-load* `components.componentProduct` untuk semua produk tiap halaman — aman di 12/halaman, tapi perhatikan bila paginasi diperbesar.

---

### A2. Rekomendasi POS

| Prioritas | Rekomendasi | Kenapa | Effort | Pendekatan |
|---|---|---|---|---|
| **P0** | **Auto-add produk saat scan barcode** (exact match) | Menghilangkan 1 langkah per item; scanner adalah alur inti kasir | S | Di `Create.jsx handleSearch`: jika hasil query barcode persis 1 & barcode == input, langsung `router.post('/account/carts', ...)` alih-alih hanya reload grid. Opsi backend: endpoint `carts/scan` yang cari by barcode & tambah dalam 1 request. |
| **P0** | **Input qty langsung di keranjang** (ketik angka, bukan cuma ±) | Jual banyak unit tanpa puluhan klik/round-trip | S | Ganti `<span>{cart.qty}</span>` jadi `<input type=number>` dengan debounce → `router.put('/account/carts/{id}', {qty})`. Backend `UpdateCartRequest` sudah validasi qty. |
| **P0** | **Optimistic cart + debounce** untuk add/±/hapus | Menghilangkan lag terbesar saat jam ramai | M | State keranjang lokal di React; kirim mutasi ke server di background dengan rollback saat error. Atau minimal `only: ['carts']` pada request Inertia agar tak reload grid+customers tiap klik. |
| **P0** | **Customer typeahead + "Tambah Pelanggan Cepat"** | `Customer::latest()->get()` tak scalable; select penuh tak usable | M | Endpoint `customers/search?q=` (limit 20). Ganti `<select>` jadi combobox async di `Create.jsx`. Tambah modal quick-create (nama + no HP) memakai `CustomerController@store`. Hapus load-all di `TransactionController::create`. |
| **P1** | **Fix data toko pada struk** | Struk saat ini cetak alamat/telepon/logo/ukuran kertas placeholder | S | Teruskan `Setting::storeSettings()` sebagai prop `store` di `TransactionController::show()` **atau** pindahkan ke `HandleInertiaRequests::share()` (cache). |
| **P1** | **Catat metode bayar QRIS statis & transfer manual** | Mayoritas toko pakai QRIS statis tanpa fee gateway; kini tak terekam | M | Tambah opsi `payment_method` (mis. `qris`, `transfer`) di enum + `StoreTransactionRequest` + toggle UI. Perlakukan seperti `cash` (langsung `paid`) dengan `payment_channel` sesuai. Sesuaikan filter laporan. |
| **P1** | **Reconciliation job untuk transaksi digital pending** | Cegah stok terpotong tanpa penjualan sah bila callback gagal | M | Scheduled command (`transactions:reconcile`) cek status ke Midtrans untuk `payment_status=pending` & `payment_method=digital` yang > N menit; set `expired`/`failed` lalu balik stok (reuse logika void), atau `paid` + isi `Profit`. |
| **P1** | **Wajib alasan saat void** | Audit & kontrol kecurangan | S | `Show.jsx handleVoid` tambah input `Swal` untuk alasan; kirim ke `transactions.void`; `CheckoutService::void()` set `void_reason`. Kolom sudah ada. |
| **P1** | **Diskon persen + diskon per item** | Kebutuhan promo umum | M | UI toggle nominal/persen di `Create.jsx`; simpan diskon per `TransactionDetail` (kolom baru) bila per-item; sesuaikan subtotal & COGS. |
| **P2** | **Hold / Park sale** | Layani antrean tanpa membatalkan keranjang | M | Flag `status=held` pada baris `carts` atau tabel `held_transactions`; tombol "Tahan" & daftar transaksi tertahan di POS. |
| **P2** | **Shortcut keyboard** (F2 bayar, F3 fokus cari, Esc tutup modal) | Kecepatan kasir berpengalaman | S | `keydown` listener di `Create.jsx`. |
| **P2** | **Cash shortcut & pembulatan lebih pintar** | Kurangi salah hitung kembalian | S | Perluas `cashOptions` (kelipatan realistis dari grand total). |
| **P3** | **PWA / mode offline** untuk POS | Tetap jualan saat internet putus | XL | Service worker + antrean transaksi lokal (IndexedDB) + sinkronisasi. Perlu desain konflik stok. |

---

## B. Analisis Laporan

### B1. Temuan & Observasi

**Insight bisnis (gap terbesar)**
- **Hanya ada 3 laporan: Sales, Profit, Stock**, semuanya berupa **daftar transaksi + kartu ringkasan**. Tidak ada satupun agregasi/pengelompokan.
- **TIDAK ADA laporan "Produk Terlaris" / penjualan per produk / per kategori.** Ini justru insight #1 untuk pemilik retail (apa yang harus di-restock, apa yang mati). Data tersedia penuh di `transaction_details` tapi tak pernah di-*group*.
- **Tidak ada grafik sama sekali** — tak ada tren penjualan harian/jam, tak ada visual komposisi cash vs digital vs PPOB. Semua angka mentah dalam tabel.
- **Tidak ada laporan PPOB terpisah** walau PPOB adalah aliran pendapatan berbeda dengan margin `admin_fee`. `TransactionDetail` punya `ppob_cost` & `admin_fee`, tapi tidak ada laporan volume/omzet/fee PPOB.
- **Tidak ada laporan pengeluaran (expense) analitik.** `Expense` hanya CRUD; laporan profit cuma menampilkan total netto, tak ada breakdown per kategori/waktu.
- **Tidak ada laporan pelanggan** (top customer, frekuensi, nilai) walau data customer dikumpulkan.
- **Tidak ada dead-stock / stock aging / saran reorder** di laporan stok (baru ada filter low/out).

**UX & readability**
- **Tidak ada preset tanggal** (Hari ini, Kemarin, Minggu ini, Bulan ini, Bulan lalu). Default `startOfMonth → now`; selain itu harus pilih tanggal manual. (`SalesReportController`, `ProfitReportController`)
- **Tidak ada export** Excel/CSV/PDF di ketiga laporan — padahal `maatwebsite/excel` **sudah terpasang** (dipakai import produk), jadi export adalah low-hanging fruit yang sangat diminati pemilik toko.
- **Tidak ada drill-down** dari kartu ringkasan ke detail.
- Laporan Sales/Profit rapi & scoping admin-vs-kasir sudah benar (kasir hanya lihat data sendiri).

**Konsistensi metrik (minor)**
- `average_sale` = `net_sales / total_transactions` (net setelah retur) dibagi *count kotor* → sedikit tidak konsisten (net atas gross). (`SalesReportController`)
- `profit_margin` = gross_profit/total_revenue (belum memperhitungkan expense sebagai % margin bersih). (`ProfitReportController`)

**Performance**
- `SalesReportController` memanggil `calculateApprovedReturns()` **3×** (net, cash, digital) → 3 query retur terpisah tiap load. Bisa dikonsolidasi jadi 1 query group-by `payment_method`.
- Ringkasan `total_items` memakai `join` terpisah dari query utama; wajar tapi bisa disatukan.
- Stock report menghitung `inventory_sell_value` via query join `product_units` terpisah setelah `pluck('id')` — dua kali jalan; bisa disatukan.

---

### B2. Rekomendasi Laporan

| Prioritas | Rekomendasi | Kenapa | Effort | Pendekatan |
|---|---|---|---|---|
| **P0** | **Laporan Produk Terlaris & Penjualan per Produk/Kategori** | Insight paling krusial untuk restock & buang produk mati; kini tak ada | M | Controller baru `ProductSalesReportController` group-by `transaction_details.product_id` (join `transactions` yang `paid` & non-void, filter tanggal) → qty terjual, omzet, COGS, laba, margin. Sub-tab per kategori. View `Reports/ProductSales.jsx`. Route+permission `reports.sales`. |
| **P0** | **Grafik tren penjualan harian/jam** di laporan Sales | Owner butuh pola waktu (jam sibuk, hari ramai) | M | Tambah dataset `salesByDay` (group `DATE(COALESCE(paid_at,created_at))`) & `salesByHour` di `SalesReportController`; render chart (mis. `recharts`) di `Sales.jsx`. |
| **P1** | **Export Excel/CSV** di semua laporan | Sangat diminta pemilik toko; lib sudah ada | S–M | Buat `Exports/SalesReportExport`, `ProfitReportExport`, `StockReportExport` (Maatwebsite Excel, `FromQuery`/`WithHeadings`), tombol "Export" yang meneruskan filter aktif. Pola sama seperti `ProductImportController`. |
| **P1** | **Preset rentang tanggal** (Hari ini/Kemarin/Minggu ini/Bulan ini/Bulan lalu) | Menghilangkan friction pilih tanggal manual | S | Komponen date-preset dipakai bersama di ketiga view; set `start_date`/`end_date` lalu submit. Tanpa perubahan backend. |
| **P1** | **Laporan PPOB terpisah** (volume, omzet, admin fee, laba) | PPOB aliran pendapatan & margin khusus, kini tak terlihat | M | Query `transaction_details WHERE ppob_cost IS NOT NULL` group per produk/tanggal → qty, omzet, total `admin_fee`, cost. Gabungkan mutasi saldo dari `ppob_balance_logs`. View `Reports/Ppob.jsx`. |
| **P1** | **Laporan Pengeluaran (Expense) analitik** | Lengkapi gambaran laba bersih; breakdown per kategori/waktu | S–M | Controller laporan expense group-by kategori & bulan + tren; atau perluas `Reports/Profit.jsx` dengan rincian expense. Data dari `Expense`. |
| **P2** | **Laporan Pelanggan** (top customer, frekuensi, total belanja) | Dasar program loyalitas / follow-up | M | Group `transactions` by `customer_id`; tampilkan omzet, jumlah transaksi, rata-rata, kunjungan terakhir. |
| **P2** | **Dead stock & saran reorder** di laporan Stok | Kurangi modal mengendap & kehabisan stok | M | Tambah kolom "hari sejak pergerakan terakhir" (dari `stock_movements`), tandai dead stock (> N hari tanpa `out`); saran reorder = di bawah low_threshold. |
| **P2** | **Drill-down kartu ringkasan → detail terfilter** | Navigasi analitik lebih cepat | S | Jadikan kartu ringkasan sebagai link dengan filter ter-set (mis. klik "Digital" → filter payment_method=digital). |
| **P3** | **Konsolidasi query retur & perbaikan metrik** | Rapikan performa & konsistensi | S | Satukan 3 panggilan `calculateApprovedReturns` jadi 1 group-by; luruskan basis `average_sale`; tambah net margin %. |

---

## C. Quick Wins (Top 5)

Lima rekomendasi paling *impactful* yang bisa diimplementasi paling cepat:

1. **Fix data toko pada struk** (P1, **S**) — teruskan `Setting::storeSettings()` ke `TransactionController::show()`. Sekali edit kecil, struk langsung menampilkan nama/alamat/telepon/logo/ukuran kertas yang benar. *File:* `app/Http/Controllers/Account/TransactionController.php`.

2. **Auto-add saat scan barcode** (P0, **S**) — bila query barcode menghasilkan tepat 1 produk dengan barcode sama persis, langsung tambah ke keranjang. Menghapus friction inti kasir. *File:* `resources/js/Pages/Account/Transactions/Create.jsx` (+ opsional endpoint scan di `CartController`).

3. **Input qty langsung di keranjang** (P0, **S**) — ganti stepper-only jadi input angka ber-debounce. Jual banyak unit tanpa puluhan klik. *File:* `Create.jsx` (backend `UpdateCartRequest` sudah siap).

4. **Export Excel laporan** (P1, **S–M**) — `maatwebsite/excel` sudah terpasang; tambahkan kelas Export + tombol pada Sales/Profit/Stock. Fitur yang paling sering diminta pemilik toko. *File:* `app/Exports/*`, controller & view laporan.

5. **Laporan Produk Terlaris** (P0, **M**) — satu controller group-by `transaction_details` + view. Membuka insight bisnis terpenting yang saat ini hilang total. *File:* `app/Http/Controllers/Account/ProductSalesReportController.php`, `resources/js/Pages/Account/Reports/ProductSales.jsx`, `routes/web.php`.

---

### Catatan penutup
Prioritaskan **P0 POS (barcode + qty)** dan **P0 Laporan (produk terlaris)** lebih dulu — keduanya berdampak harian langsung ke kasir dan pemilik dengan effort kecil–sedang. Bug struk & export adalah *quick win* yang memberi kesan "profesional" dengan usaha minimal. Isu integritas data digital-pending (reconciliation) sebaiknya masuk sprint berikutnya sebelum volume transaksi digital naik.

---

## D. Status Implementasi (2026-07-21)

Audit di atas menggambarkan kondisi **sebelum** implementasi. Status terkini:

| Area | Status |
|---|---|
| POS P0 (barcode, qty, customer typeahead, optimistic cart) | Done |
| POS P1 (struk, QRIS/transfer, void reason, reconcile, diskon %) | Done |
| POS P1 diskon per item | Done (`carts.discount` + `transaction_details.discount_*`) |
| POS P2 (hold sale, shortcuts, cash shortcuts) | Done |
| Laporan P0–P2 (produk terlaris, charts, export, preset, PPOB, expense, pelanggan, dead stock) | Done |
| Drill-down kartu Sales + filter qris/transfer | Done |
| Export Excel laporan baru (produk/PPOB/expense/pelanggan) | Done |
| DatePreset di Laporan Laba | Done |

**Belum dikerjakan (out of scope / XL):**

- Split payment
- EDC / kartu
- PWA / mode offline

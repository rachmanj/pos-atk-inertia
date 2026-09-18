# Spec: Produk Cepat di POS Kasir (tombol produk sering dipakai)

Status: **disetujui Iwan** (grill 17 Sep 2026 — "setuju semua"). Kerjakan di **salinan dev** dulu (`~/pos-atk-dev`, situs http://dea-geekom.tail8334ce.ts.net:8081), deploy ke produksi hanya setelah Iwan setuju.

## Masalah
Panel kiri POS kosong sebelum kasir mengetik pencarian. Produk paling sering dijual (FOTOCOPY HITAM PUTIH 1.265 pcs/65 nota dalam 30 hari, PRINT HITAM PUTIH 583 pcs, PRINT WARNA 90 pcs, dst.) harus selalu dicari ulang dengan mengetik.

## Keputusan (hasil grill)
1. **Isi tombol**: otomatis dari produk terlaris 30 hari terakhir (maks 12) **+ bisa di-pin manual** per produk; yang di-pin tampil lebih dulu.
2. **Perilaku klik**: muncul panel **jumlah cepat** (tombol −/+, preset 1/5/10/20/50, tombol Tambah) lalu masuk keranjang. Produk yang punya >1 satuan tetap memakai modal satuan yang sudah ada; produk PPOB membuka modal PPOB yang sudah ada.
3. **Redesign tahap 1 = area kiri POS saja.** Header, keranjang, pembayaran tidak diubah.
4. Produk PPOB **tidak** masuk daftar otomatis (alur inputnya beda), tapi boleh di-pin manual.
5. Data penjualan untuk peringkat dihitung dari `transaction_details` pada transaksi non-void, 30 hari terakhir.

## Rancangan teknis
- **Migrasi**: `products.is_quick_access` (boolean, default 0) + `products.quick_access_order` (unsigned smallint, default 0) — dipakai untuk pin manual dan urutan.
- **Service** `app/Services/QuickProductService.php`:
  - `pinned()` → produk `is_quick_access=1` dan `is_active=1`, urut `quick_access_order`, `title`.
  - `auto()` → top produk (bukan PPOB, `is_active=1`) berdasarkan `SUM(transaction_details.qty)` 30 hari, non-void; dikurangi yang sudah di-pin; batas `MAX_QUICK_PRODUCTS = 12` total.
  - `forPos()` → gabungan pinned + auto (total ≤ 12) dengan data: id, title, harga jual (satuan jual default), jumlah satuan, product_type, stok.
- **Controller**: `TransactionController@create` mengirim prop `quickProducts`; endpoint baru `POST /account/products/{product}/quick-access` (toggle pin, permission `products.edit`).
- **UI**: `PosProductGrid.jsx` — saat `searchQuery` kosong tampilkan panel "Produk Cepat" (grid kartu: nama + harga). Klik → panel jumlah cepat (inline, bukan modal penuh) untuk produk 1 satuan; modal satuan/PPOB untuk kasus lain. Pencarian tidak berubah.
- **Master produk**: kolom/tombol "Produk Cepat" (pin/unpin) di halaman Produk.

## Kriteria selesai
- POS kosong → tombol produk cepat muncul (pinned dulu, lalu terlaris), klik → atur jumlah → masuk keranjang dengan harga benar.
- Test: service (pin vs auto, urutan, batas 12, PPOB dikecualikan), endpoint toggle pin (izin), dan prop `quickProducts` di halaman POS.
- `npm run build` + `php artisan test` hijau; verifikasi Playwright di situs dev.

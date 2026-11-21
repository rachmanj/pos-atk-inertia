# Spec: Barang Konsinyasi (titipan supplier)

**Status:** SEMUA 7 FASE SELESAI & terverifikasi end-to-end (fase 6 `b7ebcf7`; fase 1 `a443073`, fase 2 `89bf323`, fase 3 `dc53284`, fase 4 `f8280fc`, fase 5 `2f3fb4f`). Uji E2E 21 Nov 2026: terima 10 → jual 4 → bayar 10.000 → retur 3 → laporan & export cocok, semua data uji dibersihkan.
Dibuat: 21 Nov 2026 · Sesi: POS VASIA (pos-atk) · Grill: 2 ronde, 10 keputusan, semua dijawab.

---

## 1. Goal

Toko bisa menerima barang **titipan supplier** (dibayar hanya kalau laku), menjualnya lewat POS seperti barang biasa, mencatat **utang muncul otomatis saat terjual**, membayar supplier, dan melihat sisa barang titipan per supplier — tanpa mengubah cara kasir berjualan.

## 2. Scope

**In (fase 1–7)**
- Penerimaan barang titipan (header + baris per produk, qty + harga konsinyasi)
- Stok produk bertambah saat penerimaan; kepemilikan dilacak terpisah
- Penjualan: HPP memakai harga konsinyasi (titipan dulu, FIFO), sisa qty titipan berkurang, utang ke supplier bertambah
- Halaman **Utang Konsinyasi** + pembayaran ke supplier (alokasi FIFO per baris titipan)
- Retur barang titipan yang tidak laku (tanpa membuat utang)
- Laporan Konsinyasi per supplier: dititip · terjual · utang belum dibayar · sisa — + rincian per produk/penerimaan + export Excel

**Out (tidak dikerjakan sekarang)**
- Multi-gudang / lokasi rak (aplikasi belum punya konsep gudang)
- Bagi hasil persen (diputuskan: harga beli tetap per pcs)
- Notifikasi otomatis ke supplier (WhatsApp/Telegram) — bisa jadi fase lanjutan terpisah
- Perubahan pada modul Pembelian Supplier & Retur Supplier yang sudah ada (kecuali penyesuaian nullability untuk retur konsinyasi)

## 3. Tech decisions

| # | Keputusan | Jawaban Iwan |
|---|---|---|
| Q1 | Model stok | **1a** — produk dipakai apa adanya; kepemilikan di tabel `consignment_items` (bukan batch/lot, bukan gudang terpisah) |
| Q2 | Kapan utang diakui | **2a** — otomatis **saat barang terjual** |
| Q3 | Dasar nilai | **3a** — **harga beli tetap per pcs** (tanpa bagi hasil) |
| Q4 | HPP & laba | **4a** — HPP transaksi memakai harga konsinyasi, **`products.avg_cost` / `buy_price` TIDAK diubah** |
| Q5 | Barang tak laku | **5a** — pakai tabel `supplier_returns` yang ada, ditambah penanda konsinyasi |
| Q6 | Penerimaan menambah stok | **6a** — ya, `products.stock` bertambah + `stock_movements` type `in` |
| Q7 | HPP saat stok campuran | **7a** — **titipan dulu (FIFO tanggal terima)**, baru stok milik sendiri |
| Q8 | Pembayaran supplier | **8a** — tabel + halaman baru "Utang Konsinyasi" per supplier |
| Q9 | Jejak penjualan titipan | **9a** — kolom `transaction_details.consignment_item_id` (+ qty konsinyasi) |
| Q10 | Isi laporan | **10a+** — per supplier (dititip/terjual/utang/sisa) + rincian per produk & penerimaan + **export Excel** |

## 4. DB changes (satu migrasi per fase, jalankan di DB live saat itu juga)

### 4.1 Tabel baru

```sql
consignments            -- header penerimaan barang titipan
  id, supplier_id FK, user_id FK, code UNIQUE (CON-YYYYMMDD-XXXXXX),
  received_date DATE, note TEXT NULL, status ENUM('open','closed') DEFAULT 'open',
  created_at, updated_at

consignment_items       -- baris per produk per penerimaan
  id, consignment_id FK cascade, product_id FK restrict,
  qty_in INT (qty dasar/pcs), qty_sold INT DEFAULT 0, qty_returned INT DEFAULT 0,
  cost_price BIGINT (harga konsinyasi per unit dasar),
  created_at, updated_at
  INDEX (product_id), INDEX (consignment_id)
  -- invariant aplikasi: qty_sold + qty_returned <= qty_in

consignment_payments    -- pembayaran ke supplier
  id, supplier_id FK, user_id FK NULL, paid_on DATE, amount BIGINT,
  method VARCHAR(30) ('tunai','transfer'), note TEXT NULL, created_at, updated_at

consignment_payment_items  -- alokasi pembayaran ke baris titipan (audit FIFO)
  id, consignment_payment_id FK cascade, consignment_item_id FK restrict,
  qty INT, amount BIGINT, created_at, updated_at
```

### 4.2 Kolom baru

```sql
ALTER TABLE transaction_details
  ADD consignment_item_id BIGINT UNSIGNED NULL AFTER ppob_cost,
  ADD consignment_qty INT NOT NULL DEFAULT 0 AFTER consignment_item_id,
  ADD CONSTRAINT fk_td_consignment_item FOREIGN KEY (consignment_item_id)
      REFERENCES consignment_items(id) ON DELETE RESTRICT;
  -- INDEX (consignment_item_id)

ALTER TABLE supplier_returns
  MODIFY purchase_id BIGINT UNSIGNED NULL,
  ADD consignment_id BIGINT UNSIGNED NULL AFTER purchase_id;
ALTER TABLE supplier_return_details
  MODIFY purchase_detail_id BIGINT UNSIGNED NULL,
  ADD consignment_item_id BIGINT UNSIGNED NULL AFTER purchase_detail_id;
```

**Catatan penting:** `supplier_returns.purchase_id` dan `supplier_return_details.purchase_detail_id` sekarang **NOT NULL**. Supaya retur konsinyasi bisa memakai tabel ini (keputusan Q5a), keduanya harus dibuat nullable — retur pembelian lama tetap jalan karena relasinya hanya diisi untuk retur pembelian. Tabel retur saat ini **0 baris**, jadi tidak ada data yang perlu dimigrasi.

### 4.3 Izin (migrasi grant, pola `2026_09_19_150846_add_purchases_edit_permission.php`)

| Permission | admin | cashier |
|---|---|---|
| `consignments.index` | ✓ | – |
| `consignments.create` | ✓ | – |
| `consignments.show` | ✓ | – |
| `consignment_payments.create` | ✓ | – |
| `reports.consignment` | ✓ | – |

Kasir **tidak** diberi izin apa pun di modul ini: penjualan barang titipan terjadi lewat POS yang sudah ada, tanpa langkah tambahan.

## 5. Perilaku inti

### 5.1 Penerimaan (fase 2)
- Form: supplier, tanggal terima, catatan, lalu baris: produk (search), qty (satuan jual), harga konsinyasi per satuan.
- Simpan → `consignments` + `consignment_items` (qty dikonversi ke unit dasar seperti pembelian), `products.stock += qtyDasar`, `stock_movements` type `in`, `reference_type = App\Models\Consignment`.
- `products.buy_price` / `avg_cost` **tidak disentuh**.

### 5.2 Penjualan (fase 3) — hook di `CheckoutService`
Saat ini (baris 363–402): cek stok → `buy_price = product.avg_cost` → `stock -= qty` → `stock_movements` out.
Tambahan:
1. Sebelum menetapkan HPP, cari `consignment_items` untuk produk itu dengan `qty_in - qty_sold - qty_returned > 0`, urut `consignments.received_date, consignment_items.id` (FIFO).
2. Kalau ada sisa titipan:
   - satu baris detail mengonsumsi **satu** `consignment_item`; kalau qty melebihi sisa item itu, checkout **memecah** baris detail menjadi beberapa baris (produk sama, `consignment_item_id` berbeda), sisanya baru memakai `avg_cost`.
   - `transaction_details.buy_price` per baris = harga item konsinyasi (atau `avg_cost` untuk bagian milik sendiri), `consignment_item_id` + `consignment_qty` terisi.
   - `consignment_items.qty_sold += qty`.
3. `products.stock` tetap berkurang seperti biasa (barang fisik keluar).
4. Kalau tidak ada sisa titipan → perilaku lama, tidak berubah.

### 5.3 Utang & pembayaran (fase 4)
- Utang supplier = `Σ(qty_sold × cost_price) − Σ(allocated amount)` pada item yang sudah terjual.
- Halaman **Utang Konsinyasi**: per supplier → daftar item terjual & belum dibayar (FIFO), total utang, tombol **Bayar** (tanggal, nominal, metode).
- Pembayaran mengalokasikan FIFO ke item yang belum lunas dan menulis `consignment_payment_items`. Nominal tidak boleh melebihi total utang supplier itu.

### 5.4 Retur (fase 5)
- Dari halaman detail konsinyasi → "Retur ke supplier": pilih item + qty (maks sisa).
- Menulis `supplier_returns` (`consignment_id` terisi, `purchase_id` NULL) + `supplier_return_details` (`consignment_item_id` terisi).
- Efek: `consignment_items.qty_returned += qty`, `products.stock -= qty`, `stock_movements` type `out`. **Tidak** membuat utang dan **tidak** mengubah `avg_cost`.

### 5.5 Laporan (fase 6)
`/account/reports/consignment` — filter rentang tanggal + supplier:
- Ringkasan per supplier: qty dititip, qty terjual, qty retur, sisa, nilai utang belum dibayar.
- Rincian per penerimaan & per produk.
- Export Excel (`ConsignmentReportExport`, pola `ExpenseReportExport`).

## 6. API / rute

| Method | Rute | Izin |
|---|---|---|
| GET | `/account/consignments` | `consignments.index` |
| GET | `/account/consignments/create` | `consignments.create` |
| POST | `/account/consignments` | `consignments.create` |
| GET | `/account/consignments/{id}` | `consignments.show` |
| POST | `/account/consignments/{id}/returns` | `consignments.show` |
| GET | `/account/consignment-payables` | `consignment_payments.create` |
| POST | `/account/consignment-payments` | `consignment_payments.create` |
| GET | `/account/reports/consignment` | `reports.consignment` |
| GET | `/account/reports/consignment/export` | `reports.consignment` |

Menu baru di `resources/js/Utils/navMenu.js`: **Konsinyasi** (grup *Transaksi Supplier*) + **Laporan Konsinyasi** (grup *Laporan*).

## 7. Risks

| Risiko | Mitigasi |
|---|---|
| Checkout hook menyentuh jalur paling sensitif (semua penjualan) | Fase 3 wajib uji regresi: penjualan barang non-konsinyasi harus 100% sama (HPP, stok, laba, struk) sebelum & sesudah |
| Pemecahan baris detail bisa membingungkan struk | Struk tetap menampilkan nama produk sama; uji cetak/struk setelah fase 3 |
| `avg_cost` tertimpa kalau hook salah | Kriteria terima: `avg_cost`/`buy_price` produk tidak berubah sesudah penerimaan **dan** sesudah penjualan |
| Stok bertambah tapi barang titipan tidak tercatat (input stok manual) | Penerimaan HANYA lewat modul konsinyasi; dokumentasikan di panduan kasir |
| Utang dobel kalau penjualan diedit/di-void | Void/edit belum ada di POS; kalau nanti ada, hook konsinyasi harus ikut membalik `qty_sold` — catat sebagai backlog |
| Retur memakai `supplier_returns` yang NOT NULL | Migrasi fase 5 membuat `purchase_id`/`purchase_detail_id` nullable (0 baris data, aman) |

## 8. Fase pekerjaan (satu fase = satu prompt agent + satu commit)

1. **Fase 1 — DB & model (penulis):** 4 migrasi (tabel baru, kolom `transaction_details`, kolom retur, grant izin) + model `Consignment`, `ConsignmentItem`, `ConsignmentPayment`, `ConsignmentPaymentItem` + relasi. Bukti: `information_schema` menunjukkan tabel/kolom ada, migrasi `down()` terbukti jalan di DB scratch.
2. **Fase 2 — Penerimaan titipan (penulis + UI):** controller + halaman index/create/show, penambahan stok + `stock_movements`.
3. **Fase 3 — Hook penjualan (penulis, PALING BERISIKO):** ubah `CheckoutService` (FIFO titipan, pemecahan baris, `consignment_item_id`, `qty_sold`), plus uji regresi penjualan biasa.
4. **Fase 4 — Utang & pembayaran (penulis + UI):** halaman `consignment-payables`, alokasi FIFO, `consignment_payment_items`.
5. **Fase 5 — Retur konsinyasi (penulis):** alur retur memakai `supplier_returns` + penyesuaian stok.
6. **Fase 6 — Laporan + export (pembaca):** halaman laporan + `ConsignmentReportExport`.
7. **Fase 7 — Uji live end-to-end (pembaca/verifikasi):** satu siklus penuh dengan data uji, lalu bersihkan (pola `references/workflow-dan-displin.md`).

## 9. Kriteria diterima (bukti nyata, bukan "build sukses")

Dengan produk uji `TEST-KONSINYASI` (stok awal 0, `avg_cost` 0):

1. **Penerimaan** 10 pcs @ Rp 5.000 → `consignment_items.qty_in = 10` · `products.stock = 10` · `products.avg_cost` **tetap 0** · 1 baris `stock_movements` type `in` · `purchase` tidak bertambah.
2. **Penjualan** 3 pcs @ Rp 8.000 → `transaction_details.consignment_item_id` terisi · `buy_price = 5.000` · `consignment_items.qty_sold = 3` · `products.stock = 7` · laba transaksi = **9.000** · `profits.total_cost = 15.000`.
3. **Stok campuran**: setelah stok sendiri 5 pcs (`avg_cost` 6.000) ditambahkan, jual 8 pcs → 10 pcs pertama dari titipan (sisa titipan 7) → **7 pcs** harga 5.000 + **1 pcs** harga 6.000, dua baris detail, `qty_sold = 10`.
4. **Utang**: utang supplier = 10 × 5.000 = **Rp 50.000**; halaman Utang Konsinyasi menampilkan angka itu.
5. **Pembayaran** Rp 50.000 tunai → `consignment_payments.amount = 50.000`, `consignment_payment_items` mengalokasikan 10 qty, sisa utang **0**.
6. **Retur** 5 pcs sisa → `qty_returned = 5`, `products.stock` turun 5, `supplier_returns.consignment_id` terisi, **utang tidak berubah**.
7. **Laporan**: angka laporan = hasil query SQL manual (`qty_in`, `qty_sold`, `qty_returned`, `sisa`, `utang`) untuk supplier yang sama.
8. **Regresi**: transaksi barang **non-konsinyasi** sebelum vs sesudah fase 3 — `buy_price`, `stock`, `profits` identik (uji 3 transaksi nyata yang sudah ada, bandingkan angkanya).
9. Izin: user `cashier` membuka `/account/consignments` → **403**; `admin` → 200.

## 10. Prasyarat dari Iwan

1. **Izin mulai** — bilang "mulai" sesudah membaca spec ini.
2. **Contoh nyata** (untuk fase 2): 1 supplier + 2–3 produk yang biasa dititipkan beserta harga konsinyasi per pcs.
3. Konfirmasi apakah **kasir** boleh melihat sisa titipan di halaman produk (default Dea: tidak; hanya admin).
4. Konfirmasi apakah pembayaran supplier titipan boleh lewat **transfer bank** (default Dea: ya, pilihan `tunai`/`transfer`).

## 11. Konteks yang sudah ada — jangan dibuat ulang

- `suppliers`, `purchases` + `purchase_payments` (pola pembayaran supplier)
- `products` (+`stock`, `avg_cost`, `buy_price`), `stock_movements`
- `CheckoutService` (jalur penjualan & HPP), `TransactionDetail`, `Profit`
- `supplier_returns` + `supplier_return_details` (dipakai untuk retur konsinyasi; 0 baris, aman diubah)
- Pola grant izin: migrasi `2026_09_19_150846_add_purchases_edit_permission.php`
- `resources/js/Utils/navMenu.js` untuk menu; `ExpenseReportExport` untuk export Excel

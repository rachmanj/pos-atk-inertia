# Spec: Multi Metode Pembayaran dalam 1 Struk — POS Kasir (VASIA)

Status: **menunggu persetujuan Iwan** (hasil grill 2 ronde, 16 Sep 2026 — semua 10 rekomendasi disetujui).
Repo: `~/pos-atk-inertia` (Laravel 12 + Inertia + React 19 + AntD 6).
Plan/diskusi: `~/.hermes/plans/20260916-multipayment-struk-pos-kasir.md`

---

## 1. Goal

Kasir bisa menerima pembayaran **satu struk dengan lebih dari satu metode** (contoh: Rp 50.000 tunai + Rp 50.000 QRIS) tanpa memecah menjadi dua transaksi — dan struk, rekap kas shift, laporan penjualan, laba, export, serta bot Telegram tetap **akurat per metode**.

## 2. Scope

**In scope**
- Metode yang boleh digabung: **Tunai, QRIS, Transfer** (maks **3 metode** per struk).
- Kembalian **hanya** boleh berasal dari bagian tunai.
- Bagian transfer → struk berstatus **menunggu konfirmasi** sampai admin konfirmasi; **sekali konfirmasi per struk**.
- Bagian QRIS dihitung **non-tunai** (mengikuti rekap yang jalan sekarang); input kembalian untuk QRIS dihapus dari UI.
- Struk cetak & notifikasi non-tunai menampilkan rincian pembayaran; notifikasi ke admin hanya menyebut **nominal bagian non-tunai**.
- Retur/refund struk campuran: kasir **memilih metode refund** (default bagian terbesar), partial refund tetap boleh, refund tunai mengurangi kas laci.
- Rilis ke semua kasir sekaligus, tapi fitur hanya muncul lewat tombol **"+ Tambah metode"** (alur satu metode tidak berubah).

**Out of scope (sengaja ditahan)**
- Digital/Midtrans sebagai bagian struk campuran (kanal terpisah — fase berikutnya kalau perlu).
- "Batal sebagian" — kalau gagal di tengah, **void seluruh struk** lalu buat struk baru.
- Migrasi/backfill struk lama: data historis tetap satu metode, dibaca lewat fallback.

## 3. Tech decisions

1. **Tabel baru `transaction_payments`** = satu-satunya sumber rincian pembayaran. Tidak ada nilai uang yang digandakan.
2. **Helper tunggal** `Transaction::paymentBreakdown(): array<method, amount>` yang membaca `transaction_payments`, dan **fallback** untuk baris lama (`payment_method` + `grand_total`). Semua konsumen yang menjumlah uang per metode wajib lewat helper ini.
3. `transactions.payment_method` untuk struk campuran diisi **`'split'`** (tidak menebak metode terbesar) — supaya konsumen yang terlewat tidak diam-diam membebankan seluruh nominal ke satu metode.
4. **Status agregat** transaksi: `paid` hanya bila **semua bagian** `paid`; kalau ada bagian `pending` → transaksi `pending` (bagian tunai tetap tercatat masuk laci).
5. `transactions.cash` / `transactions.change` tetap dipakai, artinya: uang diterima & kembalian **dari bagian tunai saja**.
6. **Guard test statis**: tes yang membaca sumber dan gagal bila ada penjumlahan uang ber-`groupBy('payment_method')` tanpa helper (mencegah laporan baru "lupa dibaca rincian").
7. Semua perubahan **additive**; jalur satu metode (dan struk lama) menghasilkan angka yang identik dengan hari ini.

## 4. DB changes

**Migrasi 1** — `create_transaction_payments_table`:

| kolom | tipe | keterangan |
|---|---|---|
| id | bigIncrements | |
| transaction_id | foreignId → transactions.id, cascadeOnDelete | |
| method | string(20) | `cash` / `qris` / `transfer` |
| amount | bigInteger | nominal bagian ini (bukan uang diterima) |
| payment_status | string(20) / enum | `pending` / `paid` / `failed` |
| channel | string(30) null | mis. `midtrans`, `manual` |
| reference | string(100) null | nomor referensi transfer / catatan |
| paid_at | timestamp null | |
| timestamps | | |
| index | `(transaction_id)`, `(method)` | |

- `transactions.payment_method` = varchar → **tidak perlu migrasi** untuk nilai `'split'`.
- **Tidak ada backfill.** Struk lama dibaca lewat fallback helper.
- Tidak ada kolom yang dihapus/diubah tipenya.

## 5. UI/UX

- **POS (`Components/Pos/PosPaymentSummary.jsx`)**: tombol **"+ Tambah metode"** (maks 3 baris); tiap baris = metode + nominal; baris tunai punya input uang diterima + kembalian; indikator **"Sisa: Rp X"** / peringatan bila total bagian ≠ total struk; tombol hapus baris; tombol kembali ke satu metode sebelum simpan.
- **Validasi server (`StoreTransactionRequest` + `CheckoutService`)**: total bagian = `grand_total` (422 bila tidak), tidak boleh ada bagian 0, maks 3 metode, kembalian hanya dari tunai, metode transfer tidak boleh dipakai dua kali.
- **Transaksi (`Transactions/Index.jsx`, `Show.jsx`)**: label metode = "Campuran" + rincian tiap bagian; badge "Menunggu Konfirmasi" bila ada bagian transfer pending; tombol Konfirmasi tetap satu per struk.
- **Struk cetak**: mencetak rincian pembayaran (mis. `Tunai Rp 50.000`, `QRIS Rp 50.000`).
- **Notifikasi non-tunai ke admin**: hanya nominal bagian non-tunai (per metode) + invoice.
- **Retur (`Returns/...`)**: pilihan metode refund (default bagian terbesar).
- **Bot Telegram**: `/pending` menampilkan **nominal bagian transfer saja**; `/transaksi` & `/laporan` dihitung dari rincian; `/help` tidak berubah.

## 6. API endpoints (internal — tidak ada endpoint publik baru)

| endpoint | perubahan |
|---|---|
| `POST /account/transactions` | payload opsional baru `payments: [{method, amount, cash_received?}]`; payload lama (satu metode) tetap didukung |
| `POST /account/transactions/{invoice}/confirm-transfer` | menandai **semua bagian transfer** struk itu jadi `paid`; bila tidak ada bagian pending lain → transaksi `paid` |
| `POST /account/transactions/{invoice}/void` | void membatalkan **semua bagian** (termasuk transfer yang belum dikonfirmasi) |
| `GET /account/cashier-shifts/active-summary`, `POST .../report/preview` | tidak berubah bentuk; isinya ikut rincian |
| Komponen rekap: `ShiftCashReconciliation`, `ShiftReportBuilder`, `ShiftLiveSummary` | `cash_sales` = jumlah bagian tunai; `non_cash` = jumlah bagian qris/transfer/digital; fallback ke logika lama untuk struk tanpa rincian |

## 7. Risks

1. **Laporan yang terlewat membaca kolom lama** → angka per metode meleset. Mitigasi: helper tunggal + guard test statis + audit daftar consumer (Lampiran A) + regresi semua test lama.
2. **Struk campuran dengan transfer pending** membuat rekap menghitung uang yang belum masuk (perilaku lama sudah begitu, tidak diubah di fase ini) → tetap ditandai `*menunggu konfirmasi — cek rekening*`.
3. **Kasir salah input bagian** (total tidak pas) → validasi keras di server + indikator "Sisa" di UI.
4. **Retur/void struk campuran** → harus memproses semua bagian; void = seluruh struk (tidak ada void sebagian).
5. **Cakupan perubahan besar** (25 file) → wajib test lengkap + uji Dea di app live sebelum diumumkan ke kasir.

---

## Lampiran A — daftar consumer `payment_method` (hasil audit, 25 file)

Wajib dibaca lewat helper rincian (jumlah uang per metode):
`SalesReportController` (19), `TelegramPosQueryService` (9), `SalesReportExport` (5), `ShiftReportBuilder` (4), `ShiftCashReconciliation` (3), `TransactionHistoryController` (3), `ShiftSalesReportExport` (3), `ShiftLiveSummary` (2), `Dashboard/Index.jsx` (2), `ReturnTransactionController` (2), `Returns/Show.jsx` (1), `ProfitReportController` (1), `ProfitReportExport` (1), `DashboardController` (1), `Reports/Sales.jsx` (9), `TelegramPpobSaleService` (1), `TelegramPpobIntent` (2).

Hanya pembuatan/validasi/tampilan label:
`CheckoutService` (2), `StoreTransactionRequest` (2), `Transactions/Create.jsx` (2), `Transactions/Index.jsx` (4), `Transactions/Show.jsx` (5), `Models/Transaction.php` (1), `Console/Commands/ReconcileTransactions.php` (1 — khusus Midtrans `digital`, tidak terpengaruh).

## Lampiran B — rencana pengujian

Test baru (wajib):
1. Simpan struk tunai+QRIS → rincian tersimpan, `payment_method='split'`, status `paid`, `cash`/`change` hanya dari bagian tunai.
2. Total bagian ≠ grand_total → 422. Bagian 0 → 422. 4 metode → 422. Kembalian dari bagian non-tunai → 422.
3. Struk tunai+transfer → transaksi `pending`; rekap shift: bagian tunai masuk laci, bagian transfer masuk non-tunai + bertanda menunggu; `/pending` menampilkan **nominal bagian transfer saja**; setelah konfirmasi → `paid`.
4. Void struk campuran → semua bagian batal, angka rekap kembali seperti sebelum struk.
5. Retur struk campuran dengan refund ke QRIS → tunai di laci tidak berubah; refund ke tunai → laci berkurang.
6. Struk lama (satu metode) menghasilkan angka identik dengan sebelum perubahan (regresi).
7. Guard test statis daftar consumer.

Uji live sebelum diumumkan: buat user + shift sementara, cetak struk campuran, cek rekap + bot `/pending`, lalu bersihkan data uji (user/shift/transaksi).

## Lampiran C — urutan pengerjaan (usulan)

1. Migrasi + model + helper rincian + fallback (+ test 1, 6).
2. CheckoutService + validasi (+ test 2, 3).
3. Rekap/kas/report/dashboard/export/bot membaca rincian (+ test 3, 4, 7).
4. UI POS (tombol tambah metode) + tampilan struk/notifikasi + retur (+ test 5).
5. Uji live dengan data sementara, lalu bersihkan; commit + push per langkah.

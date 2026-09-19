# Spec: Utang Supplier — status bayar, termin & catat pembayaran

Status: disetujui Iwan (19 Sep 2026). Kerjakan di salinan dev (`~/pos-atk-dev`), deploy produksi setelah Iwan setuju.

## Masalah
Modul Pembelian belum punya kolom status bayar/termin. Nota KEVINDO STATIONERY `PUR-20260919-B3A8D9` (Rp 602.250) belum dibayar, termin **N30** → jatuh tempo 19/10/2026, tetapi sistem tidak punya tempat untuk mencatatnya.

## Keputusan (jawaban Iwan)
1. **Catat tiap pembayaran** ke supplier (bisa bertahap) → status otomatis: **Belum Bayar / Sebagian / Lunas**.
2. **Termin per nota**: pilihan Tunai/N0, N14, N30, N60, atau tanggal jatuh tempo manual; **default N30**; jatuh tempo = tanggal nota + termin. Nota lama (Kantor Pos 14 Sep, CV Citra Utama 17 Sep) dianggap **lunas**.
3. Tampilan utang: kolom **Status + Jatuh Tempo** di daftar Pembelian; halaman **Laporan → Utang Supplier** (nota belum lunas, umur utang, total utang); **penanda di Dashboard** bila ada jatuh tempo ≤ 7 hari. **Tanpa notifikasi otomatis.**
4. Nota KEVINDO: Belum Bayar, N30, jatuh tempo 19/10/2026, sisa Rp 602.250.

## Rancangan teknis
- Migrasi `purchases`: `payment_status` enum('unpaid','partial','paid') default **'paid'** (agar nota lama tetap lunas) + `payment_term_days` smallint nullable + `due_date` date nullable.
- Tabel baru `purchase_payments`: purchase_id, user_id, paid_on (date), amount, method (tunai/transfer/…, string), note, timestamps.
- Model `Purchase`: relasi `payments()`, helper `paidAmount()`, `remaining()`, `isOverdue()`, `isDueSoon($days = 7)`.
- `PurchaseController@store`: terima `payment_term` (`0|14|30|60` atau tanggal manual) → simpan `payment_term_days` + `due_date`; status awal `unpaid` (kecuali Tunai/N0 → `paid`).
- Endpoint `POST /account/purchases/{purchase}/payments` (permission `purchases.edit`): validasi `paid_on`, `amount` (1…sisa), `method`, `note`; setelah simpan hitung ulang status.
- Halaman baru `GET /account/reports/purchase-payables` (Laporan → Utang Supplier) + export bila mudah: daftar nota belum lunas dengan umur utang (Belum jatuh tempo / 1–30 hari / >30 hari), total utang, filter supplier.
- Dashboard: kartu kecil "Utang jatuh tempo ≤ 7 hari" (jumlah nota + total).
- UI halaman Pembelian: kolom **Status** (tag warna) + **Jatuh Tempo** di daftar; di detail: status, jatuh tempo, daftar pembayaran, tombol **Catat Pembayaran** (modal) + sisa utang.
- Nota lama TIDAK diubah (tetap lunas), hanya nota KEVINDO yang diset belum bayar (data prod, dikerjakan Dea setelah deploy).

## Kriteria selesai
- Catat pembayaran sebagian → status Sebagian + sisa benar; pelunasan → Lunas; tidak bisa melebihi sisa.
- Jatuh tempo otomatis dari termin; nota tunai langsung lunas.
- Halaman Utang Supplier benar (umur utang, total), dashboard penanda muncul bila ada jatuh tempo ≤ 7 hari.
- Test baru untuk: due date dari termin, status awal, catat pembayaran (sebagian/penuh/lebih dari sisa ditolak), laporan utang + bucketing, penanda dashboard.
- `php artisan test` + `npm run build` hijau; verifikasi Playwright di situs dev dengan nota KEVINDO.

# Spec: Pengeluaran Kas Kasir diisi SEBELUM shift ditutup

Status: disetujui Iwan (17 Sep 2026). Dikerjakan di salinan dev (`~/pos-atk-dev`, branch baru dari `main`), deploy produksi setelah Iwan setuju.

## Masalah
Sekarang **Pengeluaran dari Laci** diisi di modal "Kirim Rekap Shift ke Telegram" — yaitu SETELAH shift ditutup. Akibatnya Kas Seharusnya yang dihitung saat tutup belum memasukkan pengeluaran (kasir harus mengoreksi Kas Aktual manual) dan angka rekap tidak konsisten.

## Keputusan (jawaban Iwan)
1. **Q1**: sediakan **dua-duanya** — tombol "Simpan Pengeluaran" yang bisa dipakai kapan saja selama shift terbuka, DAN pengeluaran ikut tersimpan otomatis saat tombol Tutup Shift ditekan.
2. **Q2**: pengeluaran **tidak wajib**; kalau ada baris dengan nominal ≥ 1, keterangan wajib diisi (aturan lama dipertahankan).
3. **Q3**: setelah shift ditutup pengeluaran terkunci (read-only) di halaman shift, TAPI **admin bisa membuka kembali shift yang sudah ditutup** (reopen) — setelah dibuka kembali, pengeluaran bisa diubah lagi.
4. **Q4**: **Kelebihan Uang dihitung otomatis** = Kas Aktual − Kas Seharusnya (tidak bisa dobel input). Kasir cukup mengisi Kas Aktual (uang fisik yang dihitung).

## Rancangan

### Backend
- `PUT /account/cashier-shifts/{shift}/expenses` (`cashier-shifts.expenses.save`, permission `cashier_shifts.close`, owner atau admin, hanya shift terbuka) → sinkronkan `cashier_shift_expenses` + `cashier_shifts.expense_amount`.
- `close()` menerima `expenses[]` opsional; **disimpan dulu**, baru Kas Seharusnya dihitung (sehingga pengeluaran ikut memengaruhi expected cash). Kas Aktual = uang fisik. Backend yang menghitung: `difference = actual_cash − expected_cash`, `cash_overage = max(0, difference)` (+ keterangan wajib bila > 0). Input `cash_overage` dari klien tidak dipakai lagi.
- `PUT /account/cashier-shifts/{shift}/reopen` (`cashier-shifts.reopen`) — **khusus admin** (`isAdminUser()`), wajib mengisi alasan. Set `status='open'`, `closed_at=NULL`, `difference=NULL`, `actual_cash=NULL`, `cash_overage=0`, `overage_note=NULL`, `expected_cash=NULL`; pengeluaran + transaksi tetap; alasan ditambahkan ke catatan shift sebagai jejak audit.

### UI (halaman detail shift)
- Kartu **Pengeluaran dari Laci** (tabel: Keterangan + Nominal, Tambah/Hapus baris, total, tombol **Simpan Pengeluaran**) di atas kartu TUTUP SHIFT, aktif saat shift terbuka.
- Kartu **TUTUP SHIFT**: tabel pengeluaran yang sama (perubahan yang belum disimpan ikut tersimpan saat tutup), input **Kas Aktual**, **Kas Seharusnya versi live** (kas awal + penjualan tunai − pengeluaran yang sedang diketik), **Kelebihan/Kekurangan otomatis** (read-only), keterangan wajib bila kelebihan > 0.
- Modal **Kirim Rekap**: tabel pengeluaran read-only + tautan "Ubah Pengeluaran" bila shift terbuka.
- Shift tertutup: tombol **Buka Kembali Shift** (admin) + modal alasan.

## Kriteria selesai
- Kas Seharusnya saat tutup sudah memasukkan pengeluaran; Kelebihan/Kekurangan otomatis; tidak ada cara dobel input.
- Pengeluaran bisa disimpan sebelum tutup, ikut tersimpan saat tutup, read-only setelah tutup, dan bisa diperbaiki setelah admin membuka kembali shift.
- Test baru untuk: simpan pengeluaran saat shift buka, tutup dengan pengeluaran (expected cash ikut turun, overage otomatis, keterangan wajib), tutup tanpa pengeluaran, tolak simpan saat shift tertutup, reopen oleh admin vs non-admin.
- `npm run build` + `php artisan test` hijau; verifikasi Playwright di situs dev.

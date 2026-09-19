# Spec: Pengeluaran dengan Sumber Dana (Kas Laci / Bank / Saldo PPOB)

Tanggal: 19 Sep 2026 · Status: disetujui Iwan (hasil grill-me, "setuju semua") · Rencana: dikerjakan di dev dulu

## Latar belakang
Modul Pengeluaran (`/account/expenses`, menu **Pengeluaran**) sudah ada (header `expenses` + baris `expense_lines` dengan kategori/judul/nominal), tetapi **belum punya kolom sumber dana**. Akibatnya biaya toko yang dibayar memakai **saldo PPOB KIOSK** (mis. internet, listrik) tidak bisa dicatat rapi: beban dan pemotongan saldo PPOB harus dicatat manual di dua tempat.

## Keputusan (hasil grilling)
1. **Sumber dana**: **Kas (Laci)**, **Bank (Transfer)**, **Saldo PPOB**.
2. **Sumber Kas** memotong **Kas Seharusnya** shift kasir yang sedang terbuka — tanpa dobel dengan fitur "Pengeluaran dari Laci". **Bank** dan **PPOB** tidak menyentuh kas laci.
3. **Siapa boleh input**: kasir boleh (pakai izin yang sudah ada: `expenses.create`/`expenses.index` + `ppob-balance-logs.store`). Pengaturan akun PPOB tetap admin (`ppob-accounts.edit`).
4. **Saldo PPOB kurang** dari nominal → **tolak** dengan pesan jelas (sistem tidak boleh minus).
5. **Laporan Biaya**: tambah kolom + filter + ringkasan **per sumber dana**; detail pengeluaran menampilkan bukti pemotongan saldo PPOB (tautan/riwayat saldo).

## Perubahan database
`expenses` (tabel yang sudah ada):
- `payment_source` enum('cash','bank','ppob') NOT NULL DEFAULT 'cash'
- `ppob_account_id` FK nullable → `ppob_accounts`
- `cashier_shift_id` FK nullable → `cashier_shifts` (diisi otomatis bila sumber kas & ada shift terbuka milik user tersebut)
- `balance_log_id` FK nullable → `ppob_balance_logs` (jejak potong/pengembalian saldo PPOB)
- Backfill catatan lama (saat ini 0 baris) → `payment_source='cash'`.

## Backend
- `ExpenseController@store/@update`
  - Validasi: `payment_source` wajib in cash/bank/ppob; `ppob_account_id` wajib bila `ppob` (dan harus akun yang ada).
  - Sumber **ppob**: dalam DB transaction, setelah header+lines tersimpan → `PpobBalanceService::recordMovement($account, 'adjustment', -$total, "Pengeluaran {$code}: {$ringkasanJudul}", reference = $expense)`; simpan `balance_log_id`. Bila saldo tidak cukup → batalkan transaksi, pesan: `Saldo PPOB tidak cukup (saldo Rp X, dibutuhkan Rp Y).`
  - Sumber **cash**: bila ada shift kasir **terbuka milik user yang menginput**, isi `cashier_shift_id`; bila tidak ada → tetap simpan tanpa shift (jangan gagal).
  - Sumber **bank**: tidak menyentuh saldo PPOB maupun kas shift.
- `@update`: bila nominal/sumber dana berubah → sesuaikan saldo PPOB (penyesuaian pengembalian + pemotongan baru, `balance_log_id` diperbarui agar selalu menunjuk entri terakhir).
- `@destroy`: bila sumber ppob → kembalikan saldo (penyesuaian positif, catatan `Pembatalan pengeluaran {code}`) lalu hapus.
- Shift: `ShiftLiveSummary` + `ShiftCashReconciliation` menghitung pengeluaran `payment_source='cash'` dengan `cashier_shift_id` = shift tersebut sebagai **pengurang Kas Seharusnya**, dengan bagian tersendiri di pratinjau/rekap: **"Pengeluaran Kas (Modul Pengeluaran)"**. Jangan hitung Pengeluaran Kas ini di ringkasan "Penjualan Tunai".
- `ExpenseReportController`: filter `payment_source`, kolom sumber dana, ringkasan per sumber dana; export Excel memuat sumber dana.

## UI
- `Pages/Account/Expenses/Create.jsx` & `Edit.jsx`: Select **Sumber Dana** (Kas (Laci) / Bank (Transfer) / Saldo PPOB); bila PPOB → Select **Akun PPOB** + info "Saldo saat ini Rp X" + peringatan bila nominal melebihi saldo.
- `Pages/Account/Expenses/Index.jsx`: kolom **Sumber Dana** (Tag).
- `Pages/Account/Reports/Expense.jsx`: kolom + filter sumber dana + kartu ringkasan per sumber dana.
- Bahasa UI: Indonesia. Tema tetap (jangan ubah design system).

## Tes wajib (DB sementara, jangan sentuh DB dev/produksi)
1. PPOB: saldo berkurang tepat sebesar total; ada log `adjustment` negatif; `balance_log_id` terisi.
2. PPOB saldo kurang: request ditolak, tidak ada pengeluaran & tidak ada log saldo.
3. PPOB edit nominal: saldo menyesuaikan (pengembalian + potong baru).
4. PPOB hapus: saldo kembali ke posisi semula.
5. Kas + shift terbuka: `cashier_shift_id` terisi, Kas Seharusnya shift berkurang sebesar pengeluaran.
6. Kas tanpa shift terbuka: tersimpan, `cashier_shift_id` null.
7. Bank: saldo PPOB & kas shift tidak berubah.
8. Laporan: filter sumber dana + ringkasan per sumber dana.
9. Regresi: pemotongan PPOB dari **penjualan PPOB** dan "Pengeluaran dari Laci" shift tidak terpengaruh.

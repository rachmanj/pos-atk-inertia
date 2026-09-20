# Spec: Default harga jual token PLN prabayar (bertingkat)

Tanggal: 20 Sep 2026 · permintaan Iwan · dikerjakan di dev dulu

## Aturan yang diminta
Di form/modal penjualan **Token PLN Prabayar** (POS Kasir dan halaman Transaksi), **harga jual default** dihitung bertingkat dari **nominal token**:
- **Nominal < Rp 1.000.000** → harga jual default = nominal + **Rp 5.000** (contoh: nominal 100.000 → **105.000**; margin setelah biaya provider 4.500 = **Rp 500**)
- **Nominal ≥ Rp 1.000.000** → harga jual default = nominal + **Rp 10.000** (contoh: nominal 1.000.000 → **1.010.000**; nominal 1.500.000 → 1.510.000)

Ketetapan lain:
- Harga jual **tetap bisa di-override** manual oleh kasir (perilaku sekarang dipertahankan).
- Batas bawah tetap **biaya provider** = nominal + `ppob_token_fee` (default 4.500) → validasi lama tidak berubah.
- Angka bertingkat disimpan sebagai **setelan** supaya bisa diubah tanpa deploy: `ppob_token_markup_below_1jt` (default **5000**) dan `ppob_token_markup_1jt_up` (default **10000**), ditambahkan ke halaman **Pengaturan Toko** seperti `ppob_token_fee`.
- `ppob_admin_fee` (default 2.000) **tidak lagi dipakai** untuk menghitung default token (dulu default = nominal + token_fee + admin_fee = +6.500). Jangan hapus setelannya (masih dipakai PPOB non-token).

## Titik perubahan
- `resources/js/Components/Pos/PosPpobModal.jsx` — perhitungan harga jual default token (2 tempat: nilai awal + reset saat nominal berubah).
- `resources/js/Pages/Account/Transactions/Create.jsx` — logika token yang sama.
- `app/Http/Controllers/Account/SettingController.php` + `resources/js/Pages/Account/Settings/Index.jsx` — dua setelan baru.
- Ringkasan di modal tetap menampilkan **"Biaya provider: Rp X · Admin fee: Rp Y"** dihitung dari harga jual yang dipakai (otomatis ikut).

## Tes
- Perhitungan batas: 99.999 → +5.000; 100.000 → +5.000; 999.999 → +5.000; **1.000.000 → +10.000**; 1.500.000 → +10.000.
- Override manual tidak tertimpa saat nominal diubah? **Ya tetap tertimpa** oleh default baru setiap nominal berubah (perilaku lama), tapi kasir selalu bisa mengubah harga setelahnya — pastikan tidak mengunci input.
- Validasi server: harga jual < biaya provider tetap ditolak.
- Setelan baru tersimpan & terbaca (nilai custom dipakai oleh form).

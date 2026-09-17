# Spec: PPN pada Modul Pembelian — POS Kasir (VASIA)

Status: **disetujui Iwan** (grill 17 Sep 2026 — "setuju semua").
Repo: `~/pos-atk-inertia`. Plan/diskusi: keputusan tertulis di bawah.

## 1. Goal

Modul Pembelian bisa mencatat **PPN** dari faktur supplier: input PPN sekali per nota, HPP/laba memakai harga beli **termasuk PPN**, dan tersedia rekap PPN Masukan per periode (siap dipakai lapor pajak).

## 2. Scope

**In:** satu nilai PPN per nota + toggle "harga item sudah termasuk PPN"; default tarif 11% (bisa diubah per nota); PPN masuk HPP (default, bisa dimatikan lewat kolom `hpp_includes_tax`); kolom DPP/PPN di daftar + detail pembelian; halaman **Laporan PPN Masukan** per periode + export Excel; nota lama dibiarkan PPN 0.
**Out:** perhitungan PPN per baris item (di-input manual), kredit pajak/PKP, faktur pajak elektronik, perubahan modul penjualan.

## 3. Tech decisions

- PPN disimpan di header `purchases`; alokasi PPN ke tiap baris **dihitung** (`round(PPN × subtotal_baris / total_item)`, baris terakhir menyerap pembulatan) dan disimpan di `purchase_details.tax_amount` supaya bisa dijumlahkan tanpa menghitung ulang.
- `total_amount` = **uang keluar** = DPP + PPN (rumus lama `Σ qty × buy_price` hanya berlaku bila PPN = 0 / tidak ada pajak).
- Harga beli per satuan dasar untuk `avg_cost`/`products.buy_price` dihitung dari **DPP + PPN** (bila `hpp_includes_tax` true) dibagi `qty × conversion_factor`.
- Semua kolom baru punya default 0/false → nota lama tetap valid; backfill `dpp_amount = total_amount` untuk baris lama.

## 4. DB changes (migrasi additive, tanpa backfill destruktif)

`purchases`:
| kolom | tipe | keterangan |
|---|---|---|
| dpp_amount | bigInteger default 0 | total DPP (dasar pengenaan pajak) |
| tax_amount | bigInteger default 0 | nilai PPN |
| tax_rate | decimal(5,2) nullable | tarif yang dipakai (mis. 11.00) |
| tax_included | boolean default false | true = harga item yang diinput sudah termasuk PPN |
| hpp_includes_tax | boolean default true | true = PPN dibebankan ke HPP |

`purchase_details`:
| kolom | tipe | keterangan |
|---|---|---|
| tax_amount | bigInteger default 0 | porsi PPN baris ini (hasil alokasi) |

Backfill: `UPDATE purchases SET dpp_amount = total_amount WHERE tax_amount = 0 AND dpp_amount = 0`.

## 5. UI/UX

- **Pembelian → Buat** (`Purchases/Create.jsx`): tambah blok **PPN**: input tarif (%) default `11`, input **Nilai PPN** (otomatis = tarif × total item, boleh diubah manual), toggle **"Harga item sudah termasuk PPN"**; ringkasan menampilkan **DPP · PPN · Total**.
- **Daftar Pembelian** (`Purchases/Index.jsx`): kolom **DPP** dan **PPN** (kolom Total tetap). Baris lama tampil PPN Rp 0.
- **Detail Pembelian** (`Purchases/Show.jsx`): baris **DPP**, **PPN (tarif)**, **Total** + kolom PPN per item.
- **Laporan PPN Masukan** (`/account/reports/purchase-tax`, menu **Laporan → PPN Masukan**, permission `purchases.index` = admin): filter periode (default bulan berjalan), ringkasan total DPP/PPN/jumlah nota, tabel per nota (tanggal, invoice, supplier, DPP, PPN, total) + **Export Excel**.
- Semua label bahasa Indonesia; angka pakai pemformatan rupiah yang ada.

## 6. Endpoints

| endpoint | perubahan |
|---|---|
| `POST /account/purchases` | terima `tax_amount`, `tax_rate`, `tax_included` (opsional; tanpa itu = perilaku lama, PPN 0) |
| `GET /account/purchases` | kirim kolom DPP/PPN |
| `GET /account/purchases/{invoice}` | kirim DPP/PPN + PPN per item |
| `GET /account/reports/purchase-tax` (+ `/export`) | **baru** — rekap PPN Masukan per periode |

## 7. Risks

1. **Salah hitung HPP** kalau alokasi PPN keliru → test wajib: `Σ PPN baris == purchases.tax_amount`, `dpp_amount + tax_amount == total_amount`, dan `avg_cost` = (DPP+PPN)/qty satuan dasar.
2. **Nota lama** harus tetap menghasilkan angka stok/HPP yang sama seperti sebelum migrasi (regresi).
3. Perubahan `total_amount` menyentuh tampilan daftar/detail — pastikan tidak ada laporan lain yang menghitung ulang dari `Σ qty × buy_price` secara diam-diam (sudah dicek: pemakai modul pembelian = stok, mutasi stok, laporan stok, retur supplier).
4. PPN yang diisi manual bisa tidak konsisten dengan tarif → tidak dipaksa sama; tarif hanya catatan (nilai PPN yang dipakai menghitung).

## 8. Rencana pengujian

- Test baru: alokasi PPN proporsional (termasuk penyerapan pembulatan), invariant DPP+PPN = total, HPP termasuk PPN, input tanpa PPN (= perilaku lama), `tax_included` (harga sudah termasuk) menghitung DPP = Σ item − PPN, rekap PPN per periode + export.
- Uji live: user uji admin → buat 1 pembelian uji ber-PPN di app live → cek DB + halaman detail + rekap PPN → **hapus pembelian uji** (stok & mutasi dibalikkan) dan verifikasi angka snapshot kembali.

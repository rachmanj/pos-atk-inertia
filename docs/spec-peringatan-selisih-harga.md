# Spec: Peringatan selisih harga satuan vs harga produk

Status: **siap diimplementasikan** (permintaan Iwan, 22 Sep 2026)
Cabang: `feat/peringatan-selisih-harga`

## Latar belakang (kenapa ini perlu)

Satu produk punya DUA harga:

- `products.sell_price` — "harga jual produk" (tampil di Master Produk & laporan).
- `product_units.sell_price` — harga per satuan; satu baris ditandai `is_default_sell = 1`.

**POS menagih dari `product_units.sell_price`** (`CartController`: `$productUnit?->sell_price ?? $product->sell_price`, 4 tempat). Jadi kalau dua angka ini berbeda tanpa disadari, kasir menagih angka yang berbeda dari yang dilihat pemilik di Master Produk.

Kasus nyata: impor massal lama menghasilkan **44 produk** dengan `harga satuan = harga produk × 1.000` (mis. `MEJA 1 LINE + KACA`: produk Rp 1.820 vs POS Rp 1.820.000). Ke-44 produk itu sudah dihapus 22 Sep 2026 dan master kini **0 selisih** dari 3.091 produk — pengaman ini supaya kejadian serupa tidak bisa lolos lagi (dari entri manual maupun impor).

## Perilaku yang diminta

1. **Tolak (blokir) simpan produk** bila selisih terlalu jauh dan tidak masuk akal:
   - Bandingkan `product_units.sell_price` (baris `is_default_sell = 1`) dengan `products.sell_price`.
   - Jika `unit_price > 0` dan `product_price > 0` dan rasionya **lebih dari 10× ke salah satu arah** (`unit/product > 10` ATAU `product/unit > 10`) → **tolak** dengan pesan Bahasa Indonesia yang menyebut kedua angka, contoh:
     *"Harga satuan (Rp 800.000) berbeda terlalu jauh dari harga jual produk (Rp 800) — selisih lebih dari 10×. Periksa kembali harga yang diisi."*
   - Jika `product_price > 0` dan `unit_price = 0` → **tolak** juga: *"Harga satuan belum diisi (Rp 0) sedangkan harga jual produk Rp 800."*
2. **Peringatan (tidak memblokir)** bila berbeda tapi masih wajar (rasio ≠ 1 dan ≤ 10×):
   - Di form produk (Create/Edit) tampilkan banner peringatan yang menyebut kedua angka: *"Harga satuan default (Rp 30.000) berbeda dari harga jual produk (Rp 27.000). Pastikan memang disengaja."*
   - Pesan ini informatif saja — simpan tetap boleh.
3. **Server tetap penentu akhir** (defense in depth): validasi 1 jalan di server (422 + pesan), peringatan 2 hanya bantuan UI.

## Cakupan

- `app/Http/Controllers/Account/ProductController@store` dan `@update` (termasuk endpoint yang dipakai form modal/edit cepat bila ada).
- **Jangan** menerapkan aturan blokir pada produk **PPOB** (harga jualnya dihitung dari nominal, baris satuan bisa Rp 0) maupun produk non-fisik/jasa — deteksi memakai penanda PPOB yang sudah ada di aplikasi (lihat `Setting::ppob_token_product_ids`, kolom `product_type`, atau cara aplikasi menandai produk PPOB; jelaskan pilihanmu di ringkasan).
- Jalur impor produk bila ada (Excel/CSV/artisan) harus ikut memakai aturan yang sama; kalau tidak ada jalur impor di aplikasi, tulis di ringkasan bahwa tidak ada.
- UI: `resources/js/Pages/Account/Products/Create.jsx` & `Edit.jsx` (atau nama file form produk yang sebenarnya) — banner peringatan di atas tombol simpan.

## Di luar cakupan

- Tidak mengubah data produk yang sudah ada (master sekarang sudah 0 selisih; **jangan** menyentuh harga produk mana pun).
- Tidak mengubah `CartController` (perilaku POS tetap).
- Tidak menambah kolom/migrasi baru (cukup validasi + UI).

## Uji wajib (`tests/Feature/ProductPriceGuardTest.php`)

1. Harga satuan default sama dengan harga produk → simpan sukses.
2. Harga satuan default 1.000× harga produk → **422**, pesan menyebut kedua angka.
3. Kebalikannya (harga produk 1.000× harga satuan) → **422**.
4. Harga satuan default ≤ 10× selisih (mis. 27.000 vs 30.000) → simpan sukses (tanpa blokir).
5. Harga jual produk > 0 tapi harga satuan 0 → **422**.
6. Jalur **update** produk juga diblokir dengan aturan yang sama.
7. Produk PPOB (harga jual dari nominal, satuan boleh 0) → **tidak** diblokir.
8. Produk dengan satuan tambahan (mis. Lusin) tetap bisa disimpan selama baris **default-sell** konsisten dengan harga produk.

Semua tes lama harus tetap hijau (`php artisan test`).

## Catatan implementasi

- Pesan error & peringatan **Bahasa Indonesia**; format angka Rupiah pakai pemformat yang sudah ada di aplikasi (mis. `Intl.NumberFormat('id-ID')` di front-end, `number_format` di back-end) — jangan bikin format baru.
- Taruh ambang batas dalam satu konstanta yang jelas (mis. `ProductPriceGuard::MAX_RATIO = 10`) supaya mudah diubah.
- Migrasi dijalankan hanya di DB dev `pos_kasir_preview` (tidak ada migrasi baru di spec ini).

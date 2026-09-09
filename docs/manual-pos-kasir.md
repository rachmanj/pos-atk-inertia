# Manual POS Kasir — VASIA Stationery

Versi: 1.0 (September 2026) · Aplikasi: VASIA POS (vasia.sbs)

---

## 1. Tentang POS Kasir

POS Kasir adalah halaman utama tempat kasir melayani transaksi penjualan di toko. Fungsinya:

- Mencari produk dengan cepat (ketik nama/barcode atau scan) tanpa harus hafal letak rak
- Menyusun keranjang belanja (tambah, ubah jumlah, diskon, tahan item)
- Menerima pembayaran Tunai, QRIS, Digital (Midtrans), atau Transfer Manual
- Menghitung otomatis total, diskon, dan kembalian
- Mencetak struk untuk pelanggan

Pintasan akses: menu **Penjualan → POS Kasir** atau buka langsung `/account/transactions/create`.

## 2. Sebelum Mulai

### 2.1 Login

1. Buka `https://vasia.sbs` → halaman **Masuk**.
2. Isi **username** dan **password** akun kasir yang diberikan admin (bukan email).
3. Klik tombol **Masuk**.

### 2.2 Buka Shift Kasir

Transaksi hanya bisa dimulai setelah shift kasir **dibuka**. Jika belum ada shift aktif, sistem otomatis mengarahkan ke halaman buka shift.

1. Menu **Penjualan → Shift Kasir**.
2. Klik tombol **Buka Shift** (catat saldo awal yang dibawa, jika diminta).
3. Shift aktif muncul sebagai banner hijau; halaman POS baru bisa dipakai.

> Shift ditutup di akhir jam kerja dari halaman yang sama (**Tutup Shift**) — setel saldo akhir lalu sistem menghitung selisih kas.

## 3. Alur Transaksi Ringkas

| Langkah | Aksi |
|---|---|
| 1 | Buka POS Kasir (wajib shift aktif) |
| 2 | Ketik nama/barcode produk, atau scan barcode |
| 3 | Klik produk di hasil pencarian → masuk keranjang |
| 4 | Atur jumlah/diskon, pilih pelanggan (opsional) |
| 5 | Pilih metode bayar → isi nominal |
| 6 | Klik **Bayar** (atau tekan **F2**) → struk |

## 4. Mencari & Memilih Produk

POS Kasir VASIA memakai konsep **search-first**: keranjang tampil penuh, produk dicari lewat kotak pencarian (daftar produk tidak ditampilkan permanen supaya layar bersih).

1. Klik kotak **"Ketik nama produk atau scan barcode untuk mencari"** di bagian atas.
2. Ketik sebagian nama, misal `stabilo` — hasil langsung muncul di dropdown di bawah kotak (berubah tiap karakter ketikan).
3. Klik produk yang dimaksud → otomatis masuk keranjang, dan **kotak pencarian kembali kosong** siap untuk produk berikutnya.
4. Jika produk tidak ditemukan: periksa ejaan nama/barcode, atau gunakan kata yang lebih pendek (misal `stabilo` saja, bukan `stabilo deli s600`).

Tips:

- Hasil pencarian juga cocok dengan **barcode** — ketik angka barcode langsung.
- **Scan barcode**: klik ikon kamera 📷 di samping kotak pencarian → izinkan akses kamera → arahkan ke barcode produk. Produk langsung masuk keranjang.
- Pintasan keyboard **F3** memindahkan kursor ke kotak pencarian tanpa menyentuh mouse.

## 5. Tipe Produk di Keranjang

| Tipe | Penjelasan | Cara menambah |
|---|---|---|
| Fisik (barang) | Produk biasa dengan stok | Cari → klik → masuk keranjang |
| Multi-satuan | 1 produk punya beberapa satuan jual (pcs/dus/lusin) | Cari → klik → pilih satuan → Tambah |
| Layanan (BOM) | Jasa/racikan yang mengurangi bahan baku | Cari → klik → masuk keranjang |
| PPOB (Digital) | Token listrik, bayar tagihan, pulsa — tanpa stok | Cari → klik → isi modal + fee di popup |

### 5.1 Contoh: Transaksi PPOB Listrik Pasca Bayar

Tagihan listrik pasca bayar (misal pelanggan bayar **Rp 257.000**) adalah produk tipe PPOB (nama produk contoh: **LISTRIK PASCA BAYAR**). Harga modal dan fee toko dimasukkan **saat transaksi**, bukan di katalog.

1. Ketik `listrik` (atau `pasca`) di kotak pencarian → klik **LISTRIK PASCA BAYAR**.
2. Popup terbuka, isi:
   - **No. Pelanggan / Meter / HP** — nomor meter/tagihan (opsional, untuk catatan)
   - **Harga Modal** — nominal yang dibayar toko ke provider, misal `255000`
   - **Admin Fee** — keuntungan toko, terisi otomatis dari pengaturan (contoh `2000`)
3. **Harga Jual** tampil otomatis = Modal + Fee → **Rp 257.000**.
4. Klik **Tambah ke Keranjang** → lanjut ke pembayaran seperti transaksi biasa.

> Rumus: *Harga Jual = Harga Modal + Admin Fee*. Jika fee default ingin diubah per transaksi, cukup edit kolom Admin Fee sebelum menambah.
>
> PPOB di aplikasi ini adalah pencatatan manual (booking): struk diberikan ke pelanggan, pembayaran tagihan ke provider dilakukan terpisah. Produk PPOB tidak memakai stok.

## 6. Mengelola Keranjang

- **Ubah jumlah**: tombol **− / +** di baris item, atau ketik langsung di kolom jumlah.
- **Hapus item**: klik ikon tempat sampah 🗑 di baris item.
- **Diskon per item**: klik toggle **Diskon** pada item → isi nominal/persen diskon.
- **Tahan item (hold)**: klik ikon **Tahan** (pause) → item pindah ke grup **Ditahan** (transparan). Item ditahan tidak ikut dihitung total dan bisa diambil lagi nanti (lihat bagian 11).
- Item yang sama ditambahkan dua kali otomatis **digabung** jumlahnya.
- Jika stok produk 0, produk **tetap bisa dijual** (badge "Habis" hanya sebagai informasi) — kecuali produk layanan yang bahan bakunya habis.

## 7. Pelanggan (Opsional)

Transaksi bisa langsung jalan tanpa memilih pelanggan (dihitung sebagai pembeli umum).

1. Di kolom pelanggan, ketik nama / No. HP untuk mencari.
2. Pilih dari hasil pencarian, atau klik **+ Pelanggan Baru** untuk membuat cepat tanpa keluar dari halaman POS.
3. Data pelanggan berguna untuk laporan dan retur.

## 8. Pembayaran

Pilih metode di bagian **Metode Pembayaran** (4 tombol: **Tunai · Digital · QRIS · Transfer**).

### 8.1 Tunai (uang cash)

1. Pilih **Tunai**.
2. Masukkan nominal **Uang Tunai** yang diterima — tombol nominal cepat (uang pas, 5rb–100rb) tersedia di bawah input.
3. **Kembalian** dihitung otomatis. Jika uang kurang, sistem menahan proses sampai nominal cukup.
4. Klik **Bayar**.

### 8.2 QRIS

1. Pilih **QRIS** → masukkan nominal yang diterima pelanggan (perlakuan sementara seperti tunai; tanda terima QRIS dicatat manual).

### 8.3 Digital (Midtrans)

1. Pilih **Digital** → sistem membuka popup pembayaran Midtrans (kartu, e-wallet, dsb).
2. Selesaikan pembayaran di popup. Status transaksi diambil dari notifikasi Midtrans — jika popup tertutup sebelum selesai, transaksi berstatus pending dan tervalidasi otomatis.

### 8.4 Transfer Manual (0% biaya)

1. Pilih **Transfer** → pelanggan transfer ke rekening toko.
2. Tidak ada input uang tunai; transaksi disimpan dengan status **Menunggu Konfirmasi**.
3. Setelah dana masuk dan dicek di rekening, konfirmasi dari halaman **Riwayat Transaksi** (lihat bagian 10).

## 9. Menyelesaikan Transaksi

1. Pastikan semua item, jumlah, dan metode bayar sudah benar.
2. Klik tombol **BAYAR** (oranye) atau tekan **F2**.
3. Sistem menyimpan transaksi → otomatis pindah ke halaman **Detail Transaksi** (nomor invoice).
4. Klik tombol cetak untuk **mencetak struk** (pilih ukuran kertas struk 58/80mm sesuai printer).

## 10. Konfirmasi Transfer Manual

Transaksi transfer manual berstatus *Menunggu Konfirmasi* sampai dana benar-benar diterima di rekening toko.

1. Menu **Penjualan → Riwayat Transaksi**.
2. Cari transaksi dengan status **Menunggu Konfirmasi** (tag kuning).
3. Buka detail → cek dana di rekening → klik **Konfirmasi Pembayaran**.
4. Status berubah menjadi **Lunas** (paid) dan tercatat di laporan penjualan/laba.

> Aksi konfirmasi butuh hak akses *edit transaksi* — jika tombol tidak muncul, minta admin menambahkan permission untuk kasir tersebut.

## 11. Item Ditahan (Hold)

Item yang ditahan (grup **Ditahan**) tidak ikut total dan bisa dilanjutkan kapan saja:

1. Untuk mengambil: klik item di grup Ditahan → item kembali ke keranjang aktif.
2. Item ditahan tersimpan selama shift berlangsung dan milik kasir yang sama.

## 12. Pintasan Keyboard

| Tombol | Fungsi |
|---|---|
| **F2** | Proses pembayaran (Bayar) |
| **F3** | Fokus ke kotak pencarian produk |
| **Esc** | Tutup popup yang terbuka |

## 13. FAQ / Troubleshooting

**Q: Produk tidak muncul saat diketik.**
Pastikan ejaan benar dan produk berstatus aktif. Produk hanya tampil lewat pencarian — saat kotak kosong memang tidak ada daftar produk (by design). Gunakan kata kunci lebih pendek.

**Q: Kenapa transaksi tidak bisa dibuka?**
Shift kasir belum dibuka. Buka shift dulu di **Penjualan → Shift Kasir**, atau minta kasir lain menutup shift-nya jika bergantian.

**Q: Barcode tidak ketemu padahal produk ada.**
Cek nomor barcode di **Master Data → Produk** (menu Produk). Jika barcode salah/kosong, perbaiki dari form edit produk; atau tambahkan produk via pencarian nama.

**Q: Stok menunjukkan 0 tapi produk tetap bisa dijual.**
Kebijakan toko saat ini memperbolehkan penjualan fisik walau stok kosong (badge "Habis" hanya info). Stok akan berkurang/minus dan harus dirapikan via stock opname.

**Q: Tombol Konfirmasi Pembayaran (transfer) tidak muncul.**
Akun kasir tidak punya permission edit transaksi. Minta admin menambahkan lewat **Pengaturan Sistem → Role**.

**Q: Bagaimana cara retur barang yang sudah dibeli?**
Gunakan menu **Penjualan → Retur Customer**, pilih invoice asal, isi item yang diretur.

**Q: Struk tidak tercetak / kosong.**
Periksa printer thermal terpilih dan ukuran kertas di pengaturan cetak detail transaksi (58mm/80mm).

## 14. Catatan Penting

- **Stok**: penjualan otomatis mengurangi stok; pembelian supplier menambahnya.
- **Laporan**: setiap transaksi langsung masuk Laporan Penjualan, Produk Terlaris, dan Laporan Laba.
- **Shift**: satu kasir satu shift aktif. Transaksi tercatat ke shift yang sedang berjalan.
- **PPOB**: pembayaran ke provider dilakukan manual oleh pemilik — aplikasi hanya mencatat modal, fee, dan memberi struk.
- Manual ini menjelaskan versi aplikasi saat ini; bila ada menu/tombol yang tidak sesuai, minta admin memperbarui manual.

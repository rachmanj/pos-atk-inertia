# Spec: Redesign layar POS Kasir mengikuti mockup B ("Nota Kerja")

Status: **disetujui Iwan 25 Sep 2026** — mockup pembanding: `docs/mockups/mockup-pos-B-nota-kerja.html`
Cabang: `feat/pos-redesign-nota-kerja`

## Tujuan

Layar POS Kasir menjadi **dua kolom**: kiri = pencarian + produk, kanan = panel keranjang yang digambar seperti **nota penjualan** (gaya struk) dan selalu menempel (sticky). Ini **penyusunan ulang tampilan + gaya**, bukan pembangunan ulang logika.

Mockup acuan bisa dibuka di browser: `docs/mockups/mockup-pos-B-nota-kerja.html` (interaktif, data contoh).

## Aturan keras (jangan dilanggar)

1. **Jangan mengubah logika, API, route, atau struktur data apa pun.** Semua handler, validasi, perhitungan keranjang, split payment, PPOB, modal satuan, modal pelanggan, dan proses checkout harus tetap persis. Perubahan hanya di JSX (struktur tampilan) + CSS.
2. **Harga & angka tetap dihitung oleh kode yang ada** (jangan menghitung ulang total di front-end dengan rumus baru).
3. **Angka uang tetap dari formatter yang sudah ada** (`formatRupiah` dsb.), jangan bikin formatter baru.
4. **Jangan memakai palet/font baru**: pakai token tema yang sudah ada (primary `#2A3B8F`, aksen `#FF6A2E` hanya untuk tombol Bayar + status kritis seperti stok menipis, latar kertas `#EFEDE3`, permukaan putih, garis `#C9C4B4`, teks `#1B1D29`). Untuk kolom angka pakai `font-variant-numeric: tabular-nums` pada font yang ada (opsional: satu font monospace untuk area nota bila sudah tersedia di pipeline font; jangan menambah dependency baru).
5. **Semua perilaku lama harus tetap bisa dilakukan**: cari/scan barcode, tambah produk, qty +/-, hapus item, catatan item, ubah satuan, pelanggan cepat, diskon, split payment, tunai/transfer, PPOB, pengeluaran, dan tombol-tombol aksi yang sudah ada.
6. **Mobile tetap seperti sekarang**: keranjang lewat Drawer; yang berubah hanya gayanya supaya konsisten dengan panel nota.
7. **Aksesibilitas**: fokus keyboard terlihat (`:focus-visible`), semua tombol bisa dijangkau Tab/Enter, dan pintasan **F9 = Bayar** (hanya bila tidak mengganggu pengetikan di input; jangan aktif saat fokus di dalam input/textarea/modal).

## Tata letak desktop (≥ 1024px)

Dua kolom: kiri `flex: 2.15` (min 0), kanan `minmax(320px, 1fr)`, `gap` 14px.

**Kolom kiri (panel putih, radius 12, border 1px garis):**
- Baris atas: input pencarian gaya "scan" (ikon barcode di dalam input, placeholder "Scan barcode di sini, atau ketik nama produk", autofocus) + pengalih tampilan **Kartu / Daftar** (segmented dua tombol) yang benar-benar berfungsi (daftar = baris lebih rapat, nama lebih panjang).
- Blok **"Produk Cepat"**: judul kecil huruf kapital + grid tile (4 kolom desktop, 2 kolom mobile) dengan gaya kotak garis putus-putus; satu klik langsung menambah ke keranjang (pakai alur yang sudah ada, termasuk modal satuan bila produk punya beberapa satuan). Kalau tidak ada produk cepat, tampilkan keadaan kosong yang jujur ("Belum ada produk cepat. Tandai dari Master Produk.") — jangan sembunyikan diam-diam.
- Grid kartu produk (`repeat(auto-fill, minmax(196px,1fr))`): garis penanda kategori 4px di tepi kiri dengan warna turunan tema (mis. Kertas cokelat-tinta, Pulpen/Pensil hijau, Kuas & Cat merah-tinta, lainnya primary), nama produk (2 baris), harga + `/satuan`, dan lencana stok kanan bawah; stok ≤ 8 pakai gaya peringatan (aksen `#FF6A2E` redup).
- Keadaan kosong hasil pencarian & keadaan kosong "belum ada produk" harus ada kalimatnya.
- Paginasi/"muat lagi" mengikuti mekanisme yang sudah ada (jangan ganti cara ambil data).

**Kolom kanan (panel "NOTA PENJUALAN", sticky `top: 12px`, `max-height: calc(100vh - 24px)`, isi tengah bisa di-scroll):**
- Kepala nota: judul **NOTA PENJUALAN**, baris kecil berisi nomor nota sementara (mis. "Nota baru · <nama kasir>") + jumlah item, dan tombol kecil "Kosongkan".
- Daftar item gaya struk: tiap baris = nama (monospace/tabular), baris kecil `qty × harga`, nominal di kanan, dan aksi `− 1` / `+ 1` / `Hapus` (pakai handler yang sudah ada). Pemisah antar baris garis putus-putus.
- Kaki nota: Subtotal, Diskon, **TOTAL** (baris tebal bergaris atas), lalu **Uang diterima** (input uang + tombol cepat 50.000 / 100.000 / Pas / Reset yang sudah ada), **Kembalian**, pemilih metode pembayaran, dan tombol **Bayar** besar beraksen dengan label pintasan `F9`.
- Tombol/aksi sekunder yang sudah ada tetap ada (PPOB, pengeluaran, dll) — jangan dihapus.
- Keranjang kosong: keadaan kosong dengan kalimat jelas (mis. "Keranjang masih kosong. Pilih produk di kiri atau scan barcode.").

## Gaya (ringkas)

- Garis pemisah nota **putus-putus**; kartu produk **solid tipis**; radius 8–12 konsisten (jangan semua pill).
- Naikkan hierarki lewat ukuran/berat huruf, bukan lewat bayangan; hindari bayangan besar dan glow.
- Tidak ada teks Mandarin; seluruh teks Bahasa Indonesia.
- Jangan memakai em dash (—) di teks UI.

## Yang tidak termasuk

- Logika baru, fitur baru, kolom DB baru, migrasi, atau perubahan controller/route.
- Mengubah flow split payment / PPOB / cetak struk.
- Menyentuh halaman lain di luar layar POS Kasir.

## Uji & verifikasi wajib

1. `php artisan test` seluruh suite tetap **hijau** (jangan ada tes lama yang berubah hasilnya).
2. `npm run build` sukses.
3. Buktikan di browser (dev): layar POS tampil dua kolom, cari produk menambah item ke nota, qty +/− dan hapus bekerja, uang diterima & kembalian terhitung, tombol Bayar tetap memproses seperti sebelumnya, dan tampilan mobile (Drawer) tidak rusak. Laporkan apa yang benar-benar sudah dicoba.
4. Jangan commit dan jangan push; tinggalkan perubahan di working tree.

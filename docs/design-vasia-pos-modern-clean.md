# VASIA POS - Proposal "Modern Clean" (Pass 1: Brainstorm)

Status: draft proposal, belum ada kode yang diubah.
Konteks teknis: Laravel 12 + Inertia + React + Ant Design. Tema saat ini "Tinta & Nota" (lihat `docs/design-vasia-pos-redesign.md`, `resources/js/theme/colors.js`, `zenTheme.js`, `ThemeContext.jsx`). Komponen kunci: `PosProductGrid`, `PosCartPanel`, `PosPaymentSummary`, `Sidebar`.

Arahan Iwan untuk pass ini: pivot dari nuansa tinta/nota (biru tinta pekat + oranye stabilo di atas kertas buram) ke "modern clean SaaS" bergaya landing page e-course: putih terang, Poppins + Inter, radius lembut 10-14px, pastel hangat sebagai aksen. Ini BUKAN landing page, jadi setiap keputusan tetap ditarik kembali ke kebutuhan kasir: scan cepat, tap presisi, angka harga besar dan jelas.

## Ide besar: "Highlighter Pastel"

Toko ATK menjual highlighter/stabilo pastel (mis. lini "Boss Pastel") yang warnanya sudah lembut secara alami tapi tetap dipakai untuk satu tujuan fungsional: menandai bagian paling penting dari sebuah teks. Konsep ini memindahkan logika itu ke UI: dua warna hangat yang diambil dari rak highlighter pastel milik toko sendiri, masing-masing dengan satu tugas fungsional yang tidak tertukar (aksi vs highlight harga). Ini menghindari "pastel generik ala Pinterest" karena palet punya sumber yang spesifik (produk yang benar-benar dijual di toko ATK) dan aturan pemakaian yang ketat.

## 1. Color

Prinsip: tetap satu hue aksen utama + satu hue aksen sekunder dengan peran fungsional berbeda (sesuai gate maks 3 core + 1 aksen, di sini kita bahkan hanya pakai 2 hue brand total). Empat warna sisanya murni struktural (background, surface, teks, border) sehingga tidak ikut bersaing sebagai "warna brand" tambahan.

| Nama | Hex | Peran | Alasan |
|---|---|---|---|
| Pink Stabilo | `#D9376A` | Accent utama | Diambil dari warna highlighter pastel pink yang dijual di rak ATK, digelapkan dari versi pucatnya supaya kontras teks putih di atasnya lolos AA (diuji ~4,46:1); dipakai eksklusif untuk tombol Bayar dan state aktif (kategori terpilih, tab terpilih) supaya selalu berarti "aksi/pilihan di sini", bukan sekadar hiasan. |
| Kuning Stabilo | `#E8A93A` | Accent sekunder (fungsi: highlight harga) | Kuning adalah warna highlighter paling ikonik untuk "menggarisbawahi yang penting"; dipakai HANYA sebagai lapisan latar tipis di belakang angka harga (sapuan stabilo, lihat bagian 4), tidak pernah untuk tombol, supaya kasir tidak pernah bingung antara "warna aksi" dan "warna info harga". Dites: sebagai latar di bawah teks Arang Hangat kontrasnya ~7,2:1 (sangat aman); sebagai teks di atas putih polos kontrasnya cuma ~2:1, karena itu warna ini dikunci sebagai warna latar/tint, bukan warna teks. |
| Putih Awan | `#FDFBF8` | Netral - background halaman | Putih hangat setipis mungkin (bukan cream pekat `#F4F1EA` yang klise dan bukan abu dingin AntD `#f0f2f5`); cukup terang untuk kesan "bersih modern" tapi tidak menyilaukan mata kasir yang menatap layar 8 jam per shift. |
| Putih Kertas | `#FFFFFF` | Netral - surface kartu/panel | Kartu produk, panel keranjang, dan modal dibuat lebih terang murni dari background supaya "mengambang" jelas di atas halaman, membuat tepi grid produk cepat di-scan mata kasir khas kartu SaaS modern. |
| Arang Hangat | `#2B2622` | Netral - teks utama | Nyaris hitam tapi bernuansa hangat (bukan hitam pekat generik atau slate dingin AntD); kontras terhadap Putih Awan/Putih Kertas di atas 13:1, prioritas mutlak untuk kasir yang harus baca angka secepat mungkin. |
| Abu Krayon | `#EDE4D8` | Netral - border/divider | Abu kecoklatan lembut meniru warna serutan kayu pensil/krayon, konsisten dengan dunia ATK, cukup redup supaya tidak jadi "warna ketiga" yang bersaing dengan pink/kuning. |

Kenapa ini BUKAN 3 default AI look:

- Bukan cream + serif + terracotta: background memang putih hangat, tapi tanpa serif (Poppins/Inter keduanya geometris-humanis) dan aksennya pink-rose + kuning mustard, bukan terracotta oranye-tanah.
- Bukan near-black + acid-green: arah sebaliknya total - dasar putih terang, teks gelap hangat, tanpa hijau neon di mana pun.
- Bukan broadsheet: tidak ada grid kolom koran, tidak ada garis editorial tebal, tidak ada tipografi surat kabar.
- Bukan "pastel generik": kedua hue brand punya sumber konkret (rak highlighter pastel toko sendiri) dan pembagian tugas fungsional eksplisit (pink = aksi, kuning = highlight harga), bukan dipilih karena "pastel lagi tren".

## 2. Type

| Role | Font | Alasan |
|---|---|---|
| Heading (judul section, nama toko, judul modal) | Poppins (600/700) | Arahan Iwan; geometris, ramah, dan cukup tegas untuk judul tanpa terasi kaku ala korporat. |
| Body / UI (label form, teks tombol sekunder, teks AntD, nama produk di list) | Inter (400/500/600) | Netral, sangat terbaca di ukuran kecil pada layar kasir dan HP low-end, dan `system-ui` sebagai fallback menjaga performa render di PWA. |
| Harga (angka rupiah di kartu produk, baris keranjang, total pembayaran) | Poppins Bold/ExtraBold + `font-variant-numeric: tabular-nums` | Dipilih di atas font mono: mono cocok untuk estetika "struk kasir" (itu identitas Tinta & Nota), tapi di arah modern-clean, angka yang memakai keluarga font judul yang sama (Poppins, hanya lebih berat) terasa satu sistem visual dengan heading, bukan tempelan gaya lain. `tabular-nums` tetap dipakai supaya digit rupiah rata kolom (Rp6.000 vs Rp12.500 sejajar), tanpa harus mengorbankan konsistensi tipografi. |

Size scale (dipakai konsisten lintas komponen, bukan nilai bebas per halaman):

| Ukuran | Font & weight | Contoh pemakaian |
|---|---|---|
| 12px | Inter Medium | Badge stok, label kecil, keterangan satuan |
| 14px | Inter Regular/Medium | Meta produk, nama kategori pill, teks form |
| 16px | Inter Medium/SemiBold | Body dasar, teks tombol sekunder, input |
| 20px | Poppins SemiBold | Judul section ("Keranjang"), nama produk di list view |
| 28px | Poppins Bold, tabular-nums | Harga di kartu grid produk (paling sering dipindai mata kasir) |
| 36px | Poppins ExtraBold, tabular-nums | Angka TOTAL di ringkasan pembayaran - satu-satunya angka terbesar di seluruh aplikasi, karena ini yang paling sering ditanyakan pelanggan dan wajib terbaca dari jarak agak jauh (mis. layar customer display). |

## 3. Radius & spacing system

Radius per komponen (rentang 10-14px sesuai arahan, dengan satu pengecualian pill untuk chip):

| Komponen | Radius | Alasan |
|---|---|---|
| Kartu produk (grid tile & list row) | 14px | Elemen terbesar dan paling sering dilihat, radius terlembut supaya kesan "modern clean" paling terasa di sini. |
| Modal / drawer keranjang mobile | 14px | Disamakan dengan kartu supaya drawer terasa satu keluarga visual dengan konten di baliknya. |
| Tombol (Bayar, tombol sekunder) | 12px | Sedikit lebih tajam dari kartu supaya tombol tetap terasa "bisa ditekan", bukan melebur jadi dekorasi. |
| Input, search bar, select | 10px | Radius terkecil di antara elemen interaktif supaya area ketik/scan terasa presisi, tidak "kebulatan" saat dipakai cepat oleh kasir. |
| Kategori pill, badge, tag status | 999px (pill penuh) | Pengecualian sengaja: bentuk pil klasik untuk elemen pilih-cepat (chip kategori) memberi afordansi "bisa ditap satu jari", umum di pola SaaS modern, dan membedakan chip dari kartu produk secara bentuk sekilas. |

Spacing scale (4/8/12/16/24/32, dipakai sebagai token tunggal, bukan nilai px acak):

| Token | Nilai | Pemakaian |
|---|---|---|
| xs | 4px | Gap ikon-teks, jarak dalam badge kecil |
| sm | 8px | Padding dalam tag/pill, gap antar elemen inline |
| md | 12px | Gap antar kartu produk dalam grid |
| lg | 16px | Padding dalam kartu/panel, gap antar baris keranjang |
| xl | 24px | Jarak antar section (search bar ke grid, cart list ke ringkasan bayar) |
| xxl | 32px | Gutter layout utama (sidebar ke konten, margin halaman) |

## 4. Signature: Sapuan Stabilo (Highlighter Swipe)

Elemen: sebuah persegi panjang rounded pastel (`Kuning Stabilo` pada opacity 20-25%, atau `Pink Stabilo` versi pucat untuk konteks lain) yang diposisikan sebagai layer `::before` di belakang angka harga, dirotasi tipis (-1.5deg) agar terasa "digariskan tangan", bukan blok kotak sempurna. Murni CSS (`background-color` + `border-radius` + `transform: rotate()` + `z-index: -1`), tanpa gambar/aset, ringan untuk PWA di HP low-end.

Kenapa ini memorable dan tidak playful berlebihan:

- Fungsional dulu, dekoratif kedua: elemen ini secara harfiah menjawab requirement "angka harga harus besar dan jelas" - sapuan pastel menambah kontras area tanpa menaikkan saturasi teks itu sendiri.
- Rotasi kecil (-1.5deg) memberi sentuhan "ditandai tangan" tanpa jatuh ke ilustrasi kartun; tidak ada karakter/maskot, tidak ada animasi bouncy.
- Kompetitor POS (Moka, Pawoon, Qasir, dst.) umumnya menampilkan harga sebagai teks polos atau badge kotak solid; sapuan stabilo miring adalah detail kecil namun sangat spesifik ke identitas "toko ATK yang jual highlighter", langsung terasa berbeda begitu dilihat.
- Dipakai konsisten di tiga tempat saja (harga kartu grid, harga baris keranjang, angka TOTAL) supaya tetap terasa "aksen", bukan pola berulang di semua elemen yang bikin mata lelah.

## 5. Design Read (dials)

| Dial | Nilai (1-3) | Alasan |
|---|---|---|
| ENERGY | 2 | Background putih terang + dua aksen hangat cukup hidup untuk terasa "modern", tapi mayoritas layar tetap netral (putih/arang) supaya mata kasir tidak lelah sepanjang shift. |
| RHYTHM | 2 | Grid produk tetap padat dan konsisten dengan gap 12px yang jelas antar kartu; cukup rapat untuk memuat banyak produk per layar, tapi kartu dan area tap kategori (pill) tetap cukup besar untuk jari di HP. |
| MOTION | 1 | Transisi dibatasi ketat (hover lift halus di desktop, durasi 120-150ms, hanya untuk konfirmasi tap/tambah ke keranjang); gaya "modern SaaS" sering pakai animasi masuk/hover yang lebih berat, tapi di POS kecepatan input mengalahkan showreel visual - kasir tidak pernah menunggu animasi selesai untuk transaksi berikutnya. |

## 6. Delivery Gate awal (Hard Gate cepat)

- Ada em dash di dokumen ini? Tidak.
- Ada gradient tanpa tujuan? Tidak - proposal ini tidak memakai gradient background/hero sama sekali; opsi "gradasi pastel tipis" pada kartu sengaja tidak diambil di Pass 1 ini karena bisa menurunkan kontras harga, cukup dipakai sebagai catatan opsional untuk elemen non-kritis (mis. header kartu ringkasan shift) di Pass berikutnya bila dibutuhkan.
- Warna lebih dari 3 core + 1 aksen? Tidak - hanya 2 hue brand total (Pink Stabilo sebagai accent utama, Kuning Stabilo sebagai accent sekunder fungsional), jauh di bawah batas; sisanya netral struktural (background, surface, teks, border).
- Clone produk POS lain? Tidak - konsep "highlighter pastel dari rak toko sendiri + sapuan stabilo di belakang harga" diambil dari identitas dagangan ATK, bukan meniru Moka/Pawoon/Square/Loyverse.

## Catatan implementasi untuk Pass 2 (belum dieksekusi)

- `resources/views/app.blade.php`: font link Google Fonts saat ini memuat `Plus Jakarta Sans`, `Space Grotesk`, `JetBrains Mono` (identitas Tinta & Nota); perlu diganti/ditambah `Poppins:wght@600;700;800` + `Inter:wght@400;500;600`.
- `colors.js`: tambah grup baru (mis. `ACCENT2` untuk Kuning Stabilo) tanpa langsung menghapus `BRAND`/`ACCENT`/`PAPER` lama, supaya Tinta & Nota tetap bisa dibandingkan berdampingan sebelum keputusan final Iwan.
- `zenTheme.js`: `fontFamily` ganti ke `"'Inter', system-ui, sans-serif"` untuk token AntD umum, heading pakai override khusus ke Poppins di CSS (AntD `token.fontFamily` hanya satu nilai global).
- `PosProductGrid.jsx` (`.pos-product-meta strong`) dan `PosPaymentSummary.jsx` (`.pos-summary-total strong`): tambah wrapper untuk elemen sapuan stabilo (`::before` pseudo-element via class `.pos-price-highlight`).
- `.pos-category-pill`: radius diubah dari radius kartu ke `999px` (pill penuh), warna aktif pakai `#D9376A` solid + teks putih.

Pass ini murni proposal, belum ada file kode yang diubah.

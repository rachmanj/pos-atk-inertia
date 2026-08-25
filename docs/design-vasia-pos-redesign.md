# VASIA POS - Proposal Redesign Visual (Pass 1: Brainstorm)

Status: draft proposal, belum ada kode yang diubah.
Konteks teknis: Laravel 12 + Inertia + React + Ant Design. Palet lama ada di `resources/js/theme/colors.js`, `zenTheme.js`, `ThemeContext.jsx`. Komponen kunci: `PosProductGrid`, `PosCartPanel`, `PosPaymentSummary`, `Sidebar`.

## Ide besar: "Tinta & Nota"

VASIA jualan alat tulis, jadi identitas visualnya diambil dari benda yang paling akrab dengan pelanggan toko ATK: tinta ballpoint, stabilo/highlighter, dan kertas nota/struk. Ini bukan tema "kertas mahal ala jurnal butik", tapi kertas kerja sehari-hari khas toko ATK Indonesia: kertas buram, nota rangkap, dan sobekan struk kasir.

## 1. Color

Prinsip: hanya SATU warna hue utama (primary) dan SATU warna hue aksen (accent). Sisanya adalah netral struktural (kertas, permukaan, tinta teks, garis) yang tidak bersaing sebagai "warna brand" kedua/ketiga, jadi total tetap sesuai gate "maks 3 core + 1 aksen".

| Nama | Hex | Peran | Alasan |
|---|---|---|---|
| Biru Tinta Pekat | `#2A3B8F` | Primary | Warna tinta ballpoint biru-hitam yang dipakai menulis nota dan buku kas toko ATK; kuat, dipercaya untuk konteks transaksi uang, dan jauh dari teal generik SaaS. |
| Oranye Stabilo | `#FF6A2E` | Accent (satu-satunya) | Warna highlighter/stabilo yang di toko ATK dipakai menandai hal penting; dipakai eksklusif untuk tombol "Bayar" dan status kritis (stok nyaris habis), jadi selalu berarti "aksi/perhatian di sini". |
| Kertas Buram | `#EFEDE3` | Netral - latar halaman | "Kertas buram" adalah istilah asli Indonesia untuk kertas daur ulang murah yang dipakai di sekolah/toko ATK; abu-hangat, bukan cream latte, dan tidak melelahkan mata kasir yang menatap layar 8 jam. |
| Putih Kanvas | `#FFFFFF` | Netral - permukaan kartu | Kartu produk dan panel keranjang perlu kontras lebih terang dari latar kertas buram agar hierarki "meja kerja vs kertas kerja" terasa, tanpa menambah hue baru. |
| Tinta Pekat (teks) | `#1B1D29` | Netral - teks utama | Hitam kebiruan (bukan hitam pekat generik) meniru warna tinta pena yang sudah mengering di atas kertas; lebih lembut untuk dibaca lama dibanding `#000000`. |
| Abu Kertas Daur Ulang | `#C9C4B4` | Netral - garis/border | Warna serat kertas recycled untuk pembatas antar-elemen, memastikan garis tidak terasa "digital cold-gray" seperti slate default Tailwind. |

Kenapa BUKAN cream+serif+terracotta: latar `#EFEDE3` memang off-white, tapi dipasangkan dengan font sans-serif geometris (bukan serif) dan aksen oranye stabilo (bukan terracotta), plus identitas datang dari tinta ballpoint/nota kasir, bukan estetika jurnal/kafe butik.

## 2. Type

| Role | Font | Alasan |
|---|---|---|
| Display (judul, nama kategori, harga besar di kartu produk) | Space Grotesk | Geometris dan tegas, punya karakter "label harga gantung" tanpa jatuh ke Inter/Poppins generik. Tersedia gratis di Google Fonts. |
| Body (nama produk, label form, teks UI Ant Design) | Plus Jakarta Sans | Humanis, x-height besar, sangat terbaca di ukuran kecil pada layar kasir dan HP; rendering karakter Indonesia (diakritik jarang tapi tetap rapi) bagus. Google Fonts. |
| Utility - angka & harga | JetBrains Mono (tabular numerals) | Monospace membuat digit rupiah rata kolom secara sempurna (Rp 6.000 vs Rp 12.500 tetap sejajar), meniru estetika struk thermal printer, dan mempercepat kasir membaca total sekilas. Google Fonts. |

## 3. Layout

Konsep satu kalimat: grid produk mendominasi sisi kiri sebagai "meja display barang" yang bisa di-scroll bebas, sementara panel kanan berfungsi seperti "buku kas" yang selalu menempel (sticky) menampilkan keranjang dan total supaya kasir tidak pernah kehilangan angka yang sedang diproses.

### Desktop (grid produk kiri, keranjang+bayar kanan, sticky)

```
┌───────────────────────────────────────────────┬─────────────────────────┐
│ [🔍 Scan barcode / cari produk........] [Cari] │  KERANJANG         🧺3  │
├───────────────────────────────────────────────┼─────────────────────────┤
│ (Semua)(ATK)(Buku)(Seragam)(Fotokopi)(PPOB)→   │ Pulpen Standard      x2 │
├╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍│   @Rp6.000    Rp12.000  │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │ ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈ │
│ │  📦    │ │  📦    │ │  📦    │ │  📦    │   │ Buku Tulis 38 lbr   x1 │
│ │ Pulpen │ │ Pensil │ │ Buku   │ │Penggrs │   │   @Rp4.500     Rp4.500  │
│ │Rp 6.000│ │Rp 3.000│ │Rp 4.500│ │Rp 8.000│   │ ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈ │
│ └────────┘ └────────┘ └────────┘ └────────┘   │ Pelanggan: [Umum      ▾]│
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   ├─────────────────────────┤
│ │  ...   │ │  ...   │ │  ...   │ │  ...   │   │ Subtotal      Rp16.500  │
│ └────────┘ └────────┘ └────────┘ └────────┘   │ Diskon            Rp0   │
│                                                 │ TOTAL         Rp16.500  │
│              «  1  2  3  4  5  »               │ [Tunai][Digital][QRIS]  │
│                                                 │ ┏━━━━━━━━━━━━━━━━━━━━┓ │
│                                                 │ ┃    BAYAR (F9)      ┃ │
│                                                 │ ┗━━━━━━━━━━━━━━━━━━━━┛ │
└───────────────────────────────────────────────┴─────────────────────────┘
```

Baris `┈┈┈` antar item keranjang meniru garis putus nota rangkap; baris `╍╍╍` di bawah kategori adalah signature "sobekan nota" (dijelaskan di bagian 4).

### Mobile (grid produk full-width, cart jadi bilah bawah yang bisa ditarik)

```
┌─────────────────────────────┐
│ [🔍 Scan/cari produk...][📷]│
├─────────────────────────────┤
│ (Semua)(ATK)(Buku)(Fotokopi)→│
├─────────────────────────────┤
│ ┌──────────┐ ┌──────────┐   │
│ │  Pulpen  │ │  Pensil  │   │
│ │ Rp 6.000 │ │ Rp 3.000 │   │
│ └──────────┘ └──────────┘   │
│ ┌──────────┐ ┌──────────┐   │
│ │   Buku   │ │ Penggrs  │   │
│ │ Rp 4.500 │ │ Rp 8.000 │   │
│ └──────────┘ └──────────┘   │
│         «  1  2  3  »        │
│                              │
╿╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╿  ← tepi sobek, tarik ke atas
│ 🧺 3 item · Total Rp16.500 ▲│
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃        BAYAR             ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
└─────────────────────────────┘
```

Alasan mempercepat kasir:

- Desktop: keranjang dan total selalu terlihat tanpa scroll (sticky), jadi kasir tidak perlu bolak-balik cek angka saat pelanggan tanya total, langsung fokus di grid untuk klik produk berikutnya.
- Mobile: satu bilah bawah setinggi jempol menyimpan ringkasan + tombol bayar, area tap terbesar untuk aksi paling sering diulang (bayar), dan grid produk mendapat ruang vertikal maksimal karena keranjang detail hanya muncul saat ditarik.

## 4. Signature: Sobekan Nota (Torn Receipt Edge)

Elemen: garis pembatas bergerigi/zig-zag (`clip-path` CSS, bukan gambar) yang muncul di dua titik: antara strip kategori dan grid produk (desktop), dan di tepi atas bilah keranjang mengambang (mobile). Bentuknya meniru sobekan kertas struk thermal printer saat dirobek dari rol.

Kenapa ini memorable: hampir semua POS kompetitor (Moka, Pawoon, Qasir, dst.) memakai garis lurus atau shadow flat untuk memisahkan panel. Sobekan nota adalah detail kecil tapi sangat spesifik ke dunia kasir/nota, langsung terasa "milik toko ATK" begitu dilihat, dan tidak butuh ilustrasi/maskot yang berat untuk PWA di HP low-end.

## 5. Design Read (dials)

| Dial | Nilai (1-3) | Alasan |
|---|---|---|
| ENERGY | 2 | Aksen oranye stabilo cukup berani untuk menarik perhatian ke tombol bayar, tapi latar kertas buram netral menjaga mata kasir tidak lelah setelah 8 jam shift. |
| RHYTHM | 2 | Grid produk padat dan konsisten dengan gap jelas antar kartu; cukup rapat untuk memuat banyak produk per layar, tapi kartu tetap cukup besar untuk ditekan jari di HP tanpa salah pencet. |
| MOTION | 1 | Transisi minim (durasi pendek, sekitar 120-150ms) hanya untuk konfirmasi tap/tambah ke keranjang; POS kasir mengutamakan kecepatan input, bukan showreel animasi yang memperlambat alur transaksi. |

## 6. Delivery Gate awal (Hard Gate cepat)

- Ada em dash? Tidak.
- Ada gradient tanpa tujuan? Tidak, tidak ada gradient sama sekali di proposal ini; semua permukaan flat, kontras dibentuk lewat warna dan garis sobekan nota.
- Warna lebih dari 3 core + 1 aksen? Tidak, hanya 1 hue primary (biru tinta) + 1 hue aksen (oranye stabilo); sisanya netral struktural (kertas, kanvas, tinta teks, garis) yang tidak bersaing sebagai warna brand.
- Clone produk POS lain? Tidak, konsep tinta/nota/sobekan struk diambil dari budaya toko ATK Indonesia sendiri, bukan meniru Moka/Pawoon/Square/dsb.

## Catatan pemetaan ke komponen existing (untuk referensi Pass 2, belum dieksekusi)

- `colors.js`: ganti `BRAND.primary` dari `#0d9488` ke `#2A3B8F`, tambah `ACCENT.highlighter = "#FF6A2E"`, tambah grup `PAPER` untuk `#EFEDE3` / `#FFFFFF`.
- `zenTheme.js`: `colorPrimary` ikut ganti, `fontFamily` jadi `"'Plus Jakarta Sans', sans-serif"`, tombol primary (`Button` component token) pakai token khusus aksen untuk CTA bayar saja, bukan seluruh `colorPrimary`.
- `PosProductGrid.jsx` / CSS `.pos-category-strip`: tambah elemen sobekan nota (`clip-path`) di bawah strip kategori.
- `PosCartPanel.jsx` / `PosPaymentSummary.jsx`: tombol "Proses Pembayaran" (`.pos-pay-button`) jadi satu-satunya tempat warna oranye stabilo dipakai sebagai fill solid.
- Harga di `PosProductGrid` (`.pos-product-meta strong`) dan `PosPaymentSummary` (`.pos-summary-box strong`) pakai font utility `JetBrains Mono` dengan `font-variant-numeric: tabular-nums`.

Pass ini murni proposal, belum ada file kode yang diubah.

## Pass 2 (2026-08-25): SEMANTIC harmonization + login page — dieksekusi

Status: selesai. Lihat `docs/decisions.md` ("Tinta & Nota — SEMANTIC palette harmonization + login page identity") untuk rasional lengkap.

- `SEMANTIC` (`colors.js`) diganti dari warna stock (`#22c55e`/`#f59e0b`/`#ef4444`/`#3b82f6`) ke nuansa tinta: `success #2F6F4E`, `warning #8F5F22` (sengaja beda hue & lebih gelap dari `ACCENT.highlighter` agar tidak tertukar tombol Bayar), `error #8B2E3B`, `info #2A3B8F` (= `BRAND.primary`).
- Login page (`Login.jsx` + `.pos-login-*` di `app.css`): latar gradient biru tinta gelap→pekat (`#10143A → #1F2C6E → #2A3B8F`), meniru sampul buku tulis — dipilih di atas latar kertas buram terang supaya halaman login terasa "sampul depan toko", beda dari "kertas kerja" di dalam app. Kartu form tetap putih/kanvas. Tombol "Masuk" pakai stabilo oranye solid (`#FF6A2E`), konsisten dengan aturan aksen eksklusif untuk aksi utama. Satu aksen sobekan nota (`.pos-login-torn`) di kolom brand.

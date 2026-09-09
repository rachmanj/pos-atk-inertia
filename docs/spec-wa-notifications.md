# Fitur Notifikasi WA — VASIA POS (vasia.sbs)

Keputusan grill-me 2026-09-09 (Iwan). Infra: **WA-Hub** GEEKOM `http://100.87.250.66:8090` (project `vasia-pos` id 2, session default pratasaba, nomor keluar 6287867021173). Env VASIA: `WAHUB_BASE_URL`, `WAHUB_API_KEY` (file ~/.hermes/secrets/wa_hub_vasia_key.txt), `WAHUB_ADMIN_WHATSAPP=628115428871`.

## Fitur 1 — Kirim Rekap Shift via WA (manual)
- Tombol di halaman **Detail Shift (status CLOSED saja)**; kasir hanya shift miliknya, admin semua shift.
- Modal: **preview teks** (server yang menyusun) + input opsional Pengeluaran Lain (nominal, default 0, + keterangan) → tombol Kirim.
- Isi pesan (template draft):
  - Header: REKAP SHIFT — VASIA Stationery; kasir; rentang shift.
  - Total Penjualan − Non-Tunai (QRIS/Transfer) − Pengeluaran Lain = **Tunai Disetor**.
  - Rincian non-tunai per transaksi: jam, metode, total, invoice. Transfer ditandai "*cek rekening, konfirmasi di app*".
  - Satu baris info: "PPOB tunai: RpX (N trx) termasuk di atas".
- Formula (definisi): Total Penjualan = Σ grand_total transaksi non-voided dalam rentang shift (cash & qris & digital paid + transfer SEMUA status non-voided — transfer dianggap berhasil di kasir). Non-Tunai = qris paid + digital paid + transfer (non-voided, semua status). PPOB tunai = transaksi berisi detail ppob (ppob_cost not null) & dibayar cash. Refund tunai approved → pengurang Tunai Disetor (baris "Retur tunai −RpX").
- Log: tabel outbound; riwayat kiriman tampil di Detail Shift (waktu, pengirim, status). Kirim ulang kapan saja = hitung ulang fresh.
- Pengirim pesan ke WA-Hub: POST /api/v1/messages {to (normalize 08→62), text}, Bearer key. Status WA-Hub: queued→sent/delivered (hub sync sendiri; status app disimpan saat kirim: queued/sent/failed + wa_message_id).

## Fitur 2 — Notif otomatis transaksi non-tunai
- Pemicu: transaksi **qris** (paid langsung) & **transfer** (pending — notif langsung saat dibuat, kasir tidak menunggu) & **digital** (Midtrans — saat sukses/paid).
- Isi ringkas per transaksi: Kasir · jam · Metode · Total · Invoice. Transfer + "*cek rekening, konfirmasi di app*".
- Kirim SETELAH DB commit, pakai queue; kegagalan WA TIDAK menggagalkan transaksi (try/catch, log, report()).
- Tujuan: nomor settings `whatsapp.admin_number` (default 628115428871), bisa diubah di halaman Settings.

## Konfigurasi (Settings page, group whatsapp)
- whatsapp.admin_number (nomor admin tujuan)
- whatsapp.nontunai_enabled (toggle notif otomatis; default 1)
- Tombol "Kirim WA Uji" → kirim test ke nomor admin, tampilkan status.

## Tabel log (migration)
`whatsapp_outbound_logs`: id, purpose (shift_report|payment_notification), cashier_shift_id null, transaction_id null, to_number, message_text, status (queued|sent|failed), wa_message_id null, error null, created_by, timestamps.

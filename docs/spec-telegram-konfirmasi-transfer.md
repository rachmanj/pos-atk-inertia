# Spec: Command Telegram untuk konfirmasi transaksi transfer

Tanggal: 20 Sep 2026 · permintaan Iwan: "siapkan telegram command untuk konfirmasi transaksi yang perlu dikonfirmasi" · dikerjakan di dev dulu

## Perilaku yang diminta
Bot VASIA (`telegram-poll.service`, dispatch `app/Services/Telegram/TelegramUpdateHandler.php`) punya command baru **`/konfirmasi`** untuk transaksi **transfer manual yang menunggu konfirmasi** (payment_status `pending` + ada bagian transfer pending).

1. **`/konfirmasi` tanpa argumen** → tampilkan daftar transaksi transfer pending bernomor:
   ```
   Menunggu konfirmasi transfer (2):
   1. TRX-20260920-A09B26 · 20 Sep 2026, 21.31 · Nabila · Rp 781.028
   2. ...
   Balas: /konfirmasi 1   (atau /konfirmasi TRX-20260920-A09B26)
   ```
   - Scope: **admin melihat semua; kasir hanya transaksinya sendiri** (sama seperti query lain: `->when(! $user->isAdminUser(), fn ($q) => $q->where('cashier_id', $user->id))`).
   - Kalau tidak ada: "Tidak ada transaksi transfer yang menunggu konfirmasi." + sertakan umur transaksi (`hari ini` / `kemarin` / `N hari lalu`).
2. **`/konfirmasi <nomor|TRX-...>`** → tampilkan **pratinjau** (invoice, tanggal, kasir, metode, total) lalu minta konfirmasi bertahap: `Balas ya untuk konfirmasi, atau tidak untuk membatalkan.` (pending disimpan di `Cache::put($this->pendingConfirmationKey($telegramId), ['kind' => 'confirm_transfer', 'invoice' => ...])`).
3. **Balas `ya`** → jalankan konfirmasi (status → `paid`/`completed`, `paid_at` diisi, profit di-update) lalu balas hasil: `✅ TRX-… dikonfirmasi. Total Rp … · Status: Lunas/Selesai`. Balas **`tidak`** → `Dibatalkan.` `/batal` juga harus membatalkan kind ini.
4. **Gate izin**: pakai izin yang sama dengan UI (`transactions.edit`); kasir hanya boleh mengonfirmasi transaksi miliknya; kalau bukan haknya → pesan ramah ("Transaksi ini bukan milik Anda." / "Perintah ini tidak tersedia untuk akun Anda."), bukan error teknis.
5. Perbarui **`helpText()`** (satu baris `/konfirmasi`) dan daftar menu bot (`setMyCommands`) — menu dikirim manual lewat bot API dengan token dari env (jangan cetak token).

## Aturan teknis (wajib)
- **Aksi = service app, bukan logika baru di bot**: pindahkan logika inti konfirmasi dari `TransactionController::confirmTransfer()` ke service bersama (mis. `app/Services/TransactionConfirmationService.php`, method `confirmTransfer(Transaction $transaction): void` — termasuk update `transaction_payments` bila ada baris pembayaran + update profit) dan **pakai service itu dari controller maupun bot**. Controller tetap menangani redirect/HTTP saja; perilaku HTTP tidak boleh berubah (termasuk perbaikan UX terakhir: redirect kembali ke halaman asal).
- Jangan menyentuh alur PPOB/pending `topup`/`purchase` yang sudah ada; tambahkan `kind` baru **sebelum** blok existing di `handlePendingConfirmation()` dan pastikan `/batal` tetap membatalkan semua kind.
- Command baru didaftarkan di `handlePosCommand()` (`match`)… atau cabang command sendiri, dengan `normalizeCommand()`.
- Bahasa pesan: Indonesia, singkat, angka pakai `TelegramFormatter::idr()`, data dinamis pakai `e()`.
- **Jangan** melakukan aksi apa pun kalau transaksi ternyata sudah paid → balas "Transaksi ini sudah lunas."; kalau bukan transfer → "Transaksi ini bukan transfer manual."

## Tes (wajib; DB sementara; JANGAN mengirim Telegram sungguhan)
- Parser/dispatch: `/konfirmasi` tanpa arg (ada & tidak ada transaksi pending), `/konfirmasi 1`, `/konfirmasi TRX-...`, nomor tidak valid, invoice tidak ada, transaksi sudah lunas, bukan transfer.
- Alur ya/tidak: `ya` → status jadi paid/completed + profit ter-update + pesan sukses; `tidak` → tidak ada perubahan; pending kedaluwarsa → pesan ramah.
- Scope: kasir mengonfirmasi transaksi kasir lain → ditolak; admin → boleh.
- Tes memakai fake client (subclass `TelegramBotClient`, ganti binding container) supaya **tidak ada pesan yang benar-benar terkirim**.

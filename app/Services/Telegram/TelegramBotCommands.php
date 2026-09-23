<?php

namespace App\Services\Telegram;

class TelegramBotCommands
{
    /**
     * @return list<array{command: string, description: string}>
     */
    public static function definitions(): array
    {
        return [
            ['command' => 'start', 'description' => 'Sapaan & status akun'],
            ['command' => 'help', 'description' => 'Bantuan format perintah'],
            ['command' => 'status', 'description' => 'Shift & akun PPOB'],
            ['command' => 'cari', 'description' => 'Cari produk'],
            ['command' => 'stok', 'description' => 'Cek stok produk'],
            ['command' => 'produk', 'description' => 'Daftar produk acak'],
            ['command' => 'transaksi', 'description' => 'Transaksi hari ini'],
            ['command' => 'saldo', 'description' => 'Saldo PPOB'],
            ['command' => 'topup', 'description' => 'Top up saldo PPOB (admin)'],
            ['command' => 'shift', 'description' => 'Status shift kasir'],
            ['command' => 'laporan', 'description' => 'Ringkasan penjualan hari ini'],
            ['command' => 'pending', 'description' => 'Transfer belum dikonfirmasi'],
            ['command' => 'konfirmasi', 'description' => 'Konfirmasi transfer pending'],
            ['command' => 'batal', 'description' => 'Batalkan pending'],
        ];
    }
}

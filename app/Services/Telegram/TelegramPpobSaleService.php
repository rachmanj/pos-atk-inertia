<?php

namespace App\Services\Telegram;

use App\Models\PpobAccount;
use App\Models\Product;
use App\Models\Setting;
use App\Models\Transaction;
use App\Models\User;
use App\Services\CheckoutService;
use DomainException;

class TelegramPpobSaleService
{
    public function __construct(
        protected CheckoutService $checkoutService,
    ) {}

    public function execute(User $user, Product $product, TelegramPpobIntent $intent): string
    {
        if (! $product->isPpob() || ! $product->is_active) {
            throw new DomainException('Produk PPOB tidak aktif atau tidak valid.');
        }

        if (! $user->activeCashierShift) {
            throw new DomainException('Buka shift kasir terlebih dahulu sebelum memproses transaksi.');
        }

        $ppobAccount = PpobAccount::activeAccount();

        if (! $ppobAccount) {
            throw new DomainException('Akun PPOB aktif belum dikonfigurasi.');
        }

        $adminFee = $intent->adminFee ?? Setting::ppobSettings()['ppob_admin_fee'];
        $unitPrice = $intent->unitPpobCost + $adminFee;
        $grandTotal = $unitPrice * $intent->qty;

        $transaction = $this->checkoutService->checkoutFromLines($user, [
            [
                'product_id' => $product->id,
                'qty' => $intent->qty,
                'price' => $unitPrice,
                'unit_id' => null,
                'ppob_cost' => $intent->unitPpobCost,
                'admin_fee' => $adminFee,
                'customer_ref' => $intent->customerRef,
            ],
        ], [
            'payment_method' => 'cash',
            'cash' => $grandTotal,
            'note' => 'Telegram: ' . $intent->raw,
        ]);

        return $this->formatSuccessMessage($user, $product, $intent, $transaction, $adminFee, $ppobAccount->fresh());
    }

    public function buildConfirmationMessage(Product $product, TelegramPpobIntent $intent): string
    {
        $adminFee = $intent->adminFee ?? Setting::ppobSettings()['ppob_admin_fee'];
        $unitPrice = $intent->unitPpobCost + $adminFee;
        $grandTotal = $unitPrice * $intent->qty;
        $totalPpob = $intent->unitPpobCost * $intent->qty;
        $totalAdmin = $adminFee * $intent->qty;

        $lines = [
            'Konfirmasi transaksi:',
            "<b>{$product->title}</b> × {$intent->qty}",
            'Biaya: ' . TelegramFormatter::idr($totalPpob) . ' + admin ' . TelegramFormatter::idr($totalAdmin),
            'Total: ' . TelegramFormatter::idr($grandTotal),
            '',
            'Balas <b>ya</b> untuk proses, <b>tidak</b> untuk batal.',
        ];

        if ($intent->customerRef) {
            array_splice($lines, 2, 0, ['Ref: ' . e($intent->customerRef)]);
        }

        return implode("\n", $lines);
    }

    public function estimateGrandTotal(TelegramPpobIntent $intent): int
    {
        $adminFee = $intent->adminFee ?? Setting::ppobSettings()['ppob_admin_fee'];

        return ($intent->unitPpobCost + $adminFee) * $intent->qty;
    }

    protected function formatSuccessMessage(
        User $user,
        Product $product,
        TelegramPpobIntent $intent,
        Transaction $transaction,
        int $adminFee,
        PpobAccount $ppobAccount,
    ): string {
        $shift = $user->activeCashierShift;
        $totalPpob = $intent->unitPpobCost * $intent->qty;
        $totalAdmin = $adminFee * $intent->qty;

        $lines = [
            '✅ <b>Transaksi PPOB berhasil</b>',
            '',
            'Invoice: <code>' . $transaction->invoice . '</code>',
            'Produk: ' . e($product->title),
            "Qty: {$intent->qty}",
        ];

        if ($intent->customerRef) {
            $lines[] = 'Ref: ' . e($intent->customerRef);
        }

        $lines[] = 'Biaya PPOB: ' . TelegramFormatter::idr($intent->unitPpobCost) . ' × ' . $intent->qty . ' = ' . TelegramFormatter::idr($totalPpob);
        $lines[] = 'Admin: ' . TelegramFormatter::idr($adminFee) . ' × ' . $intent->qty . ' = ' . TelegramFormatter::idr($totalAdmin);
        $lines[] = 'Total: ' . TelegramFormatter::idr($transaction->grand_total);
        $lines[] = 'Kasir: ' . e($user->name);

        if ($shift) {
            $lines[] = "Shift: #{$shift->id} (open)";
        }

        if ($ppobAccount->isLowBalance()) {
            $lines[] = '';
            $lines[] = '⚠️ Saldo PPOB rendah: ' . TelegramFormatter::idr($ppobAccount->current_balance);
        }

        return implode("\n", $lines);
    }
}

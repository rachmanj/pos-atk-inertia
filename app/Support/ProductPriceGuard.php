<?php

namespace App\Support;

use Illuminate\Validation\ValidationException;

class ProductPriceGuard
{
    public const MAX_RATIO = 10;

    public static function appliesTo(string $productType): bool
    {
        return $productType === 'physical';
    }

    public static function assertValid(int $productPrice, int $unitPrice): void
    {
        $message = self::blockingMessage($productPrice, $unitPrice);

        if ($message !== null) {
            throw ValidationException::withMessages([
                'sell_price' => $message,
            ]);
        }
    }

    public static function blockingMessage(int $productPrice, int $unitPrice): ?string
    {
        if ($productPrice > 0 && $unitPrice === 0) {
            return sprintf(
                'Harga satuan belum diisi (Rp %s) sedangkan harga jual produk Rp %s.',
                self::formatAmount(0),
                self::formatAmount($productPrice),
            );
        }

        if ($productPrice <= 0 || $unitPrice <= 0) {
            return null;
        }

        if ($productPrice === $unitPrice) {
            return null;
        }

        if (self::priceRatio($productPrice, $unitPrice) > self::MAX_RATIO) {
            return sprintf(
                'Harga satuan (Rp %s) berbeda terlalu jauh dari harga jual produk (Rp %s) — selisih lebih dari 10×. Periksa kembali harga yang diisi.',
                self::formatAmount($unitPrice),
                self::formatAmount($productPrice),
            );
        }

        return null;
    }

    public static function warningMessage(int $productPrice, int $unitPrice): ?string
    {
        if ($productPrice <= 0 || $unitPrice <= 0 || $productPrice === $unitPrice) {
            return null;
        }

        if (self::priceRatio($productPrice, $unitPrice) <= self::MAX_RATIO) {
            return sprintf(
                'Harga satuan default (Rp %s) berbeda dari harga jual produk (Rp %s). Pastikan memang disengaja.',
                self::formatAmount($unitPrice),
                self::formatAmount($productPrice),
            );
        }

        return null;
    }

    private static function priceRatio(int $productPrice, int $unitPrice): float
    {
        return max($unitPrice / $productPrice, $productPrice / $unitPrice);
    }

    private static function formatAmount(int $amount): string
    {
        return number_format($amount, 0, ',', '.');
    }
}

<?php

namespace App\Services\Telegram;

use InvalidArgumentException;

class TelegramCommandParser
{
    public function __construct(
        protected TelegramMoneyParser $moneyParser,
    ) {}

    public function isBuyCommand(string $text): bool
    {
        $normalized = mb_strtolower(trim($text));

        return (bool) preg_match('/^(beli|ppob|jual)\s+/u', $normalized);
    }

    public function parseBuyCommand(string $text): TelegramPpobIntent
    {
        $raw = trim($text);
        $normalized = mb_strtolower($raw);

        if (! preg_match('/^(beli|ppob|jual)\s+(.+)$/u', $normalized, $intentMatch)) {
            throw new InvalidArgumentException('Format perintah beli tidak valid.');
        }

        $body = trim($intentMatch[2]);
        $rawBody = $this->matchingTail($raw, $intentMatch[1]);
        $adminFee = null;
        $customerRef = null;
        $unitPpobCost = null;
        $qty = null;

        if (preg_match('/\badmin\s+([\d.,]+(?:\s*(?:rb|ribu|jt|juta))?|rp\.?\s*[\d.,]+(?:\s*(?:rb|ribu|jt|juta))?)/iu', $body, $adminMatch)) {
            $adminFee = $this->moneyParser->parse($adminMatch[1]);
            $body = trim(str_replace($adminMatch[0], '', $body));
            $rawBody = trim(str_ireplace($adminMatch[0], '', $rawBody));
        }

        if (preg_match('/\b(?:di|untuk|ref|customer)\s+(.+?)(?=\s+(?:total|@|sebesar|harga|biaya)\s|$)/iu', $body, $refMatch)) {
            $customerRef = trim($this->matchingRef($rawBody, $refMatch[1]));
            $body = trim(str_replace($refMatch[0], '', $body));
            $rawBody = trim(str_ireplace($refMatch[0], '', $rawBody));
        }

        if (preg_match('/\btotal\s+(.+)$/iu', $body, $totalMatch)) {
            $amount = $this->moneyParser->parse(trim($totalMatch[1]));
            $body = trim(str_replace($totalMatch[0], '', $body));
            [$productQuery, $qty] = $this->extractProductAndQty($body);
            $unitPpobCost = $this->divideCost($amount, $qty);
        } elseif (preg_match('/@\s*(.+)$/iu', $body, $unitMatch)) {
            $unitPpobCost = $this->moneyParser->parse(trim($unitMatch[1]));
            $body = trim(str_replace($unitMatch[0], '', $body));
            [$productQuery, $qty] = $this->extractProductAndQty($body);
        } else {
            throw new InvalidArgumentException(
                "Tentukan biaya dengan kata kunci <b>total</b> (biaya keseluruhan) atau <b>@</b> (biaya per unit).\n"
                . "Contoh:\n"
                . "• beli meterai 100 total 1jt\n"
                . "• beli meterai 100 @10rb"
            );
        }

        if ($customerRef !== null && mb_strlen($customerRef) > 100) {
            throw new InvalidArgumentException('Referensi pelanggan maksimal 100 karakter.');
        }

        return new TelegramPpobIntent(
            raw: $raw,
            productQuery: $productQuery,
            qty: $qty,
            customerRef: $customerRef,
            unitPpobCost: $unitPpobCost,
            adminFee: $adminFee,
        );
    }

    protected function extractProductAndQty(string $body): array
    {
        $body = trim($body);

        if (preg_match('/^(.+?)\s+(\d+)\s*(?:lembar|lbr|pcs|buah)?\s*$/iu', $body, $matches)) {
            return [trim($matches[1]), max(1, (int) $matches[2])];
        }

        if (preg_match('/^(\d+)\s+(.+)$/u', $body, $matches)) {
            return [trim($matches[2]), max(1, (int) $matches[1])];
        }

        throw new InvalidArgumentException('Qty dan nama produk tidak dapat dibaca. Contoh: beli meterai 100 total 1jt');
    }

    protected function divideCost(int $totalAmount, int $qty): int
    {
        if ($qty <= 0) {
            throw new InvalidArgumentException('Qty harus minimal 1.');
        }

        if ($totalAmount % $qty !== 0) {
            throw new InvalidArgumentException(
                '❌ ' . TelegramFormatter::idr($totalAmount) . " tidak bisa dibagi rata ke {$qty} lembar. Gunakan angka yang habis dibagi {$qty}."
            );
        }

        return (int) ($totalAmount / $qty);
    }

    protected function matchingTail(string $raw, string $intentWord): string
    {
        if (preg_match('/^(beli|ppob|jual)\s+(.+)$/iu', $raw, $matches)) {
            return trim($matches[2]);
        }

        return trim(mb_substr($raw, mb_strlen($intentWord) + 1));
    }

    protected function matchingRef(string $rawBody, string $normalizedRef): string
    {
        if (preg_match('/\b(?:di|untuk|ref|customer)\s+(.+?)(?=\s+(?:total|@|sebesar|harga|biaya)\s|$)/iu', $rawBody, $rawMatch)) {
            return trim($rawMatch[1]);
        }

        return $normalizedRef;
    }
}

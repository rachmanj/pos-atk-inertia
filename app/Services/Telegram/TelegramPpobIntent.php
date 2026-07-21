<?php

namespace App\Services\Telegram;

use InvalidArgumentException;

class TelegramPpobIntent
{
    public function __construct(
        public readonly string $raw,
        public readonly string $productQuery,
        public readonly int $qty,
        public readonly ?string $customerRef,
        public readonly int $unitPpobCost,
        public readonly ?int $adminFee,
        public readonly string $paymentMethod = 'cash',
    ) {}

    public function toArray(): array
    {
        return [
            'raw' => $this->raw,
            'product_query' => $this->productQuery,
            'qty' => $this->qty,
            'customer_ref' => $this->customerRef,
            'unit_ppob_cost' => $this->unitPpobCost,
            'admin_fee' => $this->adminFee,
            'payment_method' => $this->paymentMethod,
        ];
    }

    public static function fromArray(array $data): self
    {
        return new self(
            raw: $data['raw'],
            productQuery: $data['product_query'],
            qty: (int) $data['qty'],
            customerRef: $data['customer_ref'] ?? null,
            unitPpobCost: (int) $data['unit_ppob_cost'],
            adminFee: isset($data['admin_fee']) ? (int) $data['admin_fee'] : null,
            paymentMethod: $data['payment_method'] ?? 'cash',
        );
    }
}

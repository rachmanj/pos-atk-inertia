<?php

namespace App\Services\Telegram;

use App\Models\Product;
use Illuminate\Support\Collection;

class PpobProductMatcher
{
    public function match(string $query, int $limit = 10): Collection
    {
        $normalized = trim(mb_strtolower($query));

        if ($normalized === '') {
            return collect();
        }

        $exactBarcode = Product::query()
            ->ppob()
            ->where('is_active', true)
            ->whereRaw('LOWER(barcode) = ?', [$normalized])
            ->get();

        if ($exactBarcode->isNotEmpty()) {
            return $exactBarcode;
        }

        return Product::query()
            ->ppob()
            ->where('is_active', true)
            ->where(function ($builder) use ($normalized) {
                $builder->whereRaw('LOWER(title) LIKE ?', ['%' . $normalized . '%'])
                    ->orWhereRaw('LOWER(barcode) LIKE ?', ['%' . $normalized . '%']);
            })
            ->orderBy('title')
            ->limit($limit)
            ->get();
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Cart extends Model
{

    protected function casts(): array
    {
        return [
            'qty' => 'integer',
            'price' => 'integer',
            'ppob_cost' => 'integer',
            'admin_fee' => 'integer',
            'discount' => 'integer',
            'is_held' => 'boolean',
        ];
    }

    protected $fillable = [
        'cashier_id',
        'product_id',
        'unit_id',
        'qty',
        'price',
        'customer_ref',
        'ppob_cost',
        'admin_fee',
        'discount_type',
        'discount',
        'is_held',
    ];

    public function lineGross(): int
    {
        return (int) $this->price * (int) $this->qty;
    }

    public function lineDiscountAmount(): int
    {
        $gross = $this->lineGross();
        $value = (int) ($this->discount ?? 0);

        if ($value <= 0 || $gross <= 0) {
            return 0;
        }

        $amount = ($this->discount_type ?? 'nominal') === 'percent'
            ? (int) round($gross * $value / 100)
            : $value;

        return min($amount, $gross);
    }

    public function lineNet(): int
    {
        return $this->lineGross() - $this->lineDiscountAmount();
    }

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }
}

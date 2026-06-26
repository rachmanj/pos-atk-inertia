<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransactionDetail extends Model
{
    protected function casts(): array
    {
        return [
            'qty' => 'integer',
            'price' => 'integer',
            'buy_price' => 'integer',
            'subtotal' => 'integer',
            'conversion_factor' => 'decimal:4',
            'ppob_cost' => 'integer',
            'admin_fee' => 'integer',
        ];
    }

    protected $fillable = [
        'transaction_id',
        'product_id',
        'unit_id',
        'conversion_factor',
        'qty',
        'price',
        'buy_price',
        'subtotal',
        'customer_ref',
        'ppob_cost',
        'admin_fee',
    ];

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function qtyInBaseUnits(): int
    {
        return (int) round((float) $this->conversion_factor * (int) $this->qty);
    }
}

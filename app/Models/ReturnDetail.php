<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReturnDetail extends Model
{

    protected function casts(): array
    {
        return [
            'qty' => 'integer',
            'price' => 'integer',
            'subtotal' => 'integer',
            'restock' => 'boolean',
            'conversion_factor' => 'decimal:4',
        ];
    }

    protected $fillable = [
        'return_transaction_id',
        'product_id',
        'unit_id',
        'conversion_factor',
        'qty',
        'price',
        'subtotal',
        'restock',
    ];

    public function returnTransaction(): BelongsTo
    {
        return $this->belongsTo(ReturnTransaction::class);
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

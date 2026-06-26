<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductUnit extends Model
{
    protected function casts(): array
    {
        return [
            'conversion_factor' => 'decimal:4',
            'sell_price' => 'integer',
            'is_base_unit' => 'boolean',
            'is_default_sell' => 'boolean',
        ];
    }

    protected $fillable = [
        'product_id',
        'unit_id',
        'conversion_factor',
        'sell_price',
        'is_base_unit',
        'is_default_sell',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }
}

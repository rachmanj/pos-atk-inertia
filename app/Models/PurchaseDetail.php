<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseDetail extends Model
{

    protected function casts(): array
    {
        return [
            'qty' => 'integer',
            'buy_price' => 'integer',
            'subtotal' => 'integer',
            'conversion_factor' => 'decimal:4',
        ];
    }

    protected $fillable = [
        'purchase_id',
        'product_id',
        'unit_id',
        'conversion_factor',
        'qty',
        'buy_price',
        'subtotal',
    ];

    public function purchase(): BelongsTo
    {
        return $this->belongsTo(Purchase::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function supplierReturnDetails(): HasMany
    {
        return $this->hasMany(SupplierReturnDetail::class);
    }

    public function qtyInBaseUnits(): int
    {
        return (int) round((float) $this->conversion_factor * (int) $this->qty);
    }
}
